import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  ExternalLink,
  Filter,
  Search
} from "lucide-react";
import { 
  getAllReports, 
  getReportsByStatus, 
  updateReportStatus, 
  deleteReport,
  REPORT_STATUS 
} from "../../lib/reportApi";
import { useToast } from "../../contexts/ToastContext";
import { formatPrice } from "../../utils/formatters";
import { useNavigate } from "react-router-dom";
import { ResolveReportModal } from "./ResolveReportModal";

export const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const { show: showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const loadReports = async () => {
    try {
      setLoading(true);
      let data;
      
      if (filterStatus === "all") {
        data = await getAllReports();
      } else {
        data = await getReportsByStatus(filterStatus);
      }
      
      // Sắp xếp theo thời gian mới nhất trước
      const sortedData = Array.isArray(data) ? data.sort((a, b) => {
        const dateA = new Date(a.createdDate || a.createdAt || 0);
        const dateB = new Date(b.createdDate || b.createdAt || 0);
        return dateB - dateA; // Mới nhất trước
      }) : [];
      
      setReports(sortedData);
    } catch (error) {
      console.error("Error loading reports:", error);
      showToast({
        title: "❌ Lỗi",
        description: "Không thể tải danh sách báo cáo",
        type: "error",
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await updateReportStatus(reportId, newStatus);
      showToast({
        title: "✅ Thành công",
        description: "Đã cập nhật trạng thái báo cáo",
        type: "success",
      });
      loadReports();
    } catch (error) {
      console.error("Error updating report status:", error);
      showToast({
        title: "❌ Lỗi",
        description: "Không thể cập nhật trạng thái",
        type: "error",
      });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
      return;
    }

    try {
      await deleteReport(reportId);
      showToast({
        title: "✅ Thành công",
        description: "Đã xóa báo cáo",
        type: "success",
      });
      loadReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      showToast({
        title: "❌ Lỗi",
        description: "Không thể xóa báo cáo",
        type: "error",
      });
    }
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleOpenResolveModal = (report) => {
    setSelectedReport(report);
    setShowResolveModal(true);
  };

  const handleCloseResolveModal = () => {
    setShowResolveModal(false);
    setSelectedReport(null);
  };

  const handleResolveSuccess = () => {
    loadReports(); // Refresh the reports list
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [REPORT_STATUS.PENDING]: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Chờ xử lý"
      },
      [REPORT_STATUS.REVIEWED]: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Eye,
        label: "Đã xem xét"
      },
      [REPORT_STATUS.RESOLVED]: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Đã giải quyết"
      },
      [REPORT_STATUS.REJECTED]: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        label: "Từ chối"
      }
    };

    const config = statusConfig[status] || statusConfig[REPORT_STATUS.PENDING];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      report.productTitle?.toLowerCase().includes(search) ||
      report.reporterName?.toLowerCase().includes(search) ||
      report.reportType?.toLowerCase().includes(search) ||
      report.reportReason?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === REPORT_STATUS.PENDING).length,
    reviewed: reports.filter(r => r.status === REPORT_STATUS.REVIEWED).length,
    resolved: reports.filter(r => r.status === REPORT_STATUS.RESOLVED).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Quản lý báo cáo vi phạm</h2>
            <p className="text-red-50">
              Xem xét và xử lý các báo cáo từ người dùng
            </p>
          </div>
          <AlertTriangle className="h-12 w-12 opacity-80" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border-l-4 border-gray-400">
          <p className="text-sm text-gray-600">Tổng số báo cáo</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-600">Chờ xử lý</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400">
          <p className="text-sm text-gray-600">Đã xem xét</p>
          <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-green-400">
          <p className="text-sm text-gray-600">Đã giải quyết</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm báo cáo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value={REPORT_STATUS.PENDING}>Chờ xử lý</option>
              <option value={REPORT_STATUS.REVIEWED}>Đã xem xét</option>
              <option value={REPORT_STATUS.RESOLVED}>Đã giải quyết</option>
              <option value={REPORT_STATUS.REJECTED}>Từ chối</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "Không tìm thấy báo cáo phù hợp" : "Chưa có báo cáo nào"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div key={report.reportId} className="px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                {/* Header with Title, ID and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {report.productTitle}
                    </h3>
                    <span className="text-sm text-gray-500">ID: #{report.productId}</span>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-8 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Người báo cáo: </span>
                    <span className="font-medium text-gray-900">{report.reporterName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Loại vi phạm: </span>
                    <span className="font-semibold text-red-600">{report.reportType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngày: </span>
                    <span className="text-gray-900">
                      {new Date(report.createdDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Lý do:</p>
                  <p className="text-sm text-gray-800">{report.reportReason}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProduct(report.productId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Xem SP
                  </button>
                  
                  {report.status !== REPORT_STATUS.RESOLVED && (
                    <button
                      onClick={() => handleOpenResolveModal(report)}
                      className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Giải quyết
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteReport(report.reportId)}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Report Modal */}
      <ResolveReportModal
        isOpen={showResolveModal}
        onClose={handleCloseResolveModal}
        report={selectedReport}
        onResolve={handleResolveSuccess}
      />
    </div>
  );
};

