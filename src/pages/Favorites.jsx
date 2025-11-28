import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Search,
  Filter,
  Grid,
  List,
  Package,
  Star,
  MapPin,
  Calendar,
  Trash2,
  Eye,
  ShoppingCart,
  Car,
  Battery,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice } from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export const Favorites = () => {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [productTypeFilter, setProductTypeFilter] = useState("all"); // tất cả, xe, pin

  // Tính số lượng cho các tab
  const vehicleCount = favorites.filter(
    (p) => (p.productType || "").toLowerCase() === "vehicle" || (p.productType || "").toLowerCase() === "xe"
  ).length;
  const batteryCount = favorites.filter(
    (p) => (p.productType || "").toLowerCase() === "battery" || (p.productType || "").toLowerCase() === "pin"
  ).length;

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    console.log("Favorites changed, re-filtering:", favorites);
    filterAndSortFavorites();
  }, [favorites, searchTerm, sortBy, productTypeFilter]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.userId || user?.accountId;

      // Lấy danh sách ID sản phẩm yêu thích của user
      const favoritesData = await apiRequest(`/api/Favorite/user/${userId}`);
      console.log("🔍 Favorites data from API:", favoritesData);
      console.log("🔍 Favorites data type:", Array.isArray(favoritesData) ? "Array" : typeof favoritesData);
      
      // Xử lý các định dạng response khác nhau
      let favoriteList = [];
      if (Array.isArray(favoritesData)) {
        favoriteList = favoritesData;
      } else if (favoritesData && Array.isArray(favoritesData.items)) {
        favoriteList = favoritesData.items;
      } else if (favoritesData && favoritesData.data && Array.isArray(favoritesData.data)) {
        favoriteList = favoritesData.data;
      }
      
      const favoriteIds = favoriteList
        .map((fav) => fav.productId || fav.ProductId || fav.product_id || fav.Id)
        .filter((id) => id != null && id !== undefined); // Loại bỏ null/undefined

      console.log("🔍 Favorite product IDs:", favoriteIds);
      console.log("🔍 Total favorites:", favoriteIds.length);

      if (favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // ✅ Lấy chi tiết sản phẩm cho mỗi favorite song song
      const productPromises = favoriteIds.map(async (productId, index) => {
        // Sử dụng favoriteList từ scope bên ngoài
        const favList = favoriteList;
        try {
          console.log(`🔍 Loading product ${index + 1}/${favoriteIds.length}:`, productId);
          
          // ✅ Gọi API và kiểm tra status code
          let productData;
          try {
            const productPromise = apiRequest(`/api/Product/${productId}`);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout loading product ${productId}`)), 10000)
            );
            
            productData = await Promise.race([productPromise, timeoutPromise]);
            
            // Nếu productData là null hoặc có error message, có thể product không tồn tại
            if (!productData || (productData.message && productData.message.includes("Không tìm thấy"))) {
              throw new Error(`Product ${productId} not found`);
            }
            
            console.log(`✅ Loaded product ${productId}:`, productData?.title || productData?.name);
          } catch (apiError) {
            // Kiểm tra có phải lỗi 404 không
            const errorMessage = apiError.message || apiError.toString();
            const isNotFound = 
              apiError.status === 404 || 
              errorMessage.includes("not found") || 
              errorMessage.includes("404") || 
              errorMessage.includes("Không tìm thấy");
              
            if (isNotFound) {
              console.warn(`⚠️ Product ${productId} không tồn tại (404), sẽ tự động xóa khỏi favorites`);
              // Tự động xóa khỏi favorites
              const favoriteObj = favList.find(
                (fav) => 
                  (fav.productId || fav.ProductId || fav.product_id) == productId ||
                  (fav.productId || fav.ProductId || fav.product_id) === productId
              );
              const favoriteId = favoriteObj?.favoriteId || favoriteObj?.FavoriteId || favoriteObj?.id || favoriteObj?.Id;
              
              if (favoriteId) {
                try {
                  await apiRequest(`/api/Favorite/${favoriteId}`, { method: "DELETE" });
                  console.log(`✅ Đã xóa favorite ${favoriteId} cho product ${productId} không tồn tại`);
                } catch (deleteError) {
                  console.error(`❌ Không thể xóa favorite ${favoriteId}:`, deleteError);
                }
              }
              
              // Trả về null để lọc ra khỏi danh sách
              return null;
            }
            throw apiError;
          }

          // Tải ảnh sản phẩm
          let images = [];
          try {
            const imagesData = await apiRequest(
              `/api/ProductImage/product/${productId}`
            );
            const productImages = Array.isArray(imagesData)
              ? imagesData
              : imagesData?.items || [];
            
            // Lọc chỉ lấy ảnh sản phẩm (Xe/Pin), không lấy ảnh giấy tờ
            const filteredImages = productImages.filter((img) => {
              const imageName = (img.name || img.Name || "").toLowerCase();
              const imageType = (img.imageType || img.type || img.image_type || "").toLowerCase();
              // Chỉ lấy ảnh sản phẩm, không lấy ảnh giấy tờ
              return imageName !== "document" && imageName !== "doc" && imageType !== "document";
            });
            
            images = filteredImages
              .map((img) => img.imageData || img.imageUrl || img.url)
              .filter(Boolean); // Loại bỏ giá trị rỗng
          } catch (imageError) {
            console.log("⚠️ No images found for product:", productId, imageError);
          }

          // Tìm favoriteId từ favoritesData
          const favoriteObj = favList.find(
            (fav) => 
              (fav.productId || fav.ProductId || fav.product_id) == productId ||
              (fav.productId || fav.ProductId || fav.product_id) === productId
          );
          const favoriteId = favoriteObj?.favoriteId || favoriteObj?.FavoriteId || favoriteObj?.id || favoriteObj?.Id;

          return {
            ...productData,
            id: productData.id || productData.productId || productData.ProductId || productId,
            productId: productData.productId || productData.ProductId || productData.id || productId,
            images,
            favoriteId,
          };
        } catch (error) {
          console.error(`❌ Failed to load product ${productId}:`, error);
          console.error("Error details:", {
            productId,
            errorMessage: error.message,
            errorStack: error.stack,
          });
          
          // Nếu không phải lỗi 404, vẫn giữ lại với thông báo lỗi
          const favoriteObj = favList.find(
            (fav) => 
              (fav.productId || fav.ProductId || fav.product_id) == productId ||
              (fav.productId || fav.ProductId || fav.product_id) === productId
          );
          const favoriteId = favoriteObj?.favoriteId || favoriteObj?.FavoriteId || favoriteObj?.id || favoriteObj?.Id;
          
          return {
            id: productId,
            productId: productId,
            title: `Product ${productId} (Failed to load)`,
            price: 0,
            images: [],
            error: error.message,
            favoriteId: favoriteId,
            canRetry: true, // Đánh dấu có thể thử lại
          };
        }
      });

      const products = await Promise.all(productPromises);
      console.log("🔍 All loaded products:", products);
      
      // Lọc null (sản phẩm đã bị xóa) và giữ lại sản phẩm có lỗi để thử lại
      const validProducts = products.filter((product) => product !== null);
      const deletedProducts = products.filter((product) => product === null).length;
      
      console.log(`✅ Loaded ${validProducts.length}/${favoriteIds.length} products successfully`);
      
      if (deletedProducts > 0) {
        showToast({
          title: "✅ Đã cập nhật danh sách",
          description: `Đã xóa ${deletedProducts} sản phẩm không tồn tại khỏi danh sách yêu thích.`,
          type: "success",
        });
      }
      
      if (validProducts.length < favoriteIds.length && deletedProducts === 0) {
        const failedCount = favoriteIds.length - validProducts.length;
        console.warn(`⚠️ ${failedCount} products failed to load`);
        showToast({
          title: "⚠️ Một số sản phẩm không tải được",
          description: `Đã tải ${validProducts.length}/${favoriteIds.length} sản phẩm. Vui lòng refresh trang.`,
          type: "warning",
        });
      }

      setFavorites(validProducts);
    } catch (error) {
      console.error("Error loading favorites:", error);
      showToast({
        title: "❌ Lỗi tải danh sách yêu thích",
        description:
          "Không thể tải danh sách sản phẩm yêu thích. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFavorites = () => {
    let filtered = [...favorites];

    // Lọc theo loại sản phẩm
    if (productTypeFilter !== "all") {
      filtered = filtered.filter((product) => {
        const productType = (product.productType || "").toLowerCase();
        if (productTypeFilter === "vehicle") {
          return productType === "vehicle" || productType === "xe";
        } else if (productTypeFilter === "battery") {
          return productType === "battery" || productType === "pin";
        }
        return true;
      });
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sắp xếp
    switch (sortBy) {
      case "newest":
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.createdDate || b.created_date) -
            new Date(a.createdDate || a.created_date)
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) =>
            new Date(a.createdDate || a.created_date) -
            new Date(b.createdDate || b.created_date)
        );
        break;
      case "price_low":
        filtered = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_high":
        filtered = filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "name_asc":
        filtered = filtered.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
        break;
      case "name_desc":
        filtered = filtered.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "")
        );
        break;
      default:
        break;
    }

    setFilteredFavorites(filtered);
  };

  const removeFavorite = async (productId, favoriteId) => {
    try {
      console.log("Removing favorite:", { productId, favoriteId });
      console.log("Current favorites before removal:", favorites);

      await apiRequest(`/api/Favorite/${favoriteId}`, {
        method: "DELETE",
      });

      setFavorites((prev) => {
        const filtered = prev.filter(
          (fav) => (fav.id || fav.productId) !== productId
        );
        console.log("Favorites after removal:", filtered);
        return filtered;
      });
      showToast({
        title: "💔 Đã xóa khỏi yêu thích",
        description: "Sản phẩm đã được xóa khỏi danh sách yêu thích",
        type: "success",
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      showToast({
        title: "❌ Lỗi xóa yêu thích",
        description:
          "Không thể xóa sản phẩm khỏi danh sách yêu thích. Vui lòng thử lại.",
        type: "error",
      });
    }
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sản phẩm yêu thích
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredFavorites.length} / {favorites.length} sản phẩm
                {productTypeFilter === "vehicle"
                  ? " xe"
                  : productTypeFilter === "battery"
                  ? " pin"
                  : ""}{" "}
                trong danh sách yêu thích
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Type Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Loại sản phẩm:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setProductTypeFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  productTypeFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tất cả ({favorites.length})
              </button>
              <button
                onClick={() => setProductTypeFilter("vehicle")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  productTypeFilter === "vehicle"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Car className="h-4 w-4 mr-1" />
                Xe điện ({vehicleCount})
              </button>
              <button
                onClick={() => setProductTypeFilter("battery")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  productTypeFilter === "battery"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Battery className="h-4 w-4 mr-1" />
                Pin ({batteryCount})
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm yêu thích..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort and View */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="price_low">Giá thấp → cao</option>
                <option value="price_high">Giá cao → thấp</option>
                <option value="name_asc">Tên A → Z</option>
                <option value="name_desc">Tên Z → A</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Favorites List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {filteredFavorites.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredFavorites.map((product, index) => (
                <div key={product.id || product.productId || index}>
                  {viewMode === "grid" ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {/* Product Image */}
                      <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        {(!product.images || product.images.length === 0) && (
                          <div className="flex items-center justify-center h-48">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {/* Favorite Button */}
                        <button
                          onClick={() =>
                            removeFavorite(
                              product.id || product.productId,
                              product.favoriteId
                            )
                          }
                          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                        >
                          <Heart className="h-5 w-5 text-red-500 fill-current" />
                        </button>
                      </div>

                        {/* Product Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">
                            {product.title}
                          </h3>
                          {/* Product Type Badge */}
                          {(product.productType || "").toLowerCase() === "battery" || (product.productType || "").toLowerCase() === "pin" ? (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center whitespace-nowrap">
                              <Battery className="h-3 w-3 mr-1" />
                              Pin
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center whitespace-nowrap">
                              <Car className="h-3 w-3 mr-1" />
                              Xe
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          {formatPrice(product.price || 0)}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {product.location || "Hà Nội"}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {product.createdDate || product.created_date
                                ? new Date(product.createdDate || product.created_date).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleViewProduct(product.id || product.productId)
                            }
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() =>
                              removeFavorite(
                                product.id || product.productId,
                                product.favoriteId
                              )
                            }
                            className="px-3 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        {(!product.images || product.images.length === 0) && (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium text-gray-900 flex-1">
                            {product.title}
                          </h3>
                          {/* Product Type Badge */}
                          {(product.productType || "").toLowerCase() === "battery" || (product.productType || "").toLowerCase() === "pin" ? (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center whitespace-nowrap">
                              <Battery className="h-3 w-3 mr-1" />
                              Pin
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center whitespace-nowrap">
                              <Car className="h-3 w-3 mr-1" />
                              Xe
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          {formatPrice(product.price || 0)}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{product.location || "Hà Nội"}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {product.createdDate || product.created_date
                                ? new Date(product.createdDate || product.created_date).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleViewProduct(product.id || product.productId)
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() =>
                            removeFavorite(
                              product.id || product.productId,
                              product.favoriteId
                            )
                          }
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm
                  ? "Không tìm thấy sản phẩm"
                  : "Chưa có sản phẩm yêu thích"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Hãy khám phá và thêm sản phẩm vào danh sách yêu thích"}
              </p>
              <Link
                to="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Khám phá sản phẩm
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
