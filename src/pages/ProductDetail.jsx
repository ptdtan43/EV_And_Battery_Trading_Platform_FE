import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Gauge,
  Battery,
  Car,
  Shield,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Truck,
  CreditCard,
  MessageSquare,
  Users,
  Package,
  X,
  XCircle,
  Clock,
  Flag,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { createOrder } from "../lib/orderApi";
import { createPayment } from "../api/payment";
import { formatPrice } from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { toggleFavorite, isProductFavorited } from "../lib/favoriteApi";
import { VerificationButton } from "../components/common/VerificationButton";
import { ChatModal } from "../components/common/ChatModal";
import { ReportModal } from "../components/common/ReportModal";

// Helper function to fix Vietnamese character encoding
const fixVietnameseEncoding = (str) => {
  if (!str || typeof str !== "string") return str;

  // Only fix if the string contains the specific encoding issues
  if (!str.includes("?")) {
    return str;
  }

  // Common encoding fixes for Vietnamese characters
  const fixes = {
    "B?o": "Bảo",
    "Th?ch": "Thạch",
    "Nguy?n": "Nguyễn",
    "Tr?n": "Trần",
    "Ph?m": "Phạm",
    "H?:ng": "Hồng",
    "Th?y": "Thủy",
    "M?nh": "Mạnh",
    "V?n": "Văn",
    "Th?": "Thị",
    "Qu?c": "Quốc",
    "Vi?t": "Việt",
    "B?c": "Bắc",
    "Đ?ng": "Đông",
  };

  let fixed = str;
  Object.entries(fixes).forEach(([wrong, correct]) => {
    fixed = fixed.replace(new RegExp(wrong.replace("?", "\\?"), "g"), correct);
  });

  return fixed;
};

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show: showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [images, setImages] = useState([]);
  const [documentImages, setDocumentImages] = useState([]);
  const [inspectedSet, setInspectedSet] = useState(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  useEffect(() => {
    console.log("ProductDetail - ID from params:", id);
    if (id && id !== "undefined") {
      loadProduct();
    } else {
      console.error("Invalid product ID:", id);
      setLoading(false);
    }
  }, [id]);

  // ✅ Listen for payment success and redirect to homepage
  useEffect(() => {
    const handlePaymentSuccess = (event) => {
      try {
        const data = event.data || {};
        
        // Filter out extension messages
        if (data.posdMessageId || data.type === 'VIDEO_XHR_CANDIDATE' || data.from === 'detector') {
          return;
        }
        
        if (data.type === 'EVTB_PAYMENT_SUCCESS' && data.payload) {
          console.log('[ProductDetail] Payment success received, redirecting to homepage');
          
          const { paymentId, amount, paymentType } = data.payload;
          const frontendUrl = window.location.origin;
          const redirectUrl = `${frontendUrl}/?payment_success=true&payment_id=${paymentId}&amount=${amount}&transaction_no=${data.payload.transactionNo}`;
          
          // Redirect to homepage
          window.location.replace(redirectUrl);
        }
        
        // Also handle redirect message
        if (data.type === 'EVTB_REDIRECT' && data.url) {
          console.log('[ProductDetail] Redirect message received, going to:', data.url);
          window.location.replace(data.url);
        }
      } catch (error) {
        console.error('[ProductDetail] Error handling payment message:', error);
      }
    };
    
    // Also check localStorage periodically
    const checkLocalStorage = () => {
      try {
        const paymentDataStr = localStorage.getItem('evtb_payment_success');
        if (paymentDataStr) {
          const paymentData = JSON.parse(paymentDataStr);
          const isRecent = (Date.now() - paymentData.timestamp) < 10000;
          
          if (isRecent && !paymentData.processed) {
            console.log('[ProductDetail] Found recent payment in localStorage, redirecting...');
            const frontendUrl = window.location.origin;
            const redirectUrl = `${frontendUrl}/?payment_success=true&payment_id=${paymentData.paymentId}&amount=${paymentData.amount}&transaction_no=${paymentData.transactionNo}`;
            window.location.replace(redirectUrl);
          }
        }
      } catch (error) {
        console.error('[ProductDetail] Error checking localStorage:', error);
      }
    };
    
    window.addEventListener('message', handlePaymentSuccess);
    
    // Check localStorage every 500ms for first 10 seconds
    const interval = setInterval(checkLocalStorage, 500);
    const timeout = setTimeout(() => clearInterval(interval), 10000);
    
    return () => {
      window.removeEventListener('message', handlePaymentSuccess);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      // Load product details
      const productData = await apiRequest(`/api/Product/${id}`);

      // Normalize product data to ensure frontend compatibility
      const normalizedProduct = {
        ...productData,
        id: productData.productId || productData.id,
        productId: productData.productId || productData.id,
        sellerId: productData.sellerId || productData.seller_id,
        title: productData.title || productData.name,
        price: productData.price || 0,
        images: productData.imageUrls || productData.images || [],
        status: productData.status || "Available",
      };

      console.log("[ProductDetail] Raw product data:", productData);
      console.log("[ProductDetail] Normalized product:", normalizedProduct);

      // Check if product is sold or reserved
      const productStatus = String(normalizedProduct.status || "").toLowerCase();
      if (productStatus === "sold") {
        console.log("[ProductDetail] Product is sold, showing sold message");
        // Set product with sold status
        setProduct({ ...normalizedProduct, status: "Sold" });
        setLoading(false);
        return;
      } else if (productStatus === "reserved") {
        console.log("[ProductDetail] Product is reserved, showing reserved message");
        // Set product with reserved status
        setProduct({ ...normalizedProduct, status: "Reserved" });
        setLoading(false);
        return;
      }

      setProduct(normalizedProduct);

      // Load seller information
      const sellerId = normalizedProduct.sellerId;
      if (sellerId) {
        try {
          const sellerData = await apiRequest(`/api/User/${sellerId}`);
          // Fix Vietnamese encoding for seller name
          if (sellerData.fullName) {
            sellerData.fullName = fixVietnameseEncoding(sellerData.fullName);
          }
          setSeller(sellerData);
          console.log("Loaded seller data:", sellerData);
        } catch (sellerError) {
          console.warn("Could not load seller data:", sellerError);
          // Set fallback seller data
          setSeller({
            fullName: fixVietnameseEncoding(
              productData.sellerName || "Người bán"
            ),
            email: productData.sellerEmail || "",
            phone: productData.sellerPhone || "",
            avatar: null,
          });
        }
      }

      // Load product images and separate product images from document images
      try {
        const imagesData = await apiRequest(`/api/ProductImage/product/${id}`);
        const allImages = Array.isArray(imagesData)
          ? imagesData
          : imagesData?.items || [];

        console.log("🔍 All images data:", allImages);
        console.log("🔍 First image structure:", allImages[0]);

        // Separate product images from document images based on Name field
        const productImages = allImages.filter((img) => {
          const imageName = (img.name || img.Name || "").toLowerCase();
          console.log(`🔍 Image name for ${img.id || "unknown"}:`, imageName);

          // Check if this is a product image based on Name field (case insensitive)
          if (imageName === "vehicle" || imageName === "battery" || imageName === "car" || imageName === "product") {
            console.log(
              `🔍 Image ${img.id}: treating as PRODUCT (${imageName})`
            );
            return true;
          }

          // If no name field or unknown name, check imageType as fallback
          const imageType =
            img.imageType || img.type || img.image_type || img.category;
          if (imageType && imageType !== "document") {
            console.log(
              `🔍 Image ${img.id}: treating as PRODUCT (imageType: ${imageType})`
            );
            return true;
          }

          console.log(
            `🔍 Image ${img.id}: treating as DOCUMENT (name: ${imageName}, type: ${imageType})`
          );
          return false;
        });

        const docImages = allImages.filter((img) => {
          const imageName = (img.name || img.Name || "").toLowerCase();
          console.log(`🔍 Image name for ${img.id || "unknown"}:`, imageName);

          // Check if this is a document image based on Name field (case insensitive)
          if (imageName === "document" || imageName === "doc" || imageName === "paperwork") {
            console.log(
              `🔍 Image ${img.id}: treating as DOCUMENT (${imageName})`
            );
            return true;
          }

          // If no name field or unknown name, check imageType as fallback
          const imageType =
            img.imageType || img.type || img.image_type || img.category;
          if (imageType === "document") {
            console.log(
              `🔍 Image ${img.id}: treating as DOCUMENT (imageType: ${imageType})`
            );
            return true;
          }

          // If neither name nor type indicates document, it's not a document
          console.log(
            `🔍 Image ${img.id}: treating as PRODUCT (name: ${imageName}, type: ${imageType})`
          );
          return false;
        });

        console.log("🔍 Product images:", productImages.length);
        console.log("🔍 Document images:", docImages.length);

        // Detect inspected images (uploaded by admin verification)
        const getStr = (v) => (typeof v === "string" ? v.toLowerCase() : "");
        const isInspected = (img) => {
          const tag = getStr(img.tag || img.Tag || img.label || img.Label);
          const type = getStr(img.imageType || img.type || img.image_type || img.category);
          const name = getStr(img.name || img.Name);
          const imageUrl = getStr(img.imageData || img.ImageData || img.url || img.imageUrl);
          
          // ✅ Check if filename contains ADMIN-INSPECTION prefix
          if (imageUrl.includes("admin-inspection")) {
            console.log(`🔍 Image ${img.id}: ADMIN INSPECTION detected (filename)`);
            return true;
          }
          
          return (
            tag.includes("kiểm định") ||
            tag.includes("admin") ||
            type.includes("kiểm định") ||
            type.includes("admin") ||
            name.includes("kiểm định")
          );
        };

        const urlOf = (img) => img.imageData || img.imageUrl || img.url;
        const productUrls = productImages.map(urlOf).filter(Boolean);
        const docUrls = docImages.map(urlOf).filter(Boolean);

        // ✅ Remove duplicates based on URL
        const uniqueProductUrls = [...new Set(productUrls)];
        const uniqueDocUrls = [...new Set(docUrls)];

        // Put inspected images first in the gallery
        const inspectedUrls = productImages.filter(isInspected).map(urlOf).filter(Boolean);
        // ✅ Remove duplicates from inspected URLs
        const uniqueInspectedUrls = [...new Set(inspectedUrls)];
        const inspectedUrlSet = new Set(uniqueInspectedUrls);
        const otherUrls = uniqueProductUrls.filter((u) => !inspectedUrlSet.has(u));

        console.log("🔍 Before deduplication - Product URLs:", productUrls.length);
        console.log("🔍 After deduplication - Unique Product URLs:", uniqueProductUrls.length);
        console.log("🔍 Before deduplication - Inspected URLs:", inspectedUrls.length);
        console.log("🔍 After deduplication - Unique Inspected URLs:", uniqueInspectedUrls.length);

        setImages([...uniqueInspectedUrls, ...otherUrls]);
        setInspectedSet(new Set(uniqueInspectedUrls));
        setDocumentImages(uniqueDocUrls);
      } catch (imageError) {
        console.log("No images found for product");
        setImages([]);
        setDocumentImages([]);
        setInspectedSet(new Set());
      }

      // Check if product is favorited by current user
      if (user) {
        try {
          const favoriteData = await isProductFavorited(
            user.id || user.userId || user.accountId,
            id
          );
          if (favoriteData) {
            setIsFavorite(true);
            setFavoriteId(favoriteData.favoriteId);
          }
        } catch (favoriteError) {
          console.warn("Could not check favorite status:", favoriteError);
        }
      }
    } catch (error) {
      console.error("Error loading product:", error);
      showToast({
        title: "❌ Lỗi tải sản phẩm",
        description: "Không thể tải thông tin sản phẩm. Vui lòng thử lại.",
        type: "error",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleImageNavigation = (direction) => {
    if (direction === "prev") {
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào yêu thích",
        type: "warning",
      });
      return;
    }

    try {
      const result = await toggleFavorite(
        user.id || user.userId || user.accountId,
        id
      );

      // Only update UI if we got a valid result
      if (result && typeof result.isFavorited === "boolean") {
        setIsFavorite(result.isFavorited);
        setFavoriteId(result.favoriteId || null);

        showToast({
          title: result.isFavorited
            ? "❤️ Đã thêm vào yêu thích"
            : "💔 Đã xóa khỏi yêu thích",
          description: result.isFavorited
            ? "Sản phẩm đã được thêm vào danh sách yêu thích"
            : "Sản phẩm đã được xóa khỏi danh sách yêu thích",
          type: "success",
        });
      } else {
        // If API is not available, show warning but don't crash
        showToast({
          title: "⚠️ Tính năng yêu thích tạm thời không khả dụng",
          description:
            "Backend chưa hỗ trợ tính năng yêu thích. Vui lòng thử lại sau.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast({
        title: "⚠️ Tính năng yêu thích tạm thời không khả dụng",
        description:
          "Backend chưa hỗ trợ tính năng yêu thích. Vui lòng thử lại sau.",
        type: "warning",
      });
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để liên hệ người bán",
        type: "warning",
      });
      return;
    }
    setShowChatModal(true);
  };

  const handleSendMessage = async (message) => {
    // This function is no longer needed as ChatModal handles the API call directly
    console.log("Message sent:", message);
  };

  const handleCreateOrder = () => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để tạo đơn hàng",
        type: "warning",
      });
      return;
    }

    // ✅ CRITICAL: Check if user is trying to buy their own product
    const currentUserId = user?.id || user?.userId || user?.accountId;
    const productSellerId = product?.sellerId || product?.seller_id;

    if (currentUserId && productSellerId && currentUserId == productSellerId) {
      showToast({
        title: "⚠️ Không thể mua",
        description: "Bạn không thể mua sản phẩm của chính mình!",
        type: "error",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  // Calculate deposit amount based on product price
  const getDepositAmount = () => {
    const price = product?.price || 0;
    return price > 300000000 ? 10000000 : 5000000; // 10M if > 300M, else 5M
  };

  // Handle payment deposit
  const onPayDeposit = async () => {
    if (paying) return;

    setPaying(true);

    try {
      console.log("[VNPay] Starting payment process...");

      // Get auth token
      const authData = localStorage.getItem("evtb_auth");
      const token = authData ? JSON.parse(authData)?.token : null;

      if (!token) {
        throw new Error("Bạn cần đăng nhập để thực hiện thanh toán");
      }

      // Debug user info
      console.log("[VNPay] User info:", {
        user: user,
        roleId: user?.roleId,
        role: user?.role,
        roleName: user?.roleName,
      });

      // Check user role (should be role=2 for member) - More flexible check
      const userRoleId = user?.roleId || user?.role;
      const isMember =
        userRoleId === 2 ||
        userRoleId === "2" ||
        user?.roleName?.toLowerCase() === "member" ||
        user?.roleName?.toLowerCase() === "user";

      // TEMPORARY: Allow all authenticated users for testing
      const allowAllUsers = true; // Set to false in production

      if (!isMember && !allowAllUsers) {
        console.log("[VNPay] Role check failed:", {
          userRoleId,
          roleName: user?.roleName,
          isMember,
        });
        throw new Error(
          `Bạn cần đăng nhập với vai trò thành viên. Vai trò hiện tại: ${
            user?.roleName || userRoleId || "Unknown"
          }`
        );
      }

      if (!isMember && allowAllUsers) {
        console.log(
          "[VNPay] ⚠️ TEMPORARY: Allowing payment despite role check failed"
        );
      }

      // ✅ CRITICAL: Check if user is trying to buy their own product
      const currentUserId = user?.id || user?.userId || user?.accountId;
      const productSellerId = product?.sellerId || product?.seller_id;

      console.log("[VNPay] Seller validation:", {
        currentUserId,
        productSellerId,
        isSameUser: currentUserId == productSellerId,
        productId: product?.id,
      });

      if (
        currentUserId &&
        productSellerId &&
        currentUserId == productSellerId
      ) {
        throw new Error("Bạn không thể mua sản phẩm của chính mình!");
      }

      const depositAmount = getDepositAmount();
      const totalAmount = product?.price || 0;

      // Validate product data
      if (!product?.id) {
        throw new Error("Không tìm thấy thông tin sản phẩm");
      }

      // Create order first if not exists
      let orderId = currentOrderId;
      if (!orderId) {
        console.log("[VNPay] Creating new order...");
        const orderData = {
          productId: product.id,
          sellerId: product.sellerId || product.seller_id || 1, // Default to admin as seller for testing
          depositAmount: depositAmount,
          totalAmount: totalAmount,
        };

        console.log("[VNPay] Order data:", orderData);

        const orderResponse = await createOrder(orderData, token);
        orderId = orderResponse.orderId;
        setCurrentOrderId(orderId);
        console.log("[VNPay] Order created:", orderId);
      }

      console.log("[VNPay] POST /api/payment", {
        orderId,
        amount: depositAmount,
        paymentType: "Deposit",
        productId: product?.id,
      });

      // Create payment
      const res = await createPayment(
        {
          orderId: orderId,
          productId: product?.id,
          amount: depositAmount,
          paymentType: "Deposit",
        },
        token
      );

      console.log("[VNPay] createPayment res:", res);

      if (!res?.paymentUrl) {
        throw new Error("paymentUrl empty");
      }

      // Close modal and show success message
      setShowPaymentModal(false);
      showToast({
        title: "✅ Đang chuyển đến VNPay",
        description: `Đơn hàng đã được tạo với số tiền cọc ${formatPrice(
          depositAmount
        )}. Đang chuyển đến cổng thanh toán...`,
        type: "success",
      });

      // Redirect to VNPay in a new tab so the return page can self-close
      // ✅ REMOVE noopener to allow window.opener to work
      const paymentWindow = window.open(
        res.paymentUrl,
        "_blank"
      );
      // Try focusing the new tab (may be blocked by browser policies)
      if (paymentWindow && typeof paymentWindow.focus === "function") {
        paymentWindow.focus();
      }
    } catch (err) {
      console.error("[VNPay] createPayment error:", err);

      // Handle specific errors
      if (err.message.includes("Phiên đăng nhập hết hạn")) {
        showToast({
          title: "❌ Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          type: "error",
        });
        // Redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (err.message.includes("vai trò thành viên")) {
        showToast({
          title: "❌ Không có quyền",
          description: "Bạn cần đăng nhập với vai trò thành viên",
          type: "error",
        });
      } else {
        showToast({
          title: "❌ Lỗi thanh toán",
          description:
            err.message || "Không tạo được giao dịch VNPay. Vui lòng thử lại!",
          type: "error",
        });
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product || id === "undefined" || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-4">ID sản phẩm không hợp lệ: {id}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Chi tiết sản phẩm
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite
                    ? "bg-red-50 text-red-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                title="Yêu thích"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="Chia sẻ"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {user && (
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                  title="Báo cáo vi phạm"
                >
                  <Flag className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-xl shadow-sm overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <Car className="h-16 w-16 text-gray-400" />
                </div>
              )}

              {currentImage && inspectedSet.has(currentImage) && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow-lg font-medium">
                  ✓ Ảnh do Admin kiểm định
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation("prev")}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation("next")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Gallery */}
              {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                      {inspectedSet.has(image) && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                          ✓ Admin
                        </div>
                      )}
                  </button>
                ))}
              </div>
            )}

            {/* Document Images Button */}
            {documentImages.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    console.log(
                      "🔍 Opening document modal with images:",
                      documentImages
                    );
                    setShowDocumentModal(true);
                  }}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Shield className="h-5 w-5" />
                  <span>Xem giấy tờ xe ({documentImages.length} ảnh)</span>
                </button>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.title}
                  </h1>

                  {/* Verification Status Badge */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {product.verificationStatus === "Verified" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Đã kiểm định
                      </span>
                    )}
                    
                    {/* Admin Inspection Images Badge */}
                    {inspectedSet.size > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Có {inspectedSet.size} ảnh do Admin kiểm định
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600">
                    {product.licensePlate ||
                      product.license_plate ||
                      "Biển số: N/A"}
                  </p>

                  {/* Verification Button - Only show for vehicles, product owner, and not verified */}
                  {product.productType === "Vehicle" &&
                    product.verificationStatus !== "Verified" && (
                      <div className="mt-4">
                        <VerificationButton
                          productId={
                            product.id || product.productId || product.Id
                          }
                          currentStatus={
                            product.verificationStatus || "NotRequested"
                          }
                          isOwner={
                            user &&
                            (user.id || user.userId || user.accountId) ===
                              (product.sellerId || product.userId)
                          }
                          disabled={loading}
                        />
                      </div>
                    )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-sm text-gray-500">Giá niêm yết</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                {product.status === "approved" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Đã duyệt
                  </span>
                )}
                {product.status === "sold" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Đã bán
                  </span>
                )}
                {product.is_auction && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Đấu giá
                  </span>
                )}
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {product.year && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Năm sản xuất: {product.year}</span>
                  </div>
                )}
                {product.mileage && (
                  <div className="flex items-center text-gray-600">
                    <Gauge className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Km đã đi: {product.mileage.toLocaleString()}</span>
                  </div>
                )}
                {product.battery_capacity && (
                  <div className="flex items-center text-gray-600">
                    <Battery className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Pin: {product.battery_capacity} kWh</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex items-center text-gray-600">
                    <Car className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Hãng: {product.brand}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Show sold message if product is sold */}
                {product.status === "Sold" || product.status === "sold" ? (
                  <div className="w-full bg-red-50 border border-red-200 text-red-800 py-4 px-6 rounded-lg text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <XCircle className="h-6 w-6" />
                      <span className="font-semibold text-lg">Sản phẩm đã được bán</span>
                    </div>
                    <p className="text-sm">
                      Sản phẩm này không còn khả dụng.
                    </p>
                  </div>
                ) : product.status === "Reserved" || product.status === "reserved" ? (
                  <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 py-4 px-6 rounded-lg text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Clock className="h-6 w-6" />
                      <span className="font-semibold text-lg">Sản phẩm đang trong quá trình thanh toán</span>
                    </div>
                    <p className="text-sm">
                      Sản phẩm này đã được khách hàng đặt cọc thành công và đang chờ seller xác nhận.
                    </p>
                  </div>
                ) : (
                  /* ✅ Only show payment button if user is not the seller */
                  (() => {
                    const currentUserId =
                      user?.id || user?.userId || user?.accountId;
                    const productSellerId =
                      product?.sellerId || product?.seller_id;
                    const isOwnProduct =
                      currentUserId &&
                      productSellerId &&
                      currentUserId == productSellerId;

                    if (isOwnProduct) {
                      return (
                        <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium text-center">
                          <CreditCard className="h-5 w-5 mr-2 inline" />
                          Sản phẩm của bạn
                        </div>
                      );
                    }

                    return (
                      <button
                        onClick={handleCreateOrder}
                        disabled={product.status === "sold"}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Tạo đơn hàng
                      </button>
                    );
                  })()
                )}

                {/* ✅ Only show contact button if user is not the seller */}
                {(() => {
                  const currentUserId = user?.id || user?.userId || user?.accountId;
                  const productSellerId = product?.sellerId || product?.seller_id;
                  const isOwnProduct = currentUserId && productSellerId && currentUserId == productSellerId;

                  if (isOwnProduct) {
                    return null; // Don't show contact button for own product
                  }

                  return (
                    <button
                      onClick={handleContactSeller}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Liên hệ người bán
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin người bán
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {seller?.avatar ? (
                    <img
                      src={seller.avatar}
                      alt="Seller Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-semibold">
                      {seller?.fullName?.charAt(0) ||
                        product.sellerName?.charAt(0) ||
                        "N"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {seller?.fullName || product.sellerName || "Người bán"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {product.location || "Hà Nội"}
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/seller/${product.sellerId || product.seller_id || 1}`
                      )
                    }
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Xem profile
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/seller/${
                          product.sellerId || product.seller_id || 1
                        }/products`
                      )
                    }
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Sản phẩm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mô tả sản phẩm
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description ||
                    "Không có mô tả chi tiết cho sản phẩm này."}
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông số kỹ thuật
              </h3>
              <div className="space-y-3">
                {/* Thông tin chung */}
                {product.brand && (
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">
                      {product.productType?.toLowerCase() === "battery"
                        ? "Hãng pin"
                        : "Hãng xe"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {product.brand}
                    </span>
                  </div>
                )}
                {product.model && (
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">
                      {product.productType?.toLowerCase() === "battery"
                        ? "Mẫu pin"
                        : "Mẫu xe"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {product.model}
                    </span>
                  </div>
                )}
                {product.condition && (
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Tình trạng</span>
                    <span className={`font-semibold ${
                      product.condition === "excellent" || product.condition === "Xuất sắc" 
                        ? "text-green-600" 
                        : product.condition === "good" || product.condition === "Tốt"
                        ? "text-blue-600"
                        : product.condition === "fair" || product.condition === "Khá"
                        ? "text-yellow-600"
                        : "text-orange-600"
                    }`}>
                      {product.condition === "excellent" ? "Xuất sắc" :
                       product.condition === "good" ? "Tốt" :
                       product.condition === "fair" ? "Khá" :
                       product.condition === "poor" ? "Cần sửa chữa" :
                       product.condition}
                    </span>
                  </div>
                )}

                {/* Thông tin xe điện */}
                {product.productType?.toLowerCase() === "vehicle" && (
                  <>
                    {product.year && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Năm sản xuất
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.year}
                        </span>
                      </div>
                    )}
                    {product.vehicleType && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Loại xe
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.vehicleType}
                        </span>
                      </div>
                    )}
                    {product.mileage && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Số km đã đi
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.mileage.toLocaleString()} km
                        </span>
                      </div>
                    )}

                    {product.licensePlate && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Biển số
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.licensePlate}
                        </span>
                      </div>
                    )}
                    {product.color && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Màu sắc
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.color}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Thông tin pin */}
                {product.productType?.toLowerCase() === "battery" && (
                  <>
                    {product.batteryType && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Loại pin
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.batteryType}
                        </span>
                      </div>
                    )}
                    {product.batteryHealth && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Tình trạng pin
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.batteryHealth}%
                        </span>
                      </div>
                    )}
                    {product.capacity && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Dung lượng
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.capacity} Ah
                        </span>
                      </div>
                    )}
                    {product.voltage && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Điện áp
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.voltage} V
                        </span>
                      </div>
                    )}
                    {product.bms && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">BMS</span>
                        <span className="font-semibold text-gray-900">
                          {product.bms}
                        </span>
                      </div>
                    )}
                    {product.cellType && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Loại cell
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.cellType}
                        </span>
                      </div>
                    )}
                    {product.cycleCount && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">
                          Số chu kỳ
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.cycleCount} chu kỳ
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Safety & Trust */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                An toàn & Tin cậy
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">
                    Sản phẩm đã được kiểm duyệt
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">
                    Thông tin chính xác
                  </span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-700">
                    Giao hàng tận nơi
                  </span>
                </div>
              </div>
            </div>

            {/* Similar Products */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sản phẩm tương tự
              </h3>
              <p className="text-gray-600 text-sm">
                Khám phá thêm các sản phẩm khác cùng danh mục
              </p>
              <Link
                to="/"
                className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        seller={seller}
        product={product}
        onSendMessage={handleSendMessage}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        product={product}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tạo đơn hàng
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {product.title}
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* Deposit Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-900">Thông tin cọc</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Số tiền cọc:</span>
                    <span className="font-bold text-blue-900">
                      {formatPrice(getDepositAmount())}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    {product.price > 300000000
                      ? "Sản phẩm trên 300 triệu - cọc 10 triệu để gặp mặt trực tiếp"
                      : "Sản phẩm dưới 300 triệu - cọc 5 triệu để gặp mặt trực tiếp"}
                  </p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Lưu ý quan trọng:
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Sau khi thanh toán cọc thành công, vui lòng liên hệ với người bán qua tính năng chat để thỏa thuận ngày giờ gặp mặt. Sau đó, xin hãy liên hệ với Admin qua số điện thoại <span className="font-semibold">0373111370</span> để Admin chốt lịch hẹn cho cả hai bên gặp mặt tại kho và tiến hành giao dịch trực tiếp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onPayDeposit}
                  disabled={paying}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-5 w-5 inline mr-2" />
                  {paying
                    ? "Đang chuyển tới VNPay..."
                    : "Thanh toán cọc qua ngân hàng online"}
                </button>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Images Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield className="h-6 w-6 text-green-600 mr-2" />
                  Giấy tờ xe ({documentImages.length} ảnh)
                </h3>
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Giấy tờ ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                      Giấy tờ {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {documentImages.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có ảnh giấy tờ nào</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
