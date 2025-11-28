import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Car,
  Shield,
  BarChart3,
  Activity,
  Bell,
  Flag,
  LogOut,
  AlertTriangle,
  CreditCard,
  ShoppingCart,
  FileText,
  UserCheck,
  X,
  Upload,
  File,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate, formatDateTime, getOrderStatusText } from "../utils/formatters";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import tokenManager from "../lib/tokenManager";

export const StaffDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const { signOut, user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return sessionStorage.getItem('staff_active_tab') || "transactions";
    } catch (_) {
      return "transactions";
    }
  });
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    todaysRevenue: 0,
    thisMonthRevenue: 0,
    pendingListings: 0,
    approvedListings: 0,
    totalUsers: 0,
    activeUsers: 0,
  });

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Trạng thái phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 10 đơn hàng mỗi trang
  //upload hop dong
  const [uploadContractModal, setUploadContractModal] = useState({
    isOpen: false,
    order: null,
    selectedFile: null,
    fileName: "",
    filePreview: null,
  });

  // Trạng thái modal từ chối giao dịch cho nhân viên
  const [transactionFailureModal, setTransactionFailureModal] = useState({
    isOpen: false,
    product: null,
    orderId: null,
    reasonCode: '',
    reasonNote: '',
    refundOption: 'refund', // 'refund' or 'no_refund'
  });

  // Trạng thái modal chi tiết đơn hàng
  const [orderDetailModal, setOrderDetailModal] = useState({
    isOpen: false,
    order: null,
    orderDetails: null,
    loading: false,
  });

  // Các lựa chọn lý do từ chối giao dịch
  const transactionFailureReasons = [
    { code: 'BUYER_REQUEST', label: 'Người mua yêu cầu hủy' },
    { code: 'SELLER_CANCEL', label: 'Người bán hủy giao dịch' },
    { code: 'PAYMENT_FAILED', label: 'Thanh toán thất bại' },
    { code: 'PRODUCT_DAMAGED', label: 'Sản phẩm bị hư hỏng' },
    { code: 'MISMATCH_DESCRIPTION', label: 'Sản phẩm không đúng mô tả' },
    { code: 'FRAUD_SUSPECT', label: 'Nghi ngờ gian lận' },
    { code: 'OUT_OF_STOCK', label: 'Sản phẩm không còn hàng' },
    { code: 'PRICE_DISPUTE', label: 'Tranh chấp về giá' },
    { code: 'DELIVERY_ISSUE', label: 'Vấn đề giao hàng' },
    { code: 'OTHER', label: 'Lý do khác' },
  ];

  // Lưu tab đã chọn
  useEffect(() => {
    try {
      sessionStorage.setItem('staff_active_tab', activeTab);
    } catch (_) {}
  }, [activeTab]);

  // Tải thống kê dashboard
  const loadStats = async () => {
    try {
      // Tải đơn hàng
      const ordersData = await apiRequest("/api/Order");
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      
      // Tải sản phẩm
      const productsData = await apiRequest("/api/Product");
      const productsArray = Array.isArray(productsData) ? productsData : [];
      
      // Tải người dùng
      const usersData = await apiRequest("/api/User");
      const usersArray = Array.isArray(usersData) ? usersData : [];

      // 4. Tính toán thống kê
      const totalOrders = ordersArray.length;
      const pendingOrders = ordersArray.filter(o => 
        (o.status || o.Status || "").toLowerCase() === "pending"
      ).length;
      const completedOrders = ordersArray.filter(o => 
        (o.status || o.Status || "").toLowerCase() === "completed"
      ).length;
      const activeOrders = ordersArray.filter(o => {
        const status = (o.status || o.Status || "").toLowerCase();
        return status === "pending" || status === "deposited";
      }).length;
      const cancelledOrders = ordersArray.filter(o => {
        const status = (o.status || o.Status || "").toLowerCase();
        return status === "cancelled" || status === "canceled" || status === "failed";
      }).length;

      const totalRevenue = ordersArray
        .filter(o => (o.status || o.Status || "").toLowerCase() === "completed")
        .reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.TotalAmount || 0)), 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysRevenue = ordersArray
        .filter(o => {
          const status = (o.status || o.Status || "").toLowerCase();
          const orderDate = new Date(o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate);
          orderDate.setHours(0, 0, 0, 0);
          return status === "completed" && orderDate.getTime() === today.getTime();
        })
        .reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.TotalAmount || 0)), 0);

      const thisMonthRevenue = ordersArray
        .filter(o => {
          const status = (o.status || o.Status || "").toLowerCase();
          const orderDate = new Date(o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate);
          return status === "completed" && 
                 orderDate.getMonth() === today.getMonth() &&
                 orderDate.getFullYear() === today.getFullYear();
        })
        .reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.TotalAmount || 0)), 0);

      const pendingListings = productsArray.filter(p => 
        (p.status || p.Status || "").toLowerCase() === "pending"
      ).length;
      const approvedListings = productsArray.filter(p => 
        (p.status || p.Status || "").toLowerCase() === "approved"
      ).length;

      const totalUsers = usersArray.length;
      const activeUsers = usersArray.filter(u => 
        (u.accountStatus || u.AccountStatus || "").toLowerCase() === "active"
      ).length;

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        activeOrders,
        cancelledOrders,
        totalRevenue,
        todaysRevenue,
        thisMonthRevenue,
        pendingListings,
        approvedListings,
        totalUsers,
        activeUsers,
      });

       // 5. Gộp thông tin sản phẩm vào đơn hàng (enrich)
      const enrichedOrders = ordersArray.map(order => {
        const productId = order.productId || order.ProductId;
        let productName = order.productName || order.ProductName;
        
        // If productName is not available, try to find from products array
        if (!productName && productId) {
          const product = productsArray.find(p => 
            (p.productId || p.ProductId || p.id || p.Id) == productId
          );
          if (product) {
            productName = product.title || product.Title || "N/A";
          }
        }
        
        // Cũng thử lấy từ object order.product nếu có
        if (!productName && order.product) {
          productName = order.product.title || order.product.Title || "N/A";
        }
        
        return {
          ...order,
          productName: productName || "N/A",
          enrichedProductName: productName || "N/A"
        };
      });

      // Sắp xếp đơn hàng theo ngày tạo (mới nhất trước)
      const sortedOrders = enrichedOrders.sort((a, b) => {
        const dateA = new Date(a.createdDate || a.CreatedDate || a.createdAt || a.CreatedAt || a.orderDate || a.OrderDate || 0);
        const dateB = new Date(b.createdDate || b.CreatedDate || b.createdAt || b.CreatedAt || b.orderDate || b.OrderDate || 0);
        return dateB.getTime() - dateA.getTime(); // Sắp xếp giảm dần (mới nhất trước)
      });

      setOrders(sortedOrders);
    } catch (error) {
      console.error("Error loading stats:", error);
      showToast({ 
        title: "Lỗi", 
        description: "Không tải được thống kê", 
        type: "error" 
      });
    }
  };

  // Tải dữ liệu dựa trên tab đang hoạt động
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadStats();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // Lọc đơn hàng
  useEffect(() => {
    let filtered = [...orders];

    if (orderStatusFilter !== "all") {
      filtered = filtered.filter(o => {
        const status = (o.status || o.Status || "").toLowerCase();
        return status === orderStatusFilter.toLowerCase();
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => {
        const orderId = String(o.orderId || o.OrderId || o.id || o.Id || "");
        const buyerName = (o.buyerName || o.BuyerName || "").toLowerCase();
        const sellerName = (o.sellerName || o.SellerName || "").toLowerCase();
        const productName = (o.productName || o.ProductName || "").toLowerCase();
        return orderId.includes(term) || 
               buyerName.includes(term) || 
               sellerName.includes(term) ||
               productName.includes(term);
      });
    }

    setFilteredOrders(filtered);
    // Đặt lại về trang 1 khi bộ lọc thay đổi
    setCurrentPage(1);
  }, [orders, orderStatusFilter, searchTerm]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setOrderStatusFilter("all");
  };

  // Xử lý chọn file (Hợp đồng)
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (tối đa 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          title: "Lỗi",
          description: "File không được vượt quá 10MB",
          type: "error",
        });
        return;
      }

      // Tạo bản xem trước cho hình ảnh
      let preview = null;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      setUploadContractModal(prev => ({
        ...prev,
        selectedFile: file,
        fileName: file.name,
        filePreview: preview,
      }));
    }
  };

  // Xử lý tải lên hợp đồng
  const handleUploadContract = async () => {
    if (!uploadContractModal.order || !uploadContractModal.selectedFile) {
      showToast({
        title: "Lỗi",
        description: "Vui lòng chọn file hợp đồng",
        type: "error",
      });
      return;
    }

    const orderId = uploadContractModal.order.orderId || uploadContractModal.order.OrderId || uploadContractModal.order.id;
    if (processingIds.has(orderId)) return;

    setProcessingIds(prev => new Set(prev).add(orderId));
    try {
      const formData = new FormData();
      formData.append('file', uploadContractModal.selectedFile);

      await apiRequest(`/api/Order/${orderId}/upload-contract`, {
        method: "POST",
        body: formData,
      });

      showToast({
        title: "Thành công",
        description: "Đã upload hợp đồng thành công",
        type: "success",
      });

      // Dọn dẹp URL bản xem trước
      if (uploadContractModal.filePreview) {
        URL.revokeObjectURL(uploadContractModal.filePreview);
      }

      setUploadContractModal({ 
        isOpen: false, 
        order: null, 
        selectedFile: null,
        fileName: "",
        filePreview: null,
      });
      
      // Đặt lại input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await loadStats();
    } catch (error) {
      console.error("Error uploading contract:", error);
      showToast({
        title: "Lỗi",
        description: error.message || "Không thể upload hợp đồng",
        type: "error",
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || "").toLowerCase();
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      deposited: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[statusLower] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const statusLower = (status || "").toLowerCase();
    const statusMap = {
      pending: "Đang chờ",
      deposited: "Đã đặt cọc",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
    };
    return statusMap[statusLower] || status;
  };
  // Hủy giao dịch
  // Xử lý đánh dấu giao dịch thất bại - Nhân viên có thể từ chối giao dịch
  const handleMarkTransactionFailed = async (failureReason = null) => {
    if (!failureReason) {
      return;
    }

    try {
      showToast({
        title: 'Đang xử lý...',
        description: 'Đang lưu lý do từ chối',
        type: 'info',
      });

      const orderId = transactionFailureModal.orderId;
      if (!orderId) {
        showToast({
          title: 'Lỗi',
          description: 'Không tìm thấy đơn hàng',
          type: 'error',
        });
        return;
      }

      // Xây dựng văn bản lý do từ chối từ Mã lý do + Ghi chú
      const reasonCode = failureReason.reasonCode || '';
      const reasonNote = failureReason.reasonNote || '';
      const refundOption = failureReason.refundOption || 'refund';
      const reasonOption = transactionFailureReasons.find(r => r.code === reasonCode);
      let cancellationReasonText = '';
      
      if (reasonOption && reasonCode !== 'OTHER') {
        cancellationReasonText = reasonOption.label;
        if (reasonNote.trim()) {
          cancellationReasonText += `: ${reasonNote.trim()}`;
        }
      } else if (reasonNote.trim()) {
        cancellationReasonText = reasonNote.trim();
      } else {
        cancellationReasonText = 'Không xác định';
      }

      // Thêm thông tin hoàn tiền vào lý do hủy
      if (refundOption === 'refund') {
        cancellationReasonText += '\n\nThông tin hoàn tiền: Đơn hàng này sẽ được hoàn tiền.';
      } else {
        cancellationReasonText += '\n\nThông tin hoàn tiền: Đơn hàng này không được hoàn tiền theo điều khoản hủy giao dịch.';
      }
     
      // Gọi API để lưu lý do hủy vào Đơn hàng
      // Lưu ý: Endpoint này có thể chỉ cho phép admin. Nếu staff nhận 403, cần cập nhật backend
      try {
        
        // Sử dụng endpoint staff-reject (cho phép cả Nhân viên và Quản trị viên)
        const response = await apiRequest(`/api/Order/${orderId}/staff-reject`, {
          method: 'POST',
          body: {
            Reason: cancellationReasonText,
            RefundOption: refundOption
          }
        });
        
        console.log('✅ Staff rejection successful:', {
          orderId: response.orderId,
          status: response.status,
          reason: cancellationReasonText,
          refundOption: refundOption,
          refundAmount: response.refundAmount
        });
        
        // Gửi thông báo cho người mua
        try {
          // Lấy chi tiết đơn hàng để tìm ID người mua
          const orderDetails = await apiRequest(`/api/Order/details/${orderId}`);
          const buyerId = orderDetails.userId || orderDetails.UserId || response.buyerId;
          
          if (buyerId) {
            const order = orders.find(o => (o.orderId || o.OrderId || o.id) == orderId);
            const refundMessage = refundOption === 'refund' 
              ? `Số tiền cọc ${formatPrice(response.refundAmount || order?.depositAmount || order?.totalAmount || 0)} sẽ được hoàn lại vào tài khoản của người mua trong vòng 3-5 ngày làm việc.`
              : 'Số tiền cọc sẽ không được hoàn lại do điều khoản hủy giao dịch.';
            
            await apiRequest('/api/Notification', {
              method: 'POST',
              body: {
                UserId: buyerId,
                Title: 'Giao dịch đã bị hủy',
                Message: `Giao dịch của bạn đã bị staff hủy. Lý do: ${cancellationReasonText}. ${refundMessage}`,
                Type: 'error',
                IsRead: false
              }
            });
            console.log('✅ Notification sent to buyer:', buyerId);
          }
        } catch (notifError) {
          console.warn('⚠️ Could not send notification to buyer:', notifError);
        }

        showToast({
          title: 'Thành công!',
          description: 'Đã hủy giao dịch và cập nhật trạng thái sản phẩm.',
          type: 'success',
        });

        // Đóng modal
        setTransactionFailureModal({
          isOpen: false,
          product: null,
          orderId: null,
          reasonCode: '',
          reasonNote: '',
          refundOption: 'refund',
        });

        // Tải lại dữ liệu
        await loadStats();
      } catch (orderError) {
        console.error('❌ Could not update order:', orderError);
        
        // Kiểm tra lỗi 403 Forbidden (endpoint chỉ cho phép admin)
        const errorMessage = orderError.message || '';
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('từ chối truy cập')) {
          showToast({
            title: 'Lỗi',
            description: 'Vì đơn hàng đang trong quá trình "đang xử lí", chỉ có Admin mới có quyền thao tác với đơn hàng.',
            type: 'error',
          });
          
          console.error('🔧 BACKEND FIX NEEDED:');
          console.error('1. Create new endpoint: POST /api/Order/{id}/staff-reject');
          console.error('2. Or update admin-reject endpoint to allow Staff role');
          console.error('3. Staff should be able to reject orders with status: Pending, Deposited');
        } else {
          showToast({
            title: 'Lỗi',
            description: 'Vì đơn hàng đang trong quá trình "đang xử lí", chỉ có Admin mới có quyền thao tác với đơn hàng.',
            type: 'error',
          });
        }
      }
    } catch (error) {
      console.error('❌ Error marking transaction as failed:', error);
      showToast({
        title: 'Lỗi',
        description: `Không thể lưu lý do từ chối: ${error.message || 'Vui lòng thử lại.'}`,
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-10 border-r border-gray-200">
        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleTabChange("dashboard")}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">EV Market</h1>
              <p className="text-sm text-green-600 font-medium leading-tight">Cổng nhân viên</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">
                {(user?.fullName || user?.full_name || "S")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {user?.fullName || user?.full_name || "Nhân viên"}
              </h3>
              <p className="text-sm text-gray-500">Nhân viên hệ thống</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <div className="space-y-2">
            <div 
              className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all ${
                activeTab === "transactions" 
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg" 
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handleTabChange("transactions")}
            >
              <ShoppingCart className={`h-5 w-5 ${activeTab === "transactions" ? "text-white" : "text-gray-500"}`} />
              <span className="font-medium">Quản lý giao dịch</span>
            </div>
          </div>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="w-full flex items-center space-x-3 p-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {activeTab === "transactions" && "Quản lý giao dịch"}
              </h1>
              <p className="text-gray-600 text-lg">
                {activeTab === "transactions" && "Upload và quản lý hợp đồng giao dịch"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {activeTab === "transactions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Tổng đơn hàng</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Đơn chờ xử lý</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                </div>
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-7 w-7 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Completed Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Đơn hoàn tất</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </div>

            {/* Cancelled Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Đơn hủy</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders || 0}</p>
                </div>
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đơn hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                    </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Đang chờ</option>
                  <option value="deposited">Đã đặt cọc</option>
                  <option value="completed">Hoàn tất</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
                </div>
                    </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mã đơn</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Người mua</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sản phẩm</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tiền đặt cọc</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tiền còn lại</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hợp đồng</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      // Pagination logic
                      const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
                      
                      if (paginatedOrders.length === 0) {
                        return (
                          <tr>
                            <td colSpan="9" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <Package className="h-12 w-12 text-gray-400 mb-3" />
                                <p className="text-gray-500 font-medium">Không có đơn hàng nào</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      
                      return paginatedOrders.map((order) => {
                        const status = (order.status || order.Status || order.orderStatus || order.OrderStatus || "").toLowerCase();
                        const orderId = order.orderId || order.OrderId || order.id || order.Id;
                        const hasContract = order.contractUrl || order.ContractUrl;
                        // Check if order is cancelled (by status or by having cancellation reason)
                        const isCancelled = status === 'cancelled' || 
                                          status === 'canceled' || 
                                          !!(order.adminNotes || order.AdminNotes || order.cancellationReason || order.CancellationReason);
                        
                        // Calculate deposit and remaining amounts
                        const totalAmount = parseFloat(order.totalAmount || order.TotalAmount || 0);
                        const depositAmount = parseFloat(order.depositAmount || order.DepositAmount || 0);
                        const remainingAmount = totalAmount - depositAmount;
                        
                        return (
                          <tr key={orderId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">#{orderId}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.buyerName || order.BuyerName || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.enrichedProductName || order.productName || order.ProductName || 
                               (order.product?.title || order.product?.Title) || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatPrice(depositAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatPrice(remainingAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(status)}`}>
                                {getStatusText(status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {hasContract ? (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center space-x-1 w-fit">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Đã gửi</span>
                                </span>
                              ) : (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-1 w-fit">
                                  <Clock className="h-3 w-3" />
                                  <span>Chưa gửi</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(order.createdDate || order.CreatedDate || order.createdAt || order.CreatedAt || order.orderDate || order.OrderDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex flex-col space-y-2">
                                {/* View Order Details Button */}
                                <button
                                  onClick={async () => {
                                    setOrderDetailModal({ isOpen: true, order, orderDetails: null, loading: true });
                                    try {
                                      // Check user role from context and token
                                      const currentUser = user;
                                      const userRoleId = currentUser?.roleId || currentUser?.role;
                                      
                                      // Also decode token to check roleId in JWT
                                      const token = tokenManager.getToken();
                                      let tokenRoleId = null;
                                      if (token) {
                                        const payload = tokenManager.safeParseJwt(token);
                                        tokenRoleId = payload?.roleId || payload?.RoleId;
                                        console.log("🔍 [ORDER DETAILS] Token payload:", {
                                          userId: payload?.nameid || payload?.NameIdentifier,
                                          roleId: tokenRoleId,
                                          role: payload?.role || payload?.Role,
                                          allClaims: payload
                                        });
                                      }
                                      
                                      console.log("🔍 [ORDER DETAILS] User role check:", {
                                        userId: currentUser?.id || currentUser?.userId,
                                        contextRoleId: userRoleId,
                                        tokenRoleId: tokenRoleId,
                                        isStaff: userRoleId === 3 || userRoleId === "3" || tokenRoleId === 3 || tokenRoleId === "3",
                                        isAdmin: userRoleId === 1 || userRoleId === "1" || tokenRoleId === 1 || tokenRoleId === "1"
                                      });

                                      const details = await apiRequest(`/api/Order/details/${orderId}`);
                                      setOrderDetailModal({ isOpen: true, order, orderDetails: details, loading: false });
                                    } catch (error) {
                                      console.error("❌ [ORDER DETAILS] Error loading order details:", error);
                                      
                                      // Decode token to show role information in error
                                      const token = tokenManager.getToken();
                                      let tokenRoleId = null;
                                      if (token) {
                                        const payload = tokenManager.safeParseJwt(token);
                                        tokenRoleId = payload?.roleId || payload?.RoleId;
                                      }
                                      
                                      console.error("❌ [ORDER DETAILS] Error details:", {
                                        message: error.message,
                                        status: error.status,
                                        data: error.data,
                                        orderId: orderId,
                                        contextRoleId: user?.roleId || user?.role,
                                        tokenRoleId: tokenRoleId,
                                        expectedRole: "Staff (RoleId = 3) or Admin (RoleId = 1)"
                                      });
                                      
                                      let errorMessage = "Không thể tải chi tiết đơn hàng";
                                      if (error.status === 403) {
                                        const roleInfo = tokenRoleId 
                                          ? `RoleId trong token: ${tokenRoleId}. Backend yêu cầu RoleId = 3 (Staff) hoặc RoleId = 1 (Admin).`
                                          : "Vui lòng kiểm tra lại quyền truy cập của tài khoản staff trong database.";
                                        errorMessage = `Bạn không có quyền xem chi tiết đơn hàng này. ${roleInfo}`;
                                      } else if (error.status === 401) {
                                        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
                                      } else if (error.status === 404) {
                                        errorMessage = "Không tìm thấy đơn hàng này.";
                                      } else if (error.message) {
                                        errorMessage = error.message;
                                      }
                                      
                                      showToast({
                                        title: "Lỗi",
                                        description: errorMessage,
                                        type: "error",
                                      });
                                      setOrderDetailModal({ isOpen: false, order: null, orderDetails: null, loading: false });
                                    }
                                  }}
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Xem chi tiết</span>
                                </button>

                                {/* Hide upload/update button when order is completed */}
                                {status !== 'completed' && (
                                  <button
                                    onClick={() => setUploadContractModal({ 
                                      isOpen: true, 
                                      order, 
                                      selectedFile: null,
                                      fileName: "",
                                      filePreview: null,
                                    })}
                                    disabled={processingIds.has(orderId) || isCancelled}
                                    className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg ${
                                      isCancelled
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                                    } ${processingIds.has(orderId) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    title={isCancelled ? "Không thể upload hợp đồng vì đơn hàng đã bị hủy" : (hasContract ? "Cập nhật hợp đồng" : "Upload hợp đồng")}
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span>{hasContract ? "Cập nhật" : "Upload"}</span>
                                  </button>
                                )}
                                
                                {/* Staff can reject transactions that are not completed or cancelled */}
                                {status !== 'completed' && status !== 'cancelled' && !isCancelled && (
                                  <button
                                    onClick={() => {
                                      console.log('🔍 [REJECT] Order object:', order);
                                      console.log('🔍 [REJECT] Order keys:', Object.keys(order));
                                      console.log('🔍 [REJECT] OrderId extracted:', orderId);
                                      console.log('🔍 [REJECT] All possible IDs:', {
                                        orderId: order.orderId,
                                        OrderId: order.OrderId,
                                        id: order.id,
                                        Id: order.Id,
                                        order_id: order.order_id,
                                        ORDER_ID: order.ORDER_ID
                                      });
                                      
                                      if (!orderId || orderId === 0) {
                                        showToast({
                                          title: 'Lỗi',
                                          description: `Không tìm thấy ID đơn hàng. Order keys: ${Object.keys(order).join(', ')}`,
                                          type: 'error',
                                        });
                                        return;
                                      }
                                      
                                      const productId = order.productId || order.ProductId;
                                      setTransactionFailureModal({
                                        isOpen: true,
                                        product: {
                                          id: productId,
                                          productId: productId,
                                          title: order.enrichedProductName || order.productName || order.ProductName || "N/A"
                                        },
                                        orderId: orderId,
                                        reasonCode: '',
                                        reasonNote: '',
                                        refundOption: 'refund'
                                      });
                                    }}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span>Từ chối</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {filteredOrders.length > 0 && (() => {
                const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
                
                if (totalPages <= 1) return null;
                
                return (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}</span> đến{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> trong tổng số{' '}
                      <span className="font-medium">{filteredOrders.length}</span> đơn hàng
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Trước
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === page
                                    ? 'bg-green-600 text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return <span key={page} className="px-2 text-gray-500">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Upload Contract Modal */}
      {uploadContractModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Upload hợp đồng</h3>
                  <p className="text-sm text-gray-600">Đơn hàng #{uploadContractModal.order?.orderId || uploadContractModal.order?.OrderId || uploadContractModal.order?.id}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (uploadContractModal.filePreview) {
                    URL.revokeObjectURL(uploadContractModal.filePreview);
                  }
                  setUploadContractModal({ 
                    isOpen: false, 
                    order: null, 
                    selectedFile: null,
                    fileName: "",
                    filePreview: null,
                  });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Chọn file hợp đồng
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
                >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploadContractModal.selectedFile ? (
                    <div className="space-y-4">
                      {uploadContractModal.filePreview ? (
                        <div className="flex justify-center">
                          <img
                            src={uploadContractModal.filePreview}
                            alt="Preview"
                            className="max-h-48 rounded-lg shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <File className="h-16 w-16 text-green-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 flex items-center justify-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{uploadContractModal.fileName}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(uploadContractModal.selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (uploadContractModal.filePreview) {
                            URL.revokeObjectURL(uploadContractModal.filePreview);
                          }
                          setUploadContractModal(prev => ({
                            ...prev,
                            selectedFile: null,
                            fileName: "",
                            filePreview: null,
                          }));
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Xóa file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Nhấp để chọn file hoặc kéo thả file vào đây
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Hỗ trợ: Hình ảnh, PDF, DOC, DOCX (Tối đa 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Thông tin đơn hàng</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Người mua:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {uploadContractModal.order?.buyerName || uploadContractModal.order?.BuyerName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sản phẩm:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {uploadContractModal.order?.enrichedProductName || 
                       uploadContractModal.order?.productName || 
                       uploadContractModal.order?.ProductName || 
                       (uploadContractModal.order?.product?.title || uploadContractModal.order?.product?.Title) || 
                       "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatPrice(uploadContractModal.order?.totalAmount || uploadContractModal.order?.TotalAmount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge((uploadContractModal.order?.status || uploadContractModal.order?.Status || "").toLowerCase())}`}>
                      {getStatusText((uploadContractModal.order?.status || uploadContractModal.order?.Status || "").toLowerCase())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (uploadContractModal.filePreview) {
                      URL.revokeObjectURL(uploadContractModal.filePreview);
                    }
                    setUploadContractModal({ 
                      isOpen: false, 
                      order: null, 
                      selectedFile: null,
                      fileName: "",
                      filePreview: null,
                    });
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadContract}
                  disabled={!uploadContractModal.selectedFile || processingIds.has(uploadContractModal.order?.orderId || uploadContractModal.order?.OrderId || uploadContractModal.order?.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  {processingIds.has(uploadContractModal.order?.orderId || uploadContractModal.order?.OrderId || uploadContractModal.order?.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Đang upload...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload hợp đồng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Failure Modal - Staff can reject transactions */}
      {transactionFailureModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Xác nhận hủy giao dịch</h3>
                  <p className="text-sm text-gray-600">Đơn hàng #{transactionFailureModal.orderId}</p>
                </div>
              </div>
              <button
                onClick={() => setTransactionFailureModal({ isOpen: false, product: null, orderId: null, reasonCode: '', reasonNote: '', refundOption: 'refund' })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Product Info */}
            {transactionFailureModal.product && (
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {transactionFailureModal.product.title || transactionFailureModal.product.name || "N/A"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      ID: {transactionFailureModal.product.id || transactionFailureModal.product.productId || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionFailureModal.reasonCode}
                  onChange={(e) => setTransactionFailureModal({
                    ...transactionFailureModal,
                    reasonCode: e.target.value,
                    reasonNote: e.target.value !== 'OTHER' ? transactionFailureModal.reasonNote : ''
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Chọn lý do --</option>
                  {transactionFailureReasons.map(reason => (
                    <option key={reason.code} value={reason.code}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {(transactionFailureModal.reasonCode === 'OTHER' || transactionFailureModal.reasonCode) && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {transactionFailureModal.reasonCode === 'OTHER' 
                      ? 'Mô tả chi tiết lý do' 
                      : 'Ghi chú bổ sung (tùy chọn)'}
                    {transactionFailureModal.reasonCode === 'OTHER' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={transactionFailureModal.reasonNote}
                    onChange={(e) => setTransactionFailureModal({
                      ...transactionFailureModal,
                      reasonNote: e.target.value
                    })}
                    placeholder={transactionFailureModal.reasonCode === 'OTHER' 
                      ? "Nhập lý do chi tiết tại sao giao dịch không thành công..."
                      : "Nhập ghi chú bổ sung (nếu có)..."}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={4}
                    required={transactionFailureModal.reasonCode === 'OTHER'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {transactionFailureModal.reasonCode === 'OTHER' 
                      ? 'Lý do này sẽ được hiển thị cho người mua và người bán'
                      : 'Ghi chú này sẽ được lưu lại để tham khảo'}
                  </p>
                </div>
              )}

              {/* Refund Option */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Xử lý hoàn tiền <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="refundOption"
                      value="refund"
                      checked={transactionFailureModal.refundOption === 'refund'}
                      onChange={(e) => setTransactionFailureModal({
                        ...transactionFailureModal,
                        refundOption: e.target.value
                      })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Hoàn tiền</div>
                      <div className="text-sm text-gray-600">Số tiền cọc sẽ được hoàn lại cho người mua</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="refundOption"
                      value="no_refund"
                      checked={transactionFailureModal.refundOption === 'no_refund'}
                      onChange={(e) => setTransactionFailureModal({
                        ...transactionFailureModal,
                        refundOption: e.target.value
                      })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Không hoàn tiền</div>
                      <div className="text-sm text-gray-600">Số tiền cọc sẽ không được hoàn lại</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setTransactionFailureModal({ isOpen: false, product: null, orderId: null, reasonCode: '', reasonNote: '', refundOption: 'refund' })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Validate
                    const reasonCode = transactionFailureModal.reasonCode;
                    const reasonNote = transactionFailureModal.reasonNote;
                    const refundOption = transactionFailureModal.refundOption;
                    
                    if (!reasonCode) {
                      showToast({
                        title: 'Lỗi',
                        description: 'Vui lòng chọn lý do',
                        type: 'error',
                      });
                      return;
                    }
                    
                    if (reasonCode === 'OTHER' && !reasonNote.trim()) {
                      showToast({
                        title: 'Lỗi',
                        description: 'Vui lòng nhập mô tả chi tiết lý do',
                        type: 'error',
                      });
                      return;
                    }

                    if (!refundOption) {
                      showToast({
                        title: 'Lỗi',
                        description: 'Vui lòng chọn phương án xử lý hoàn tiền',
                        type: 'error',
                      });
                      return;
                    }

                    // Proceed with failure
                    await handleMarkTransactionFailed({
                      reasonCode: reasonCode,
                      reasonNote: reasonNote,
                      refundOption: refundOption
                    });
                  }}
                  disabled={!transactionFailureModal.reasonCode || (transactionFailureModal.reasonCode === 'OTHER' && !transactionFailureModal.reasonNote.trim()) || !transactionFailureModal.refundOption}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Xác nhận hủy giao dịch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {orderDetailModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h3>
                  <p className="text-sm text-gray-600">
                    Đơn hàng #{orderDetailModal.order?.orderId || orderDetailModal.order?.OrderId || orderDetailModal.order?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderDetailModal({ isOpen: false, order: null, orderDetails: null, loading: false })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {orderDetailModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : orderDetailModal.orderDetails ? (
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Thông tin đơn hàng</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mã đơn:</span>
                          <span className="font-medium">#{orderDetailModal.orderDetails.orderId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trạng thái:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                            (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'deposited' ? 'bg-purple-100 text-purple-800' :
                            (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getOrderStatusText(orderDetailModal.orderDetails.orderStatus)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tiền cọc:</span>
                          <span className="font-medium">{formatPrice(orderDetailModal.orderDetails.depositAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tổng tiền:</span>
                          <span className="font-medium text-green-600">{formatPrice(orderDetailModal.orderDetails.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ngày tạo:</span>
                          <span className="font-medium">{formatDateTime(orderDetailModal.orderDetails.createdAt || orderDetailModal.orderDetails.CreatedAt || orderDetailModal.orderDetails.createdDate || orderDetailModal.orderDetails.CreatedDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Thông tin người mua</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tên:</span>
                          <span className="font-medium">{orderDetailModal.orderDetails.buyerName || 'Chưa có'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{orderDetailModal.orderDetails.buyerEmail || 'Chưa có'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số điện thoại:</span>
                          <span className="font-medium">{orderDetailModal.orderDetails.buyerPhone || 'Chưa có'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Thông tin người bán</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 block mb-1">Tên:</span>
                        <span className="font-medium">{orderDetailModal.orderDetails.sellerName || 'Chưa có'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Email:</span>
                        <span className="font-medium">{orderDetailModal.orderDetails.sellerEmail || 'Chưa có'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Số điện thoại:</span>
                        <span className="font-medium">{orderDetailModal.orderDetails.sellerPhone || 'Chưa có'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Thông tin sản phẩm</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tên sản phẩm:</span>
                        <span className="font-medium">{orderDetailModal.orderDetails.productTitle}</span>
                      </div>
                      {orderDetailModal.orderDetails.productImages && orderDetailModal.orderDetails.productImages.length > 0 && (
                        <div className="mt-3">
                          <img
                            src={orderDetailModal.orderDetails.productImages[0]}
                            alt={orderDetailModal.orderDetails.productTitle}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contract */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Hợp đồng</h4>
                    {orderDetailModal.orderDetails.contractUrl ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">Hợp đồng đã được staff gửi lên</span>
                        </div>
                        <a
                          href={orderDetailModal.orderDetails.contractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                        >
                          Xem hợp đồng
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-yellow-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="text-sm">Chưa có hợp đồng. Vui lòng upload hợp đồng.</span>
                      </div>
                    )}
                  </div>

                  {/* Cancellation Info (if cancelled) */}
                  {(orderDetailModal.orderDetails.cancellationReason || orderDetailModal.orderDetails.CancellationReason || orderDetailModal.orderDetails.adminNotes || orderDetailModal.orderDetails.AdminNotes) && (() => {
                    // ✅ Clean cancellationReason: Remove emoji icons only
                    let cleanReason = orderDetailModal.orderDetails.cancellationReason || 
                                     orderDetailModal.orderDetails.CancellationReason || 
                                     orderDetailModal.orderDetails.adminNotes || 
                                     orderDetailModal.orderDetails.AdminNotes || '';
                    
                    cleanReason = cleanReason.replace(/[✅⚠️]/g, '').trim();
                    
                    return (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-3">Lý do hủy giao dịch</h4>
                        <div className="text-sm text-red-800 whitespace-pre-line">
                          {cleanReason}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500">Không thể tải chi tiết đơn hàng</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
