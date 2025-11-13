import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Eye, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { getRejectedProducts, resubmitProduct } from "../../lib/productApi";
import { formatPrice, formatDate } from "../../utils/formatters";

export const RejectedProducts = () => {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [rejectedProducts, setRejectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(new Set());

  useEffect(() => {
    if (user) {
      loadRejectedProducts();
    }
  }, [user]);

  const loadRejectedProducts = async () => {
    try {
      setLoading(true);
      const sellerId = user.id || user.userId || user.accountId;
      const products = await getRejectedProducts(sellerId);
      setRejectedProducts(products);
    } catch (error) {
      console.error("Error loading rejected products:", error);
      showToast({
        title: "Lỗi tải sản phẩm",
        description: "Không thể tải danh sách sản phẩm bị từ chối",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (productId) => {
    try {
      setResubmitting((prev) => new Set(prev).add(productId));

      await resubmitProduct(productId);

      // Update local state
      setRejectedProducts((prev) =>
        prev.map((product) =>
          product.productId === productId
            ? { ...product, status: "pending", verificationStatus: "pending" }
            : product
        )
      );

      showToast({
        title: "Gửi lại thành công",
        description: "Sản phẩm đã được gửi lại để admin xem xét",
        type: "success",
      });
    } catch (error) {
      console.error("Error resubmitting product:", error);
      showToast({
        title: "Lỗi gửi lại",
        description: "Không thể gửi lại sản phẩm. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setResubmitting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-600">
          Đang tải sản phẩm bị từ chối...
        </span>
      </div>
    );
  }

  if (rejectedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Không có sản phẩm bị từ chối
        </h3>
        <p className="text-gray-600">
          Tất cả sản phẩm của bạn đều đã được duyệt hoặc đang chờ duyệt
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Sản phẩm bị từ chối
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Các sản phẩm dưới đây đã bị admin từ chối. Bạn có thể chỉnh sửa và
              gửi lại để admin xem xét.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {rejectedProducts.map((product) => (
          <div
            key={product.productId}
            className="bg-white rounded-xl shadow-lg border border-red-200 p-6"
          >
            <div className="flex items-start space-x-4">
              {/* Product Image */}
              {product.imageUrls && product.imageUrls.length > 0 && (
                <img
                  src={product.imageUrls[0]}
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}

              {/* Product Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {product.title}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>ID: {product.productId}</span>
                      <span>•</span>
                      <span>{formatPrice(product.price)}</span>
                      <span>•</span>
                      <span>{formatDate(product.createdDate)}</span>
                    </div>

                    {/* Rejection Reason */}
                    {product.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-1">
                              Lý do từ chối:
                            </p>
                            <p className="text-sm text-red-700">
                              {product.rejectionReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleResubmit(product.productId)}
                      disabled={resubmitting.has(product.productId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {resubmitting.has(product.productId) ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          <span>Gửi lại</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

