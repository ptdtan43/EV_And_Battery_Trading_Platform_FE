import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Zap, Shield, TrendingUp, CheckCircle, Filter } from "lucide-react";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/molecules/ProductCard";
import { searchProductsByLicensePlate, searchProducts } from "../lib/productApi";
import { advancedSearchProducts } from "../lib/advancedSearchApi";
import { AdvancedSearchFilter } from "../components/common/AdvancedSearchFilter";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { toggleFavorite } from "../lib/favoriteApi";
import { handleVerificationPaymentSuccess } from "../lib/verificationNotificationService";
import "../styles/homepage.css";

export const HomePage = () => {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const location = useLocation();
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [paymentBannerInfo, setPaymentBannerInfo] = useState({ amount: null, type: 'Deposit' });
  const [showRefundBanner, setShowRefundBanner] = useState(false);
  const [refundBannerInfo, setRefundBannerInfo] = useState({ amount: null, productTitle: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [productType, setProductType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); // all, vehicle, battery
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for search
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentFilters, setCurrentFilters] = useState({
    productType: "",
    minPrice: "",
    maxPrice: "",
    condition: "",
    brand: "",
    model: "",
    year: "",
    vehicleType: "",
    maxMileage: "",
    fuelType: "",
    batteryBrand: "",
    batteryType: "",
    minBatteryHealth: "",
    maxBatteryHealth: "",
    minCapacity: "",
    maxCapacity: "",
    voltage: "",
    minCycleCount: "",
    maxCycleCount: "",
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4); // 4 products per page

  // Cache for seller names to prevent them from disappearing
  // Load from localStorage on mount with size limit
  const [sellerCache, setSellerCache] = useState(() => {
    try {
      const cached = localStorage.getItem('sellerNameCache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // ✅ Limit cache size to 50 sellers to prevent quota exceeded
        const entries = Object.entries(parsedCache);
        if (entries.length > 50) {
          console.warn(`⚠️ Seller cache too large (${entries.length}), trimming to 50`);
          const trimmedCache = Object.fromEntries(entries.slice(-50));
          return trimmedCache;
        }
        return parsedCache;
      }
      return {};
    } catch (error) {
      console.warn('Failed to load seller cache from localStorage:', error);
      // ✅ If error, clear the corrupt cache
      try {
        localStorage.removeItem('sellerNameCache');
      } catch (e) {
        console.warn('Failed to clear seller cache:', e);
      }
      return {};
    }
  });

  // Extract stable user ID to prevent unnecessary reloads
  const userId = user?.id || user?.userId || user?.accountId;

  // Persist seller cache to localStorage whenever it changes with quota handling
  useEffect(() => {
    try {
      // ✅ Limit cache size before saving
      const entries = Object.entries(sellerCache);
      let cacheToSave = sellerCache;
      
      if (entries.length > 50) {
        console.warn(`⚠️ Seller cache too large (${entries.length}), trimming to 50`);
        cacheToSave = Object.fromEntries(entries.slice(-50));
        setSellerCache(cacheToSave); // Update state with trimmed cache
      }
      
      localStorage.setItem('sellerNameCache', JSON.stringify(cacheToSave));
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        console.error('❌ localStorage quota exceeded! Clearing seller cache...');
        // ✅ Clear seller cache if quota exceeded
        try {
          localStorage.removeItem('sellerNameCache');
          setSellerCache({}); // Reset cache in state
        } catch (e) {
          console.error('Failed to clear seller cache:', e);
        }
      } else {
        console.warn('Failed to save seller cache to localStorage:', error);
      }
    }
  }, [sellerCache]);

  useEffect(() => {
    loadFeaturedProducts();
    if (userId) {
      loadFavorites();
    }
    
    // Check for payment success parameters
    checkPaymentSuccess();
    
    // ✅ Check localStorage for payment success (backup method)
    const checkLocalStoragePayment = () => {
      try {
        const paymentDataStr = localStorage.getItem('evtb_payment_success');
        if (paymentDataStr) {
          const paymentData = JSON.parse(paymentDataStr);
          
          // Check if it's recent (within last 10 seconds) and not processed
          const isRecent = (Date.now() - paymentData.timestamp) < 10000;
          if (isRecent && !paymentData.processed) {
            console.log('[HomePage] Found payment success in localStorage:', paymentData);
            
            const formattedAmount = paymentData.amount ? (parseInt(paymentData.amount) / 100).toLocaleString('vi-VN') : 'N/A';
            const isVerification = (paymentData.paymentType || '').toLowerCase() === 'verification';
            
            // Show toast
            showToast({
              type: 'success',
              title: isVerification ? '✅ Thanh toán kiểm định thành công!' : '🎉 Thanh toán đặt cọc thành công!',
              message: isVerification 
                ? `Yêu cầu kiểm định đã được thanh toán (${formattedAmount} VND).`
                : `Bạn đã đặt cọc thành công (${formattedAmount} VND).`,
              duration: 8000
            });
            
            // Show banner
            setPaymentBannerInfo({ amount: formattedAmount, type: paymentData.paymentType || 'Deposit' });
            setShowPaymentBanner(true);
            
            // Mark as processed
            paymentData.processed = true;
            localStorage.setItem('evtb_payment_success', JSON.stringify(paymentData));
            
            // Clean up after 30 seconds
            setTimeout(() => {
              localStorage.removeItem('evtb_payment_success');
            }, 30000);
          }
        }
      } catch (error) {
        console.error('[HomePage] Error checking localStorage:', error);
      }
    };
    
    // Check immediately
    checkLocalStoragePayment();
    
    // ✅ Check for refund success in localStorage
    const checkRefundSuccess = () => {
      try {
        const refundDataStr = localStorage.getItem('evtb_refund_success');
        if (refundDataStr) {
          const refundData = JSON.parse(refundDataStr);
          
          // Check if it's recent (within last 10 seconds)
          const isRecent = (Date.now() - refundData.timestamp) < 10000;
          if (isRecent) {
            console.log('[HomePage] Found refund success in localStorage:', refundData);
            
            showToast({
              type: 'success',
              title: '💰 Đã hoàn tiền thành công!',
              message: `Số tiền ${refundData.amount} đã được hoàn lại vào tài khoản của bạn.`,
              duration: 8000
            });
            
            setRefundBannerInfo({ 
              amount: refundData.amount, 
              productTitle: refundData.productTitle 
            });
            setShowRefundBanner(true);
            
            // Clean up after 30 seconds
            setTimeout(() => {
              localStorage.removeItem('evtb_refund_success');
            }, 30000);
          }
        }
      } catch (error) {
        console.error('[HomePage] Error checking refund localStorage:', error);
      }
    };
    
    checkRefundSuccess();
    
    // Listen for storage events from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'evtb_payment_success') {
        checkLocalStoragePayment();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for postMessage from PaymentSuccess page (opened via window.open)
    const onMessage = (event) => {
      try {
        const data = event.data || {};
        
        // Filter out messages from browser extensions
        if (data.posdMessageId || data.type === 'VIDEO_XHR_CANDIDATE' || data.from === 'detector') {
          return; // Ignore extension messages
        }
        
        console.log('[HomePage] Received message:', data);
        
        // Handle redirect message
        if (data.type === 'EVTB_REDIRECT' && data.url) {
          console.log('[HomePage] Redirecting to:', data.url);
          window.location.replace(data.url);
          return;
        }
        
        if (data.type === 'EVTB_PAYMENT_SUCCESS' && data.payload) {
          console.log('[HomePage] Payment success message received:', data.payload);
          const { paymentId, amount, paymentType } = data.payload;
          const formattedAmount = amount ? (parseInt(amount) / 100).toLocaleString('vi-VN') : 'N/A';
          const isVerification = (paymentType || '').toLowerCase() === 'verification';
          
          console.log('[HomePage] Showing success toast...');
          showToast({
            type: 'success',
            title: isVerification ? '✅ Thanh toán kiểm định thành công!' : '🎉 Thanh toán đặt cọc thành công!',
            message: isVerification 
              ? `Yêu cầu kiểm định đã được thanh toán (${formattedAmount} VND).`
              : `Bạn đã đặt cọc thành công (${formattedAmount} VND).`,
            duration: 8000
          });
          
          // Also show persistent banner as a fallback UI
          setPaymentBannerInfo({ amount: formattedAmount, type: paymentType || 'Deposit' });
          setShowPaymentBanner(true);
          
          console.log('[HomePage] Toast shown');
        }
      } catch (error) {
        console.error('[HomePage] Error handling message:', error);
      }
    };
    
    console.log('[HomePage] Setting up message listener');
    window.addEventListener('message', onMessage);
    
    return () => {
      console.log('[HomePage] Cleaning up listeners');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', onMessage);
    };
  }, [userId, showToast]); // Include showToast in dependencies

  const checkPaymentSuccess = async () => {
    const urlParams = new URLSearchParams(location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const paymentError = urlParams.get('payment_error');
    const paymentId = urlParams.get('payment_id');
    let amount = urlParams.get('amount');
    const transactionNo = urlParams.get('transaction_no');
    const paymentType = urlParams.get('payment_type'); // ✅ Get payment type from URL

    // ✅ If amount not in URL, try to get from localStorage
    if (!amount || amount === '0') {
      try {
        const storageData = localStorage.getItem('evtb_payment_success');
        if (storageData) {
          const parsed = JSON.parse(storageData);
          amount = parsed.amount;
          console.log('[HomePage] Got amount from localStorage:', amount);
        }
      } catch (e) {
        console.error('[HomePage] Could not read amount from localStorage:', e);
      }
    }
    
    // ✅ Debug: Log all payment data
    console.log('[HomePage] Payment success data:', {
      paymentId,
      amountFromUrl: urlParams.get('amount'),
      amountFromStorage: amount,
      transactionNo,
      paymentType
    });

    if (paymentSuccess === 'true' && paymentId) {
      const formattedAmount = amount ? (parseInt(amount) / 100).toLocaleString('vi-VN') : 'N/A';
      
      // ✅ Determine payment type (from URL or API)
      let finalPaymentType = paymentType || 'Deposit';
      
      // Check if this is a verification payment and notify admin
      try {
        const payment = await apiRequest(`/api/Payment/${paymentId}`);
        
        if (payment) {
          finalPaymentType = payment.PaymentType || payment.paymentType || finalPaymentType;
          
          if (finalPaymentType === 'Verification' && payment.ProductId) {
            // Notify admin about successful verification payment
            await handleVerificationPaymentSuccess(
              paymentId,
              payment.ProductId,
              payment.UserId, // Seller ID
              payment.Amount
            );
          }
        }
      } catch (error) {
        // Silently fail - don't show error to user
      }
      
      // ✅ Show specific notification based on payment type
      if (finalPaymentType === 'Verification') {
        showToast({
          type: 'success',
          title: '✅ Thanh toán kiểm định thành công!',
          message: `Yêu cầu kiểm định đã được thanh toán (${formattedAmount} VND). Admin sẽ xác nhận trong thời gian sớm nhất.`,
          duration: 10000
        });
      } else {
        showToast({
          type: 'success',
          title: '🎉 Thanh toán đặt cọc thành công!',
          message: `Bạn đã đặt cọc thành công (${formattedAmount} VND). Vui lòng liên hệ người bán để hoàn tất giao dịch.`,
          duration: 10000
        });
      }

      // ✅ Also show a persistent banner at top of HomePage
      setPaymentBannerInfo({ amount: formattedAmount, type: finalPaymentType });
      setShowPaymentBanner(true);

      // Clear URL parameters after showing notification
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (paymentError === 'true' && paymentId) {
      showToast({
        type: 'error',
        title: '❌ Lỗi thanh toán',
        message: `Có lỗi xảy ra khi xử lý giao dịch ${paymentId}. Vui lòng liên hệ hỗ trợ.`,
        duration: 8000
      });

      // Clear URL parameters after showing notification
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      let approvedProducts = [];

      // Use the main Product API endpoint
      const data = await apiRequest("/api/Product");
      const allProducts = Array.isArray(data) ? data : data?.items || [];

      // Filter approved products and classify by type
      approvedProducts = allProducts
        .filter((x) => {
          const status = String(x.status || x.Status || "").toLowerCase().trim();
          const isApproved = status === "approved" || status === "active" || status === "verified";
          const isNotSold = status !== "sold";
          const isNotRejected = status !== "rejected";
          const isNotReserved = status !== "reserved"; // Filter out reserved products
          const shouldShow = isApproved && isNotSold && isNotRejected && isNotReserved;
          
          // Determine product type for logging
          let productType = "vehicle";
          if (x.productType) {
            productType = x.productType.toLowerCase();
          } else if (x.capacity || x.voltage || x.cycleCount || x.cycle_count) {
            productType = "battery";
          }
          
          // Debug logging for ALL products (especially batteries) to see their status
          if (productType === "battery" || productType === "pin") {
            console.log(`🔋 Battery product ${x.id || x.productId || x.ProductId || 'unknown'}:`, {
              title: x.title || x.Title,
              status: status,
              rawStatus: x.status || x.Status,
              productType: productType,
              isApproved,
              isNotSold,
              isNotRejected,
              isNotReserved,
              shouldShow: shouldShow,
              willShow: shouldShow ? "✅ YES" : "❌ NO"
            });
          }
          
          // Log if product is sold but still showing
          if (status === "sold" && shouldShow) {
            console.warn(`⚠️ WARNING: Sold product ${x.id || x.productId || x.ProductId} is still showing!`, {
              title: x.title || x.Title,
              status: status,
              productType: productType
            });
          }
          
          return shouldShow;
        })
        .map((x) => {
          // Determine product type based on available fields
          let productType = "vehicle"; // default

          if (x.productType) {
            productType = x.productType.toLowerCase();
          } else if (x.licensePlate || x.license_plate || x.mileage || x.year) {
            productType = "vehicle";
          } else if (x.capacity || x.voltage || x.cycleCount || x.cycle_count) {
            productType = "battery";
          }

          return { ...x, productType };
        });

      // ✅ OPTIMIZED: Load images and seller info without delays
      const productsWithImages = await Promise.all(
        approvedProducts.map(async (product, index) => {
          // ✅ DECLARE sellerName OUTSIDE try block so it's accessible in catch block
          let sellerName = null;
          
          try {
            // ✅ Get seller info - try COMPREHENSIVE approaches
            sellerName = product.sellerName || 
                           product.seller?.fullName || 
                           product.seller?.name ||
                           product.seller?.userName ||
                           product.sellerFullName ||
                           product.seller_name ||
                           product.ownerName ||
                           product.userName;
            
            // If no seller name but has sellerId, try to load from API or cache
            // Try MANY possible field names for seller ID
            const possibleSellerIdFields = [
              'sellerId', 'seller_id', 'SellerId', 'SellerID', 
              'userId', 'user_id', 'UserId', 'UserID',
              'createdBy', 'created_by', 'CreatedBy', 'CreatedByUserId',
              'ownerId', 'owner_id', 'OwnerId'
            ];
            
            let sellerId = null;
            for (const field of possibleSellerIdFields) {
              if (product[field]) {
                sellerId = product[field];
                break;
              }
            }
            
            if (!sellerName && sellerId) {
              // ✅ CHECK CACHE FIRST before making API call
              if (sellerCache[sellerId]) {
                sellerName = sellerCache[sellerId];
              } else {
                // Only call API if not in cache
                try {
                  const sellerPromise = apiRequest(`/api/User/${sellerId}`);
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 8000) // Increased timeout to 8 seconds
                  );
                  const sellerData = await Promise.race([sellerPromise, timeoutPromise]);
                  sellerName = sellerData?.fullName || 
                             sellerData?.full_name || 
                             sellerData?.name || 
                             sellerData?.userName || 
                             sellerData?.user_name ||
                             sellerData?.UserName;
                  
                  // ✅ SAVE TO CACHE for future use
                  if (sellerName) {
                    setSellerCache(prev => ({
                      ...prev,
                      [sellerId]: sellerName
                    }));
                  }
                } catch (sellerError) {
                  // Silently fail - seller name will use fallback
                }
              }
            }
            
            // Final fallback
            if (!sellerName) {
              sellerName = "Người bán";
            }

            // ✅ Try to load images from API (with timeout to prevent hanging)
            let imagesData = null;
            try {
              const imagePromise = apiRequest(
                `/api/ProductImage/product/${product.id || product.productId || product.Id}`
              );
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              );
              imagesData = await Promise.race([imagePromise, timeoutPromise]);
            } catch (imageError) {
              imagesData = null;
            }
            
            // Handle different response formats
            let images = [];
            if (imagesData) {
              if (Array.isArray(imagesData)) {
                images = imagesData;
              } else if (imagesData?.items && Array.isArray(imagesData.items)) {
                images = imagesData.items;
              } else if (typeof imagesData === 'object') {
                images = [imagesData];
              }
            }

            // Map images - only use real product images
            const mappedImages = images.map(
              (img) => img.imageData || img.imageUrl || img.url
            ).filter(Boolean);

            // If no images found from ProductImage API, try to get from product fields
            let finalImages = mappedImages;
            if (finalImages.length === 0) {
              // Try to get images from product fields
              const possibleImageFields = [
                'imageData', 'imageUrls', 'imageUrl', 'images', 'photos', 'pictures',
                'ImageData', 'ImageUrls', 'ImageUrl', 'Images', 'Photos', 'Pictures'
              ];
              
              for (const field of possibleImageFields) {
                if (product[field]) {
                  if (Array.isArray(product[field])) {
                    finalImages = product[field].filter(Boolean);
                  } else if (typeof product[field] === 'string' && product[field].trim()) {
                    finalImages = [product[field]];
                  }
                  if (finalImages.length > 0) break;
                }
              }
            }

            return {
              ...product,
              images: finalImages, // Only real images, no placeholder
              sellerName: sellerName, // Add seller name
            };
          } catch (error) {
            // Return product with no images if API fails
            return {
              ...product,
              images: [],
              sellerName: sellerName || "Người bán",
            };
          }
        })
      );

      // Sort products by approval date (newest approved first)
      const sortedProducts = productsWithImages.sort((a, b) => {
        // Get approval date or created date
        const aDate = new Date(
          a.approvedDate || a.createdDate || a.created_date || 0
        );
        const bDate = new Date(
          b.approvedDate || b.createdDate || b.created_date || 0
        );

        // Sort by date descending (newest first)
        return bDate - aDate;
      });

      setFeaturedProducts(sortedProducts);
      setAllProducts(sortedProducts); // Store all products for search
    } catch (err) {
      console.error("❌ Error loading featured products:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.status,
        data: err.data,
        stack: err.stack,
      });

      setFeaturedProducts([]);
      setFeaturedError(err.message || String(err));

      try {
        // Expose a helpful debug object for the developer console (non-sensitive)
        window.__EVTB_LAST_ERROR = window.__EVTB_LAST_ERROR || {};
        window.__EVTB_LAST_ERROR.loadFeaturedProducts = {
          message: err.message || String(err),
          status: err.status,
          data: err.data,
          stack: err.stack || null,
          timestamp: new Date().toISOString(),
        };
      } catch (debugErr) {
        console.warn("Could not set debug error object:", debugErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const userId = user.id || user.userId || user.accountId;
      const favoritesData = await apiRequest(`/api/Favorite/user/${userId}`);
      const favoriteIds = Array.isArray(favoritesData)
        ? favoritesData.map((fav) => fav.productId)
        : [];
      setFavorites(new Set(favoriteIds));
    } catch (error) {
      console.warn("Could not load favorites:", error);
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào yêu thích",
        type: "warning",
      });
      return;
    }

    const userId = user.id || user.userId || user.accountId;

    try {
      const result = await toggleFavorite(userId, productId);

      // Only update UI if we got a valid result
      if (result && typeof result.isFavorited === "boolean") {
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          if (result.isFavorited) {
            newFavorites.add(productId);
          } else {
            newFavorites.delete(productId);
          }
          return newFavorites;
        });

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

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      showToast({
        type: "warning",
        title: "⚠️ Vui lòng nhập từ khóa tìm kiếm",
        message: "Bạn cần nhập hãng xe, mẫu xe hoặc biển số để tìm kiếm",
        duration: 3000
      });
      return;
    }
    
    try {
      
      let results = [];
      let searchType = "";
      
      if (productType === "license-plate") {
        // Tìm kiếm chỉ theo biển số
        try {
          results = await searchProductsByLicensePlate(searchQuery.trim());
          searchType = "biển số";
        } catch (error) {
          // Fallback to local search if API fails
          results = searchProducts(searchQuery.trim(), allProducts);
          searchType = "biển số (tìm kiếm cục bộ)";
        }
      } else {
        // Tìm kiếm tổng quát theo hãng xe, mẫu xe hoặc biển số trong dữ liệu cục bộ
        results = searchProducts(searchQuery.trim(), allProducts);
        searchType = "hãng xe, mẫu xe hoặc biển số";
        
        // Nếu đang ở tab "Xe điện", tự động filter chỉ xe và ưu tiên search theo biển số
        if (selectedCategory === "vehicle") {
          // Filter chỉ xe điện
          results = results.filter(product => {
            const productTypeLower = (product.productType || product.ProductType || "").toLowerCase();
            return productTypeLower === "vehicle" || productTypeLower === "xe";
          });
          
          // Kiểm tra xem query có phải biển số không (format: XX-X hoặc có dấu gạch ngang)
          const query = searchQuery.trim();
          const looksLikeLicensePlate = /^[0-9]{2}[A-Z]-[0-9]{5}$/i.test(query) || 
                                        /^[0-9]{2}[A-Z]/i.test(query) || 
                                        query.includes('-');
          
          if (looksLikeLicensePlate) {
            // Ưu tiên tìm theo biển số bằng API nếu có thể
            try {
              const licensePlateResults = await searchProductsByLicensePlate(query);
              if (licensePlateResults && licensePlateResults.length > 0) {
                // Filter chỉ xe điện
                const vehicleResults = licensePlateResults.filter(product => {
                  const productTypeLower = (product.productType || product.ProductType || "").toLowerCase();
                  return productTypeLower === "vehicle" || productTypeLower === "xe";
                });
                if (vehicleResults.length > 0) {
                  results = vehicleResults;
                  searchType = "biển số xe";
                }
              }
            } catch (error) {
              console.log("⚠️ License plate API search failed, using local search:", error);
            }
          }
        }
      }
      
      // Lọc theo loại sản phẩm nếu được chọn (trừ khi đã filter ở trên)
      if (productType && productType !== "license-plate" && productType !== "" && selectedCategory !== "vehicle") {
        results = results.filter(product => {
          const productTypeLower = (product.productType || product.ProductType || "").toLowerCase();
          return productTypeLower === productType;
        });
      }
      
        if (results && results.length > 0) {
          // Hiển thị kết quả tìm kiếm
          setFeaturedProducts(results);
          setIsSearchMode(true);
          setCurrentPage(1); // Reset to first page when searching
        
        const searchDescription = productType === "license-plate" 
          ? `biển số "${searchQuery}"`
          : `${searchType} "${searchQuery}"`;
          
        showToast({
          type: "success",
          title: "✅ Tìm thấy kết quả",
          message: `Tìm thấy ${results.length} xe với ${searchDescription}`,
          duration: 4000
        });
      } else {
        setFeaturedProducts([]);
        setIsSearchMode(true);
        
        const searchDescription = productType === "license-plate" 
          ? `biển số "${searchQuery}"`
          : `${searchType} "${searchQuery}"`;
          
        showToast({
          type: "info",
          title: "🔍 Không tìm thấy kết quả",
          message: `Không có xe nào với ${searchDescription}`,
          duration: 4000
        });
      }
    } catch (error) {
      console.error("❌ Search error:", error);
      showToast({
        type: "error",
        title: "❌ Lỗi tìm kiếm",
        message: error.message || "Có lỗi xảy ra khi tìm kiếm",
        duration: 5000
      });
    }
  };

  const showAllProductsAgain = async () => {
    setIsSearchMode(false);
    setProductType("");
    setSearchQuery("");
    setActiveFilters({});
    setCurrentFilters({
      productType: "",
      minPrice: "",
      maxPrice: "",
      condition: "",
      brand: "",
      model: "",
      year: "",
      vehicleType: "",
      maxMileage: "",
      fuelType: "",
      batteryBrand: "",
      batteryType: "",
      minBatteryHealth: "",
      maxBatteryHealth: "",
      minCapacity: "",
      maxCapacity: "",
      voltage: "",
      minCycleCount: "",
      maxCycleCount: "",
    });
    setShowAdvancedFilter(false);
    setCurrentPage(1); // Reset to first page
    // Use stored allProducts instead of reloading
    setFeaturedProducts(allProducts);
    showToast({
      type: "success",
      title: "🔄 Đã tải lại",
      message: "Hiển thị tất cả sản phẩm",
      duration: 3000
    });
  };

  const handleAdvancedFilter = async (filters) => {
    try {
      setLoading(true);
      setCurrentFilters(filters); // Save current filters
      setActiveFilters(filters);
      setShowAdvancedFilter(false);
      
      const results = await advancedSearchProducts(filters);
      
      // Load images for filtered products
      const productsWithImages = await Promise.all(
        results.map(async (product) => {
          try {
            const imagesData = await apiRequest(
              `/api/ProductImage/product/${product.id || product.productId || product.Id}`
            );
            
            let images = [];
            if (imagesData) {
              if (Array.isArray(imagesData)) {
                images = imagesData;
              } else if (imagesData?.items && Array.isArray(imagesData.items)) {
                images = imagesData.items;
              }
            }
            
            const mappedImages = images.map(
              (img) => img.imageData || img.imageUrl || img.url
            ).filter(Boolean);
            
            return {
              ...product,
              images: mappedImages,
              sellerName: product.sellerName || sellerCache[product.sellerId] || "Người bán"
            };
          } catch (error) {
            return {
              ...product,
              images: [],
              sellerName: product.sellerName || "Người bán"
            };
          }
        })
      );
      
      setFeaturedProducts(productsWithImages);
      setIsSearchMode(true);
      setCurrentPage(1);
      
      const filterCount = Object.keys(filters).length;
      showToast({
        type: "success",
        title: "✅ Đã áp dụng bộ lọc",
        message: `Tìm thấy ${results.length} sản phẩm với ${filterCount} tiêu chí lọc`,
        duration: 4000
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "❌ Lỗi tìm kiếm",
        message: error.message || "Có lỗi xảy ra khi lọc sản phẩm",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {showPaymentBanner && (
        <div className="sticky top-0 z-50 shadow-2xl animate-slideDown">
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Success Icon */}
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  {/* Message */}
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {paymentBannerInfo.type === 'Verification' ? 'Đã thanh toán kiểm định thành công!' : 'Đã thanh toán đặt cọc thành công!'}
                    </h3>
                    <p className="text-green-50 text-base">
                      {paymentBannerInfo.type === 'Verification' 
                        ? 'Yêu cầu kiểm định của bạn đã được thanh toán thành công. Admin sẽ xác nhận sớm nhất.' 
                        : 'Giao dịch đặt cọc đã hoàn tất. Vui lòng liên hệ người bán để hoàn tất giao dịch.'}
                    </p>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowPaymentBanner(false)}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                  aria-label="Đóng thông báo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showRefundBanner && (
        <div className="sticky top-0 z-50 shadow-2xl animate-slideDown">
          <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Refund Icon */}
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  
                  {/* Message */}
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      💰 Đã hoàn tiền thành công!
                    </h3>
                    <p className="text-blue-50 text-base">
                      Số tiền <strong>{refundBannerInfo.amount}</strong> đã được hoàn lại vào tài khoản của bạn vì giao dịch không thành công.
                      {refundBannerInfo.productTitle && ` Sản phẩm "${refundBannerInfo.productTitle}" đã được trả về trang chủ.`}
                    </p>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowRefundBanner(false)}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                  aria-label="Đóng thông báo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <section className="text-white py-20 relative overflow-hidden hero-bg">
        {/* Electric charging effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Charging energy effects */}
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-blue-400 bg-opacity-30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-cyan-400 bg-opacity-25 rounded-full animate-bounce energy-effect-1"></div>
          <div className="absolute bottom-1/3 left-1/3 w-14 h-14 bg-blue-300 bg-opacity-20 rounded-full animate-pulse energy-effect-2"></div>
          <div className="absolute bottom-1/4 right-1/4 w-10 h-10 bg-white bg-opacity-30 rounded-full animate-bounce energy-effect-3"></div>


          {/* Charging cable glow effect */}
          <div className="absolute top-1/2 right-1/4 w-1 h-32 bg-blue-400 bg-opacity-40 rounded-full animate-pulse transform rotate-12"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            {/* Electric car charging icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="hero-icon-container">
                  <svg
                    className="hero-icon"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {/* Electric car body */}
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                    {/* Charging port */}
                    <rect
                      x="16"
                      y="8"
                      width="3"
                      height="4"
                      rx="1"
                      fill="#3b82f6"
                    />
                  </svg>
                </div>
                {/* Charging cable effect */}
                <div className="charging-cable-effect">
                  <svg
                    className="charging-cable-icon"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-relaxed">
              Nền tảng giao dịch xe điện & pin số 1 Việt Nam
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Mua bán xe điện an toàn, minh bạch với giá tốt nhất thị trường
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Clean Modern Search Bar */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3">
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                {/* Search Input - Full Width */}
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm xe điện, pin theo hãng, mẫu xe, màu sắc, biển số..."
                    className="w-full pl-14 pr-6 py-5 text-lg text-gray-900 bg-transparent border-0 focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Divider */}
                <div className="h-12 w-px bg-gray-200"></div>

                {/* Search Button */}
                <button 
                  type="submit" 
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                >
                  <Search className="h-5 w-5" />
                  Tìm kiếm
                </button>

                {/* Filter Button with Badge */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                  className={`relative px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 whitespace-nowrap ${
                    showAdvancedFilter || Object.keys(activeFilters).length > 0
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900'
                  }`}
                  title="Bộ lọc nâng cao"
                >
                  <Filter className="h-5 w-5" />
                  <span>Lọc</span>
                  {Object.keys(activeFilters).length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-lg animate-pulse">
                      {Object.keys(activeFilters).length}
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Advanced Filter Panel */}
            {showAdvancedFilter && (
              <div className="mt-4 animate-fade-in">
                <AdvancedSearchFilter
                  initialFilters={currentFilters}
                  onFilterChange={handleAdvancedFilter}
                  onClose={() => setShowAdvancedFilter(false)}
                />
              </div>
            )}
          </div>

          <div className="mt-12 features-grid">
            <div className="feature-item">
              <Zap className="feature-icon" />
              <h3 className="feature-title">1000+ xe đã giao dịch</h3>
              <p className="feature-description">
                Hàng nghìn giao dịch thành công
              </p>
            </div>
            <div className="feature-item">
              <Shield className="feature-icon" />
              <h3 className="feature-title">Kiểm định chính hãng</h3>
              <p className="feature-description">
                Đảm bảo chất lượng từng sản phẩm
              </p>
            </div>
            <div className="feature-item">
              <TrendingUp className="feature-icon" />
              <h3 className="feature-title">Giá minh bạch, cộng khai</h3>
              <p className="feature-description">
                Hỗ trợ AI gợi ý giá tốt nhất
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {isSearchMode ? "Kết quả tìm kiếm" : "Sản phẩm nổi bật"}
              </h2>
              <p className="text-gray-600 mt-2">
                {isSearchMode 
                  ? `Kết quả tìm kiếm theo ${productType === "license-plate" ? "biển số" : "từ khóa"}`
                  : "Những sản phẩm được kiểm duyệt và giá cạnh tranh nhất"
                }
              </p>
            </div>
            <div className="flex space-x-4">
              {isSearchMode ? (
                <button
                  onClick={showAllProductsAgain}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  🔄 Xem tất cả sản phẩm
                </button>
              ) : (
                <>
                  <Link
                    to="/vehicles"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    🚗 Xe điện
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  <Link
                    to="/batteries"
                    className="text-green-600 hover:text-green-700 font-medium flex items-center"
                  >
                    🔋 Pin
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              {/* Phân loại sản phẩm */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-4 mb-6">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Tất cả ({featuredProducts.length})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("vehicle");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === "vehicle"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🚗 Xe điện (
                    {
                      featuredProducts.filter(
                        (p) => p.productType?.toLowerCase() === "vehicle"
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("battery");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === "battery"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🔋 Pin (
                    {
                      featuredProducts.filter(
                        (p) => p.productType?.toLowerCase() === "battery"
                      ).length
                    }
                    )
                  </button>
                </div>
              </div>

              <div className="products-grid">
                {(() => {
                  // First filter products by category and type
                  const filteredProducts = featuredProducts.filter((product) => {
                    const matchesCategory =
                      selectedCategory === "all" ||
                      product.productType?.toLowerCase() === selectedCategory;
                    const matchesType =
                      !productType || product.productType === productType;
                    return matchesCategory && matchesType;
                  });
                  
                  // Calculate pagination
                  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
                  
                  return paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={
                        product.id ||
                        product.productId ||
                        product.Id ||
                        `product-${index}`
                      }
                      product={product}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.has(product.id || product.productId)}
                      user={user}
                    />
                  ));
                })()}
              </div>

              {/* Pagination */}
              {(() => {
                const filteredProducts = featuredProducts.filter((product) => {
                  const matchesCategory =
                    selectedCategory === "all" ||
                    product.productType?.toLowerCase() === selectedCategory;
                  const matchesType =
                    !productType || product.productType === productType;
                  return matchesCategory && matchesType;
                });
                
                const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
                
                if (totalPages <= 1) return null;
                
                return (
                  <div className="text-center mt-8">
                    <div className="flex justify-center items-center space-x-2">
                      {/* Previous button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        ← Trước
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      {/* Next button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Sau →
                      </button>
                    </div>
                    
                    {/* Page info */}
                    <div className="mt-4 text-sm text-gray-600">
                      Trang {currentPage} / {totalPages} - Hiển thị {Math.min(itemsPerPage, filteredProducts.length - (currentPage - 1) * itemsPerPage)} trong {filteredProducts.length} sản phẩm
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {featuredError ? "Lỗi tải sản phẩm" : "Không có sản phẩm nào"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {featuredError
                    ? "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau."
                    : "Hiện tại chưa có sản phẩm nào được phê duyệt."}
                </p>
                {featuredError && (
                  <button
                    onClick={loadFeaturedProducts}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thử lại
                  </button>
                )}
                {!featuredError && (
                  <Link
                    to="/create-listing"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Đăng tin đầu tiên
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Xe đã kiểm định Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-green-600" />
                Xe đã kiểm định
              </h2>
              <p className="text-gray-600 mt-2">
                Những chiếc xe đã được admin kiểm tra và chứng nhận chất lượng
              </p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {featuredProducts.filter(
                  (p) => p.productType?.toLowerCase() === "vehicle" && p.verificationStatus === "Verified"
                ).length} xe đã kiểm định
              </span>
            </div>
          </div>

          {loading ? (
            <div className="products-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : featuredProducts.filter(
            (p) => p.productType?.toLowerCase() === "vehicle" && p.verificationStatus === "Verified"
          ).length > 0 ? (
            <div className="products-grid">
              {featuredProducts
                .filter(
                  (p) => p.productType?.toLowerCase() === "vehicle" && p.verificationStatus === "Verified"
                )
                .slice(0, 8)
                .map((product, index) => (
                  <ProductCard
                    key={
                      product.id ||
                      product.productId ||
                      product.Id ||
                      `verified-product-${index}`
                    }
                    product={product}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.has(product.id || product.productId)}
                    user={user}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có xe kiểm định nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Hiện tại chưa có xe nào được kiểm định. Hãy là người đầu tiên!
                </p>
                <Link
                  to="/create-listing"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Đăng tin xe
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn EV Market?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nền tảng uy tín, minh bạch và an toàn cho mọi giao dịch xe điện
            </p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon-container">
                <CheckCircle className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Kiểm duyệt kỹ lưỡng</h3>
              <p className="benefit-description">
                Mỗi tin đăng đều được admin kiểm tra và phê duyệt
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <Shield className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Thanh toán an toàn</h3>
              <p className="benefit-description">
                Hỗ trợ nhiều phương thức thanh toán bảo mật
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <TrendingUp className="benefit-icon" />
              </div>
              <h3 className="benefit-title">AI gợi ý giá</h3>
              <p className="benefit-description">
                Công nghệ AI giúp định giá chính xác nhất
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <Zap className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">
                Đội ngũ hỗ trợ sẵn sàng giải ��áp mọi thắc mắc
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
