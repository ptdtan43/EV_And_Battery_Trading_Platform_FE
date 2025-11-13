import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Zap, Shield, TrendingUp, CheckCircle } from "lucide-react";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/molecules/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { toggleFavorite, isProductFavorited } from "../lib/favoriteApi";
import "../styles/homepage.css";

export const HomePage = () => {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [productType, setProductType] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); // all, vehicle, battery
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    loadFeaturedProducts();
    if (user) {
      loadFavorites();
    }
    
    // Check for payment success parameters
    checkPaymentSuccess();
  }, [user]);

  const checkPaymentSuccess = () => {
    const urlParams = new URLSearchParams(location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const paymentError = urlParams.get('payment_error');
    const paymentId = urlParams.get('payment_id');
    const amount = urlParams.get('amount');
    const transactionNo = urlParams.get('transaction_no');

    if (paymentSuccess === 'true' && paymentId) {
      const formattedAmount = amount ? (parseInt(amount) / 100).toLocaleString('vi-VN') : 'N/A';
      
      showToast({
        type: 'success',
        title: '🎉 Thanh toán thành công!',
        message: `Giao dịch ${paymentId} đã được xử lý thành công. Số tiền: ${formattedAmount} VND`,
        duration: 8000
      });

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
      console.log("🔄 Loading featured products for homepage...");
      let approvedProducts = [];

      // Use the main Product API endpoint
      const data = await apiRequest("/api/Product");
      const allProducts = Array.isArray(data) ? data : data?.items || [];

      console.log("📦 Total products from API:", allProducts.length);
      console.log("📦 Sample product:", allProducts[0]);
      console.log("📦 All products status check:", allProducts.map(p => ({
        id: p.productId || p.id || p.ProductId,
        status: p.status || p.Status,
        title: p.title || p.Title
      })));
      
      // Debug: Check specific products that should be approved
      const approvedProductsDebug = allProducts.filter(p => {
        const status = String(p.status || p.Status || "").toLowerCase();
        return status === "approved" || status === "active" || status === "verified";
      });
      console.log("✅ Products that should be approved:", approvedProductsDebug.length);
      console.log("✅ Approved products details:", approvedProductsDebug.map(p => ({
        id: p.productId || p.id || p.ProductId,
        status: p.status || p.Status,
        title: p.title || p.Title
      })));

      // Filter approved products and classify by type
      approvedProducts = allProducts
        .filter((x) => {
          const status = String(x.status || x.Status || "").toLowerCase().trim();
          const isApproved = status === "approved" || status === "active" || status === "verified";
          console.log(
            `Product ${x.productId || x.id || x.ProductId}: status="${status}", isApproved=${isApproved}`
          );
          return isApproved;
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

          console.log(`Product ${x.id}: classified as ${productType}`);
          return { ...x, productType };
        })
        // .slice(0, 8); // Tạm thời bỏ giới hạn để test

      console.log("✅ Filtered approved products:", approvedProducts.length);
      console.log("🎯 Final approved products details:", approvedProducts.map(p => ({
        id: p.id || p.productId || p.Id,
        title: p.title || p.Title,
        status: p.status || p.Status,
        productType: p.productType
      })));

      // Load images for each approved product with delay to avoid DbContext conflicts
      const productsWithImages = await Promise.all(
        approvedProducts.map(async (product, index) => {
          try {
            // Add delay to avoid DbContext conflicts
            if (index > 0) {
              await new Promise((resolve) => setTimeout(resolve, 500 * index));
            }

            const imagesData = await apiRequest(
              `/api/ProductImage/product/${
                product.id || product.productId || product.Id
              }`
            );
            const images = Array.isArray(imagesData)
              ? imagesData
              : imagesData?.items || [];

            // Map images - only use real product images
            const mappedImages = images.map(
              (img) => img.imageData || img.imageUrl || img.url
            );

            return {
              ...product,
              images: mappedImages, // Only real images, no placeholder
            };
          } catch (error) {
            console.warn(
              `Failed to load images for product ${
                product.id || product.productId
              }:`,
              error
            );
            // Return product with no images if API fails
            return {
              ...product,
              images: [], // No placeholder, only real images
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

      console.log("Loaded approved products for homepage:", sortedProducts);
      setFeaturedProducts(sortedProducts);
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

    // Debug user ID
    const userId = user.id || user.userId || user.accountId;
    console.log("🔍 FAVORITE DEBUG:");
    console.log("  User object:", user);
    console.log("  Extracted userId:", userId);
    console.log("  Product ID:", productId);

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

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: implement search functionality
    console.log("search clicked:", { searchQuery, productType, locationFilter });
  };

  return (
    <div className="min-h-screen">
      <section className="text-white py-20 relative overflow-hidden hero-bg">
        {/* Electric charging effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Charging energy effects */}
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-blue-400 bg-opacity-30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-cyan-400 bg-opacity-25 rounded-full animate-bounce energy-effect-1"></div>
          <div className="absolute bottom-1/3 left-1/3 w-14 h-14 bg-blue-300 bg-opacity-20 rounded-full animate-pulse energy-effect-2"></div>
          <div className="absolute bottom-1/4 right-1/4 w-10 h-10 bg-white bg-opacity-30 rounded-full animate-bounce energy-effect-3"></div>

          {/* Electric spark effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/5 w-2 h-8 bg-yellow-400 rounded-full animate-pulse opacity-80"></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-6 bg-yellow-300 rounded-full animate-pulse opacity-70 spark-effect-1"></div>
            <div className="absolute top-1/2 left-1/6 w-2 h-10 bg-yellow-400 rounded-full animate-pulse opacity-60 spark-effect-2"></div>
            <div className="absolute bottom-1/3 right-1/5 w-2 h-7 bg-yellow-300 rounded-full animate-pulse opacity-75 spark-effect-3"></div>
          </div>

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
                {/* Energy sparks */}
                <div className="energy-spark-1"></div>
                <div className="energy-spark-2"></div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-relaxed">
              Nền tảng giao dịch xe điện & pin số 1 Việt Nam
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Mua bán xe điện an toàn, minh bạch với giá tốt nhất thị trường
            </p>
          </div>

          <div className="search-form-container">
            <form onSubmit={handleSearch} className="search-form">
              <div className="md:col-span-1">
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="search-input"
                >
                  <option value="">Tất cả</option>
                  <option value="vehicle">Xe điện</option>
                  <option value="battery">Pin</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hãng xe, mẫu xe..."
                  className="search-input"
                />
              </div>

              <div className="md:col-span-1">
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Địa điểm (VD: HN)"
                  className="search-input"
                />
              </div>

              <div className="md:col-span-1">
                <button type="submit" className="search-button">
                  <Search className="h-5 w-5 mr-2" />
                  Tìm kiếm
                </button>
              </div>
            </form>
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
                Sản phẩm nổi bật
              </h2>
              <p className="text-gray-600 mt-2">
                Những sản phẩm được kiểm duyệt và giá cạnh tranh nhất
              </p>
            </div>
            <div className="flex space-x-4">
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
                    onClick={() => setSelectedCategory("all")}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Tất cả ({featuredProducts.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategory("vehicle")}
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
                    onClick={() => setSelectedCategory("battery")}
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
                {(showAllProducts
                  ? featuredProducts.filter((product) => {
                      const matchesCategory =
                        selectedCategory === "all" ||
                        product.productType?.toLowerCase() === selectedCategory;
                      const matchesType =
                        !productType || product.productType === productType;
                      return matchesCategory && matchesType;
                    })
                  : featuredProducts
                      .filter((product) => {
                        const matchesCategory =
                          selectedCategory === "all" ||
                          product.productType?.toLowerCase() ===
                            selectedCategory;
                        const matchesType =
                          !productType || product.productType === productType;
                        return matchesCategory && matchesType;
                      })
                      .slice(0, 8)
                ).map((product, index) => (
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
                  />
                ))}
              </div>

              {featuredProducts.length > 8 && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto space-x-2"
                  >
                    <span>
                      {showAllProducts
                        ? "Thu gọn"
                        : `Xem tất cả (${featuredProducts.length} sản phẩm)`}
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        showAllProducts ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              )}
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
