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
import { formatPrice, formatDate, formatDateTime } from "../utils/formatters";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";

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
  
  const [uploadContractModal, setUploadContractModal] = useState({
    isOpen: false,
    order: null,
    selectedFile: null,
    fileName: "",
    filePreview: null,
  });

  // Persist selected tab
  useEffect(() => {
    try {
      sessionStorage.setItem('staff_active_tab', activeTab);
    } catch (_) {}
  }, [activeTab]);

  // Load dashboard stats
  const loadStats = async () => {
    try {
      // Load orders
      const ordersData = await apiRequest("/api/Order");
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      
      // Load products
      const productsData = await apiRequest("/api/Product");
      const productsArray = Array.isArray(productsData) ? productsData : [];
      
      // Load users
      const usersData = await apiRequest("/api/User");
      const usersArray = Array.isArray(usersData) ? usersData : [];

      // Calculate stats
      const totalOrders = ordersArray.length;
      const pendingOrders = ordersArray.filter(o => 
        (o.status || o.Status || "").toLowerCase() === "pending"
      ).length;
      const completedOrders = ordersArray.filter(o => 
        (o.status || o.Status || "").toLowerCase() === "completed"
      ).length;
      const activeOrders = ordersArray.filter(o => {
        const status = (o.status || o.Status || "").toLowerCase();
        return status === "pending" || status === "processing" || status === "confirmed";
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
        totalRevenue,
        todaysRevenue,
        thisMonthRevenue,
        pendingListings,
        approvedListings,
        totalUsers,
        activeUsers,
      });

      // Enrich orders with product information
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
        
        // Also try to get from order.product object if available
        if (!productName && order.product) {
          productName = order.product.title || order.product.Title || "N/A";
        }
        
        return {
          ...order,
          productName: productName || "N/A",
          enrichedProductName: productName || "N/A"
        };
      });

      // Sort orders by creation date (newest first)
      const sortedOrders = enrichedOrders.sort((a, b) => {
        const dateA = new Date(a.createdDate || a.CreatedDate || a.createdAt || a.CreatedAt || a.orderDate || a.OrderDate || 0);
        const dateB = new Date(b.createdDate || b.CreatedDate || b.createdAt || b.CreatedAt || b.orderDate || b.OrderDate || 0);
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
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

  // Load data based on active tab
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

  // Filter orders
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
  }, [orders, orderStatusFilter, searchTerm]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setOrderStatusFilter("all");
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          title: "Lỗi",
          description: "File không được vượt quá 10MB",
          type: "error",
        });
        return;
      }

      // Create preview for images
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

  // Handle contract upload
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

      // Clean up preview URL
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
      
      // Reset file input
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
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      processing: "bg-blue-100 text-blue-800",
      confirmed: "bg-blue-100 text-blue-800",
      depositpaid: "bg-purple-100 text-purple-800",
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
    };
    return badges[statusLower] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const statusLower = (status || "").toLowerCase();
    const statusMap = {
      pending: "Đang chờ",
      approved: "Đã duyệt",
      rejected: "Đã từ chối",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
      processing: "Đang xử lý",
      confirmed: "Đã xác nhận",
      depositpaid: "Đã thanh toán cọc",
      active: "Hoạt động",
      suspended: "Tạm khóa",
    };
    return statusMap[statusLower] || status;
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

            {/* Total Revenue */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-purple-600" />
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
                  <option value="processing">Đang xử lý</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="depositpaid">Đã thanh toán cọc</option>
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tổng tiền</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hợp đồng</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Package className="h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-gray-500 font-medium">Không có đơn hàng nào</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const status = (order.status || order.Status || order.orderStatus || order.OrderStatus || "").toLowerCase();
                        const orderId = order.orderId || order.OrderId || order.id || order.Id;
                        const hasContract = order.contractUrl || order.ContractUrl;
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
                              {formatPrice(order.totalAmount || order.TotalAmount || 0)}
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
                  <button
                                onClick={() => setUploadContractModal({ 
                                  isOpen: true, 
                                  order, 
                                  selectedFile: null,
                                  fileName: "",
                                  filePreview: null,
                                })}
                                disabled={processingIds.has(orderId)}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
                              >
                                <Upload className="h-4 w-4" />
                                <span>{hasContract ? "Cập nhật" : "Upload"}</span>
                  </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
};
