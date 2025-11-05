import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Star,
  Package,
  Calendar,
  Shield,
  CheckCircle,
  Users,
  TrendingUp,
  Award,
  MessageCircle,
  Heart,
  Clock,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatters";
import { ProductCard } from "../components/molecules/ProductCard";
import { RatingSystem } from "../components/common/RatingSystem";

export const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth ? useAuth() : { isAdmin: false };
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [soldProducts, setSoldProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [adminUserDetail, setAdminUserDetail] = useState(null);

  const confirmSale = async (productId) => {
    try {
      // Cập nhật sản phẩm thành Sold
      await apiRequest(`/api/Product/${productId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Sold'
        })
      });
      
      // Reload data để cập nhật UI
      await loadSellerData();
      
      alert('Đã xác nhận bán sản phẩm thành công!');
    } catch (error) {
      console.error('Error confirming sale:', error);
      alert('Có lỗi xảy ra khi xác nhận bán sản phẩm');
    }
  };

  useEffect(() => {
    if (id) {
      loadSellerData();
    }
    
    // ✅ Listen for reload events (e.g., after admin confirms transaction)
    const handleStorageChange = (e) => {
      if (e.key === 'seller_profile_reload') {
        console.log('🔄 Reloading seller profile due to admin confirmation...');
        loadSellerData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // ✅ Also check localStorage periodically for same-tab updates
    const checkReload = setInterval(() => {
      const lastReload = localStorage.getItem('seller_profile_reload');
      const lastCheck = sessionStorage.getItem('seller_profile_last_check');
      
      if (lastReload && lastReload !== lastCheck) {
        console.log('🔄 Reloading seller profile (same tab)...');
        sessionStorage.setItem('seller_profile_last_check', lastReload);
        loadSellerData();
      }
    }, 3000); // Check every 3 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkReload);
    };
  }, [id]);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      
      // Load seller info
      const sellerData = await apiRequest(`/api/User/${id}`);
      setSeller(sellerData);

      // Load seller products
      const productsData = await apiRequest(`/api/Product/seller/${id}`);
      // If viewing as admin, also load admin user detail to show status and reason
      try {
        if (isAdmin) {
          const detail = await apiRequest(`/api/admin/users/${id}`);
          setAdminUserDetail(detail);
        } else {
          setAdminUserDetail(null);
        }
      } catch (e) {
        console.warn('Could not load admin user detail:', e);
      }
      const productsList = Array.isArray(productsData) ? productsData : productsData?.items || [];
      
      // ✅ Add seller name to all products
      const sellerName = sellerData?.fullName || sellerData?.name || "Người bán";
      const productsWithSellerName = productsList.map(product => ({
        ...product,
        sellerName: sellerName
      }));
      
      // Filter approved products (still available)
      const approvedProducts = productsWithSellerName.filter(product => {
        const status = String(product.status || product.Status || "").toLowerCase();
        return status === "approved" || status === "active";
      });
      
      // Filter reserved products (after deposit payment)
      const reservedProducts = productsWithSellerName.filter(product => {
        const status = String(product.status || product.Status || "").toLowerCase();
        return status === "reserved";
      });
      
      // Filter sold products
      const soldProductsList = productsWithSellerName.filter(product => {
        const status = String(product.status || product.Status || "").toLowerCase();
        return status === "sold";
      });
      
      setProducts(approvedProducts);
      setPendingProducts(reservedProducts);
      setSoldProducts(soldProductsList);
    } catch (error) {
      console.error("Error loading seller data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy người bán
          </h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

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
                Profile người dùng
              </h1>
            </div>
            {isAdmin && adminUserDetail && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Trạng thái: {(adminUserDetail.status || adminUserDetail.Status) === 'active' ? 'Đang hoạt động' : (adminUserDetail.status || adminUserDetail.Status) === 'suspended' ? 'Đã tạm khóa' : 'Đã xóa'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seller Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {seller.avatar ? (
                    <img 
                      src={seller.avatar} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-bold text-2xl">
                      {seller.fullName?.charAt(0) || seller.name?.charAt(0) || "N"}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {seller.fullName || seller.name || "Người bán"}
                </h2>
                <p className="text-gray-600">
                  {seller.email}
                </p>
              </div>
              {(() => {
                if (!isAdmin || !adminUserDetail) return null;
                const status = (adminUserDetail.status || adminUserDetail.Status || 'active').toString().toLowerCase();
                const reason = adminUserDetail.reason || adminUserDetail.Reason || adminUserDetail.accountStatusReason || adminUserDetail.AccountStatusReason;
                if ((status === 'suspended' || status === 'deleted') && reason) {
                  return (
                    <div className="mt-4 p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
                      <div className="font-medium">Lý do trạng thái</div>
                      <div>{reason}</div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <Phone className="h-5 w-5 mr-3 text-blue-600" />
                  <span>{seller.phone || "Chưa cập nhật"}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-5 w-5 mr-3 text-blue-600" />
                  <span>{seller.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                  <span>Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                  <span>Tham gia: {new Date(seller.createdDate || seller.created_date).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {products.length}
                  </div>
                  <div className="text-sm text-gray-600">Sản phẩm</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">4.8</div>
                  <div className="text-sm text-gray-600">Đánh giá</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Liên hệ
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Theo dõi
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "profile"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Thông tin
                  </button>
                  <button
                    onClick={() => setActiveTab("products")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "products"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Sản phẩm ({products.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "pending"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Đang chờ xác nhận ({pendingProducts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("sold")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "sold"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Đã bán ({soldProducts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "reviews"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Đánh giá
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Giới thiệu
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Tài khoản đã được xác thực</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Thông tin chính xác</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-yellow-600 mr-3" />
                    <span className="text-gray-700">Người bán uy tín</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sản phẩm đã duyệt ({products.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-600">Tất cả đã được phê duyệt</span>
                    </div>
                  </div>
                  
                  {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map((product, index) => (
                        <div key={product.id || product.productId || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 line-clamp-2">
                                {product.title}
                              </h4>
                              <p className="text-lg font-bold text-blue-600 mt-1">
                                {formatPrice(product.price)}
                              </p>
                              <div className="flex items-center mt-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                                <span className="text-sm text-green-600">Đã duyệt</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Link
                              to={`/product/${product.id || product.productId}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Xem chi tiết →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Chưa có sản phẩm nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "pending" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sản phẩm đang chờ xác nhận ({pendingProducts.length})
                </h3>
                {pendingProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingProducts.map((product) => (
                      <div key={product.id || product.productId} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-yellow-200 rounded-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {product.title}
                            </h4>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              {formatPrice(product.price)}
                            </p>
                            <div className="flex items-center mt-2">
                              <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                              <span className="text-sm text-yellow-600">Đang trong quá trình thanh toán</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => confirmSale(product.id || product.productId)}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Xác nhận bán
                          </button>
                          <Link
                            to={`/product/${product.id || product.productId}`}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có sản phẩm nào đang chờ xác nhận</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sold" && (
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sản phẩm đã bán ({soldProducts.length})
                </h3>
                {soldProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {soldProducts.map((product) => (
                      <div key={product.id || product.productId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {product.title}
                            </h4>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              {formatPrice(product.price)}
                            </p>
                            <div className="flex items-center mt-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-sm text-green-600">Đã bán</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Cập nhật: {new Date(product.updatedAt || product.updated_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-gray-500 text-sm">
                            Sản phẩm này đã được bán và không còn hiển thị công khai
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có sản phẩm nào đã bán</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <RatingSystem sellerId={id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
