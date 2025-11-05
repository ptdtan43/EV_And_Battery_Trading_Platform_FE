import { useState } from "react";
import { X, AlertTriangle, Send, CheckCircle } from "lucide-react";
import { createReport, REPORT_TYPES } from "../../lib/reportApi";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { notifyAdminReportReceived } from "../../lib/notificationApi";
import { apiRequest } from "../../lib/api";

export const ReportModal = ({ isOpen, onClose, product }) => {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  
  const [reportType, setReportType] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để báo cáo vi phạm",
        type: "warning",
      });
      return;
    }

    if (!reportType) {
      showToast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng chọn loại vi phạm",
        type: "warning",
      });
      return;
    }

    if (!reportReason.trim()) {
      showToast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng mô tả lý do báo cáo",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create report
      const reportData = {
        productId: product.id || product.productId,
        reportType: reportType,
        reportReason: reportReason.trim(),
      };

      const response = await createReport(reportData);
      console.log("✅ Report created:", response);

      // Notify admin
      try {
        const users = await apiRequest('/api/User');
        const adminUser = users.find(u => 
          u.role === 'admin' || 
          u.role === 'Admin' || 
          u.isAdmin === true ||
          u.email?.toLowerCase().includes('admin')
        );
        
        if (adminUser) {
          const adminUserId = adminUser.id || adminUser.userId || adminUser.accountId;
          const reporterName = user?.fullName || user?.name || user?.email || "Người dùng";
          
          await notifyAdminReportReceived(
            adminUserId,
            product.title || product.name,
            product.id || product.productId,
            reporterName,
            reportType
          );
          console.log('✅ Admin notified about report');
        }
      } catch (notifError) {
        console.warn('⚠️ Failed to notify admin about report:', notifError);
      }

      setSubmitted(true);
      
      showToast({
        title: "✅ Báo cáo thành công",
        description: "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.",
        type: "success",
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        // Reset form
        setReportType("");
        setReportReason("");
        setSubmitted(false);
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error creating report:", error);
      showToast({
        title: "❌ Lỗi báo cáo",
        description: error.message || "Không thể gửi báo cáo. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReportType("");
      setReportReason("");
      setSubmitted(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Báo cáo vi phạm
                </h3>
                <p className="text-red-50 text-sm">
                  Giúp chúng tôi duy trì cộng đồng lành mạnh
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Đã gửi báo cáo thành công!
              </h4>
              <p className="text-gray-600">
                Cảm ơn bạn đã giúp chúng tôi duy trì cộng đồng lành mạnh.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-orange-500">
                <p className="text-sm text-gray-600 mb-1">Bài đăng bị báo cáo:</p>
                <p className="font-semibold text-gray-900">{product?.title || product?.name}</p>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại vi phạm <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-white"
                >
                  <option value="">-- Chọn loại vi phạm --</option>
                  {Object.entries(REPORT_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  rows={5}
                  placeholder="Vui lòng mô tả chi tiết lý do bạn báo cáo bài đăng này..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tối thiểu 10 ký tự. Hãy cung cấp thông tin cụ thể để chúng tôi có thể xử lý nhanh hơn.
                </p>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Báo cáo sai sự thật có thể dẫn đến việc tài khoản bị khóa</li>
                      <li>Chúng tôi sẽ xem xét và xử lý trong vòng 24-48 giờ</li>
                      <li>Thông tin báo cáo của bạn sẽ được bảo mật</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reportType || !reportReason.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-lg hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Gửi báo cáo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

