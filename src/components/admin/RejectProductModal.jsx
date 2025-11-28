import { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

export const RejectProductModal = ({ isOpen, onClose, product, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show: showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      showToast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the correct product ID using the same logic as AdminDashboard
      const productId = product?.id || product?.productId || product?.Id || product?.listingId;
      
      if (!productId) {
        throw new Error("Product ID not found");
      }

      await onReject(productId, rejectionReason);

      showToast({
        title: "Từ chối thành công",
        description: `Sản phẩm "${product.title}" đã bị từ chối`,
        type: "success",
      });

      setRejectionReason("");
      onClose();
    } catch (error) {
      console.error("Error rejecting product:", error);
      showToast({
        title: "Lỗi từ chối",
        description: "Không thể từ chối sản phẩm. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Từ chối sản phẩm
              </h3>
              <p className="text-sm text-gray-600">
                Nhập lý do từ chối để thông báo cho người bán
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            {product.imageUrls && product.imageUrls.length > 0 && (
              <img
                src={product.imageUrls[0]}
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{product.title}</h4>
              <p className="text-sm text-gray-600">ID: {product?.id || product?.productId || product?.Id || product?.listingId}</p>
              <p className="text-sm text-gray-600">
                Người bán: {product.sellerName || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối sản phẩm này..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Lý do này sẽ được gửi đến người bán để họ biết cần sửa gì
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rejectionReason.trim()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang từ chối...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Từ chối sản phẩm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

