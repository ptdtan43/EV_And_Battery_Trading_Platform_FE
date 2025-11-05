import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { rejectProduct } from "../../lib/productApi";
import { updateReportStatus } from "../../lib/reportApi";

export const ResolveReportModal = ({ isOpen, onClose, report, onResolve }) => {
  const [adminReason, setAdminReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show: showToast } = useToast();

  if (!isOpen || !report) return null;

  const handleConfirm = async () => {
    if (!adminReason.trim()) {
      showToast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng nhập lý do từ admin",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🔧 Resolving report by rejecting product:", report);
      
      // Reject product with combined message from user report + admin reason
      const rejectionMessage = `[BÁO CÁO] Sản phẩm bị báo cáo vi phạm: "${report.reportType}".
      
Lý do từ người báo cáo: ${report.reportReason}

Lý do từ Admin: ${adminReason}

Vui lòng chỉnh sửa và đăng lại.`;
      
      await rejectProduct(report.productId, rejectionMessage);
      console.log("✅ Product rejected successfully");

      // Update report status to Resolved
      await updateReportStatus(report.reportId, "Resolved");
      console.log("✅ Report status updated to Resolved");

      showToast({
        title: "✅ Giải quyết thành công",
        description: `Đã từ chối sản phẩm "${report.productTitle}" và thông báo seller`,
        type: "success",
      });

      setAdminReason("");
      onClose();
      
      if (onResolve) {
        onResolve();
      }
    } catch (error) {
      console.error("❌ Error resolving report:", error);
      showToast({
        title: "❌ Lỗi",
        description: error.message || "Không thể giải quyết báo cáo",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAdminReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-white" />
              <h3 className="text-lg font-bold text-white">
                Xác nhận giải quyết báo cáo
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Sản phẩm:</p>
              <p className="font-semibold text-gray-900">{report.productTitle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loại vi phạm:</p>
              <p className="font-semibold text-red-600">{report.reportType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lý do từ người báo cáo:</p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded p-3">
                {report.reportReason}
              </p>
            </div>
          </div>

          {/* Admin Reason Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do từ Admin <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              placeholder="VD: Sản phẩm có dấu hiệu lừa đảo, giá không hợp lý, ảnh không rõ ràng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-gray-900 bg-white text-sm"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Lý do này sẽ được gửi kèm với báo cáo từ user đến seller
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              <strong>Hành động này sẽ:</strong> Từ chối sản phẩm (ẩn khỏi homepage), gửi thông báo cho seller, đánh dấu báo cáo là "Đã giải quyết"
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || !adminReason.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all text-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
