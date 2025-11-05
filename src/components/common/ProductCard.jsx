import { Link } from "react-router-dom";
import { Heart, Eye, Calendar, Gauge, Battery, Info } from "lucide-react";
import { formatPrice } from "../../utils/formatters";
import { VerificationButton } from "./VerificationButton";

export const ProductCard = ({ product, onToggleFavorite, isFavorite, user }) => {
  // Try multiple ways to get the primary image
  let primaryImage = null;
  
  // Method 1: Try product.images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    primaryImage = product.images[0];
  }
  
  // Method 2: Try other image fields
  if (!primaryImage) {
    const imageFields = ['imageData', 'imageUrl', 'imageUrls', 'photo', 'photos', 'picture', 'pictures'];
    for (const field of imageFields) {
      if (product[field]) {
        if (Array.isArray(product[field]) && product[field].length > 0) {
          primaryImage = product[field][0];
        } else if (typeof product[field] === 'string' && product[field].trim() !== '') {
          primaryImage = product[field];
        }
        if (primaryImage) break;
      }
    }
  }
  
  // Method 3: Try capitalized fields
  if (!primaryImage) {
    const imageFields = ['ImageData', 'ImageUrl', 'ImageUrls', 'Photo', 'Photos', 'Picture', 'Pictures'];
    for (const field of imageFields) {
      if (product[field]) {
        if (Array.isArray(product[field]) && product[field].length > 0) {
          primaryImage = product[field][0];
        } else if (typeof product[field] === 'string' && product[field].trim() !== '') {
          primaryImage = product[field];
        }
        if (primaryImage) break;
      }
    }
  }

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
  console.log("🖼️ ProductCard - All image fields:", Object.keys(product).filter(key => 
    key.toLowerCase().includes('image') || 
    key.toLowerCase().includes('photo') || 
    key.toLowerCase().includes('picture')
  ));

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

        {/* Verification Status Badge - Bottom Right */}
        {product.verificationStatus === "Verified" && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium z-10 shadow-sm">
            Đã kiểm định
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
          
          {/* Seller name - Always show with fallback */}
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">
              {product.sellerName || product.seller?.fullName || "Người bán"}
            </span>
          </div>
          
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

        {/* Verification Button - Only show for vehicles, product owner, and not verified */}
        {product.productType === "Vehicle" && 
         product.verificationStatus !== "Verified" && 
         user && (user.id || user.userId || user.accountId) === (product.sellerId || product.userId) && (
          <div className="mb-3">
            <VerificationButton
              productId={productId}
              currentStatus={product.verificationStatus || 'NotRequested'}
              isOwner={true}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Link
            to={`/product/${productId}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Xem
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
