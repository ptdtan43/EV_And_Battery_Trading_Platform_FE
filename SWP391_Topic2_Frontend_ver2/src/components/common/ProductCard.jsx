import { Link } from "react-router-dom";
import { Heart, Eye, Calendar, Gauge, Battery, Info } from "lucide-react";
import { formatPrice } from "../../utils/formatters";

export const ProductCard = ({ product, onToggleFavorite, isFavorite }) => {
  const primaryImage = product.images?.[0];

  // Helper function to get the correct product ID
  const getProductId = (product) => {
    return (
      product?.id ||
      product?.productId ||
      product?.Id ||
      product?.listingId ||
      product?.product_id ||
      null
    );
  };

  const productId = getProductId(product);

  // Debug log
  console.log("🖼️ ProductCard - Product data:", product);
  console.log("🖼️ ProductCard - Product ID:", productId);
  console.log("🖼️ ProductCard - Images array:", product.images);
  console.log("🖼️ ProductCard - Primary image:", primaryImage);
  console.log("🖼️ ProductCard - Will show image?", !!primaryImage);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className="relative overflow-hidden">
        {product.status === "sold" && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Đã bán
          </div>
        )}

        {product.is_auction && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Đấu giá
          </div>
        )}

        <Link to={`/product/${productId}`}>
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-4xl mb-2">
                  {product.productType?.toLowerCase() === "battery"
                    ? "🔋"
                    : "🚗"}
                </div>
                <div className="text-sm">Chưa có ảnh</div>
              </div>
            </div>
          )}
        </Link>

        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(productId)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Link to={`/product/${productId}`}>
              <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                {product.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-600">
              {product.productType?.toLowerCase() === "battery"
                ? // Thông tin pin
                  product.brand && product.model
                  ? `${product.brand} ${product.model}`
                  : product.brand || product.model || "Thông tin pin"
                : // Thông tin xe
                  product.licensePlate ||
                  product.license_plate ||
                  product.license ||
                  "Biển số: N/A"}
            </p>
          </div>
        </div>

        {/* Thông số kỹ thuật - Layout cải tiến */}
        <div className="space-y-2 mb-3">
          {/* Thông tin xe điện */}
          {product.productType?.toLowerCase() === "vehicle" && (
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              {product.year && (
                <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                  <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {product.year}
                  </span>
                </div>
              )}
              {product.mileage && (
                <div className="flex items-center bg-green-50 px-2 py-1 rounded-md">
                  <Gauge className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-green-800 font-medium">
                    {product.mileage.toLocaleString()} km
                  </span>
                </div>
              )}
              {product.battery_capacity && (
                <div className="flex items-center bg-purple-50 px-2 py-1 rounded-md">
                  <Battery className="h-4 w-4 mr-1 text-purple-600" />
                  <span className="text-purple-800 font-medium">
                    {product.battery_capacity} kWh
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Thông tin pin - Layout đơn giản như xe */}
          {product.productType?.toLowerCase() === "battery" && (
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              {product.capacity && (
                <div className="flex items-center bg-green-50 px-2 py-1 rounded-md">
                  <Gauge className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-green-800 font-medium">
                    {product.capacity} Ah
                  </span>
                </div>
              )}
              {product.batteryHealth && (
                <div className="flex items-center bg-green-50 px-2 py-1 rounded-md">
                  <div className="h-4 w-4 mr-1 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-green-800 font-medium">
                    {product.batteryHealth}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Fallback cho sản phẩm không có productType */}
          {!product.productType && (
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              {product.year && (
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                  <Calendar className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="text-gray-800 font-medium">
                    {product.year}
                  </span>
                </div>
              )}
              {product.mileage && (
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                  <Gauge className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="text-gray-800 font-medium">
                    {product.mileage.toLocaleString()} km
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-3">
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {formatPrice(product.price)}
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {new Date(
                product.createdAt ||
                  product.created_at ||
                  product.createdDate ||
                  product.datePosted ||
                  Date.now()
              ).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/product/${productId}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Info className="h-4 w-4 mr-2" />
            Chi tiết
          </Link>
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(productId)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
