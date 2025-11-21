import { useState, useEffect } from "react";
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
  MoreVertical,
  AlertCircle,
  Calendar,
  MapPin,
  Car,
  Shield,
  BarChart3,
  Activity,
  Camera,
  Bell,
  Flag,
  LogOut,
  X,
  AlertTriangle,
  Settings,
  CreditCard,
  FileText,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate, formatDateTime, getOrderStatusText } from "../utils/formatters";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { notifyPostApproved, notifyPostRejected } from "../lib/notificationApi";
import { rejectProduct, approveProduct } from "../lib/productApi";
import { RejectProductModal } from "../components/admin/RejectProductModal";
import { AdminReports } from "../components/admin/AdminReports";
import { updateVerificationStatus, getVerificationRequests } from "../lib/verificationApi";
import { getUserNotifications, getUnreadCount, notifyUserVerificationCompleted } from "../lib/notificationApi";
import { forceSendNotificationsForAllSuccessfulPayments, sendNotificationsForKnownPayments, sendNotificationsForVerifiedProducts } from "../lib/verificationNotificationService";
import { feeService } from "../services/feeService";

export const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return sessionStorage.getItem('admin_active_tab') || "dashboard";
    } catch (_) {
      return "dashboard";
    }
  }); // dashboard, vehicles, batteries, inspections, transactions, reports, users, fees
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalRevenue: 0,
    depositRevenue: 0,
    verificationRevenue: 0,
    cancelledNoRefundRevenue: 0,
    vehicleListings: 0,
    batteryListings: 0,
    activeListings: 0,
    // EV Market specific stats
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    todaysRevenue: 0,
    thisYearRevenue: 0,
    thisMonthRevenue: 0,
    averageOrderValue: 0,
    completionRate: 0,
    totalVehicles: 0,
    totalBatteries: 0,
    soldVehicles: 0,
    soldBatteries: 0,
  });
  
  const [cancelledNoRefundOrders, setCancelledNoRefundOrders] = useState([]);

  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [orders, setOrders] = useState([]); // Store all orders for transaction management
  const [filteredOrders, setFilteredOrders] = useState([]); // Filtered orders for transaction management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all"); // Filter for transaction status: all, pending, completed, rejected
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [expandedDetailsDuplicateWarning, setExpandedDetailsDuplicateWarning] = useState({
    hasDuplicate: false,
    duplicates: []
  });
  const [cancelledOrderContext, setCancelledOrderContext] = useState(null); // Track cancelled order for modal context
  const [processingIds, setProcessingIds] = useState(new Set());
  const [skipImageLoading, setSkipImageLoading] = useState(false); // Add flag to skip image loading if causing issues
  const [orderDetailModal, setOrderDetailModal] = useState({
    isOpen: false,
    order: null,
    orderDetails: null,
    loading: false,
  });
  // Users management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState(""); // '', 'admin', 'user'
  const [usersStatus, setUsersStatus] = useState(""); // '', 'active', 'suspended', 'deleted'
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatusUserId, setPendingStatusUserId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('active');
  const [pendingStatusReason, setPendingStatusReason] = useState(''); // legacy free-text
  const [pendingStatusReasonCode, setPendingStatusReasonCode] = useState('');
  const [pendingStatusReasonNote, setPendingStatusReasonNote] = useState('');

  // Reason detail modal state
  const [showReasonDetailModal, setShowReasonDetailModal] = useState(false);
  const [selectedUserForReason, setSelectedUserForReason] = useState(null);

  // User management sub-tabs state
  const [userSubTab, setUserSubTab] = useState('active'); // 'active' or 'restricted'

  // Fee management state
  const [feeSettings, setFeeSettings] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeFormData, setFeeFormData] = useState({ feeValue: '', isActive: true });

  const suspendedReasonOptions = [
    { code: 'SPAM_CONTENT', label: 'Đăng nội dung spam/quảng cáo' },
    { code: 'FRAUD_SUSPECT', label: 'Nghi ngờ gian lận/giả mạo' },
    { code: 'VIOLATE_POLICY', label: 'Vi phạm điều khoản sử dụng' },
    { code: 'ABUSE_HARASS', label: 'Quấy rối/Ngôn ngữ thù hằn' },
    { code: 'FAKE_INFO', label: 'Cung cấp thông tin sai lệch' },
    { code: 'MULTI_ACCOUNT', label: 'Nhiều tài khoản trái quy định' },
    { code: 'CHARGEBACK_RISK', label: 'Rủi ro thanh toán/chargeback' },
    { code: 'PENDING_VERIFICATION', label: 'Chờ xác minh danh tính' },
    { code: 'SECURITY_RISK', label: 'Rủi ro bảo mật' },
    { code: 'OTHER', label: 'Lý do khác' },
  ];

  const deletedReasonOptions = [
    { code: 'USER_REQUEST', label: 'Người dùng yêu cầu xóa' },
    { code: 'PERMANENT_VIOLATION', label: 'Vi phạm nghiêm trọng/đã tái phạm' },
    { code: 'LEGAL_COMPLIANCE', label: 'Theo yêu cầu pháp lý' },
    { code: 'INACTIVE_LONG', label: 'Không hoạt động quá lâu' },
    { code: 'FRAUD_CONFIRMED', label: 'Xác nhận gian lận' },
    { code: 'DATA_PURGE', label: 'Dọn dẹp dữ liệu' },
    { code: 'OTHER', label: 'Lý do khác' },
  ];

  const getReasonTextForUser = (user) => {
    if (!user) return '';

    const status = (user.status || user.Status || '').toString().toLowerCase();

    // Priority 1: AccountStatusReason/Reason from backend (most reliable)
    // Check explicitly for both camelCase and PascalCase, and handle empty string vs null
    const accountStatusReason = user.accountStatusReason ?? user.AccountStatusReason ?? user.reason ?? user.Reason;

    // Debug for restricted accounts
    if ((status === 'suspended' || status === 'deleted') && !accountStatusReason) {
      console.warn('⚠️ Restricted user missing reason:', {
        id: user.id || user.Id,
        email: user.email || user.Email,
        status: status,
        accountStatusReason: user.accountStatusReason,
        AccountStatusReason: user.AccountStatusReason,
        reason: user.reason,
        Reason: user.Reason,
        allKeys: Object.keys(user),
      });
    }

    if (accountStatusReason && typeof accountStatusReason === 'string' && accountStatusReason.trim()) {
      return accountStatusReason.trim();
    }

    // Priority 2: reasonNote (if user manually entered custom reason)
    const reasonNote = user.reasonNote ?? user.ReasonNote;
    if (reasonNote && typeof reasonNote === 'string' && reasonNote.trim()) {
      return reasonNote.trim();
    }

    // Priority 3: Map from reasonCode to label (if no custom text)
    const code = user.reasonCode ?? user.ReasonCode;
    if (code && status && (status === 'suspended' || status === 'deleted')) {
      const list = status === 'deleted' ? deletedReasonOptions : suspendedReasonOptions;
      const found = list.find(x => x.code === code);
      if (found && found.label) {
        return found.label;
      }
    }

    return '';
  };

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    product: null,
  });

  // Transaction failure modal state
  const [transactionFailureModal, setTransactionFailureModal] = useState({
    isOpen: false,
    product: null,
    reasonCode: '',
    reasonNote: '',
    refundOption: 'refund', // 'refund' or 'no_refund'
  });

  // Transaction failure reason options
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

  // Inspection state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [duplicateLicensePlateWarning, setDuplicateLicensePlateWarning] = useState({
    hasDuplicate: false,
    duplicates: []
  });

  // Inspection modal state
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionImages, setInspectionImages] = useState([]);
  const [inspectionFiles, setInspectionFiles] = useState([]);
  const [currentInspectionProduct, setCurrentInspectionProduct] = useState(null);

  // Reset to dashboard when arriving from admin logo click
  useEffect(() => {
    if (location?.state?.resetDashboard) {
      setActiveTab("dashboard");
      // Clear state to avoid repeated resets on future renders
      navigate('/admin', { replace: true, state: {} });
    }
  }, [location?.state, navigate]);

  // Persist selected tab so back navigation returns to the same tab
  useEffect(() => {
    try {
      sessionStorage.setItem('admin_active_tab', activeTab);
    } catch (_) { }
  }, [activeTab]);

  // Users API helpers
  const loadUsers = async (opts = {}) => {
    const { page = usersPage, pageSize = usersPageSize, search = usersSearch, role = usersRole, status = usersStatus } = opts;
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sort', 'createdAt:desc');
      const res = await apiRequest(`/api/admin/users?${params.toString()}`);
      const usersData = res.Items || res.items || [];

      // Debug: Log raw response first
      console.log('🔍 Raw API response sample:', usersData.length > 0 ? {
        firstUser: usersData[0],
        allKeys: Object.keys(usersData[0] || {}),
        // Check specifically for AccountStatusReason fields
        accountStatusReason: usersData[0].accountStatusReason,
        AccountStatusReason: usersData[0].AccountStatusReason,
        reason: usersData[0].reason,
        Reason: usersData[0].Reason,
        // Check ALL fields to see what backend actually returns
        allFields: Object.keys(usersData[0] || {}).reduce((acc, key) => {
          acc[key] = usersData[0][key];
          return acc;
        }, {}),
      } : 'No users');

      // Find restricted user in raw data to debug
      const restrictedRawUser = usersData.find(u => {
        const st = (u.status ?? u.Status ?? '').toString().toLowerCase();
        return st === 'suspended' || st === 'deleted';
      });
      if (restrictedRawUser) {
        console.log('🔍 Raw restricted user from API:', {
          id: restrictedRawUser.id ?? restrictedRawUser.Id,
          email: restrictedRawUser.email ?? restrictedRawUser.Email,
          status: restrictedRawUser.status ?? restrictedRawUser.Status,
          accountStatusReason: restrictedRawUser.accountStatusReason,
          AccountStatusReason: restrictedRawUser.AccountStatusReason,
          reason: restrictedRawUser.reason,
          Reason: restrictedRawUser.Reason,
          allKeys: Object.keys(restrictedRawUser),
          // Log ALL values to see what backend actually returns
          allValues: Object.keys(restrictedRawUser).reduce((acc, key) => {
            acc[key] = restrictedRawUser[key];
            return acc;
          }, {}),
        });
      }

      // Normalize field names to ensure consistent access (handle both camelCase and PascalCase)
      const normalizedUsers = usersData.map(user => {
        // Get raw values FIRST before any normalization
        // IMPORTANT: Backend might return empty string '' for reason, so we need to check that too
        // Check ALL possible field names case-insensitively
        const rawAccountStatusReason =
          (user.accountStatusReason && user.accountStatusReason !== '') ? user.accountStatusReason :
            (user.AccountStatusReason && user.AccountStatusReason !== '') ? user.AccountStatusReason :
              (user.reason && user.reason !== '') ? user.reason :
                (user.Reason && user.Reason !== '') ? user.Reason :
                  null;

        const rawReason =
          (user.reason && user.reason !== '') ? user.reason :
            (user.Reason && user.Reason !== '') ? user.Reason :
              rawAccountStatusReason;

        // Debug: Log what we found for restricted users
        const st = (user.status ?? user.Status ?? '').toString().toLowerCase();
        if (st === 'suspended' || st === 'deleted') {
          console.log('🔍 Debug AccountStatusReason search for restricted user:', {
            id: user.id ?? user.Id,
            accountStatusReason_camelCase: user.accountStatusReason,
            AccountStatusReason_PascalCase: user.AccountStatusReason,
            reason: user.reason,
            Reason: user.Reason,
            allKeys: Object.keys(user),
            foundValue: rawAccountStatusReason,
            // Check all fields that might contain the reason
            allFieldValues: Object.keys(user).reduce((acc, key) => {
              if (key.toLowerCase().includes('reason') || key.toLowerCase().includes('account')) {
                acc[key] = user[key];
              }
              return acc;
            }, {}),
          });
        }

        // Create normalized object WITHOUT spreading user first to avoid override issues
        const normalized = {
          // Normalize common fields
          id: user.id ?? user.Id,
          Id: user.Id ?? user.id,
          email: user.email ?? user.Email,
          Email: user.Email ?? user.email,
          fullName: user.fullName ?? user.FullName,
          FullName: user.FullName ?? user.fullName,
          status: user.status ?? user.Status,
          Status: user.Status ?? user.status,
          role: user.role ?? user.Role,
          Role: user.Role ?? user.role,
          createdAt: user.createdAt ?? user.CreatedAt,
          CreatedAt: user.CreatedAt ?? user.createdAt,
          // CRITICAL: Set AccountStatusReason fields - preserve the actual value
          accountStatusReason: rawAccountStatusReason,
          AccountStatusReason: rawAccountStatusReason,
          reason: rawReason,
          Reason: rawReason,
          // Preserve reasonCode and reasonNote
          reasonCode: user.reasonCode ?? user.ReasonCode ?? null,
          ReasonCode: user.ReasonCode ?? user.reasonCode ?? null,
          reasonNote: user.reasonNote ?? user.ReasonNote ?? null,
          ReasonNote: user.ReasonNote ?? user.reasonNote ?? null,
        };

        // Add any other fields from user that we haven't normalized yet
        Object.keys(user).forEach(key => {
          if (!normalized.hasOwnProperty(key) && !normalized.hasOwnProperty(key.charAt(0).toLowerCase() + key.slice(1))) {
            normalized[key] = user[key];
          }
        });

        return normalized;
      });

      // Debug: Log để kiểm tra AccountStatusReason có trong response không
      if (normalizedUsers.length > 0) {
        const restrictedUser = normalizedUsers.find(u => {
          const st = (u.status ?? u.Status ?? '').toString().toLowerCase();
          return st === 'suspended' || st === 'deleted';
        });
        if (restrictedUser) {
          console.log('🔍 Restricted user data from API:', {
            id: restrictedUser.id,
            email: restrictedUser.email,
            status: restrictedUser.status,
            accountStatusReason: restrictedUser.accountStatusReason,
            AccountStatusReason: restrictedUser.AccountStatusReason,
            reason: restrictedUser.reason,
            Reason: restrictedUser.Reason,
            rawUser: usersData.find(u => (u.id ?? u.Id) === restrictedUser.id),
            getReasonResult: getReasonTextForUser(restrictedUser),
          });
        }
        const sampleUser = normalizedUsers[0];
        console.log('🔍 Sample user data from API (normalized):', {
          id: sampleUser.id,
          email: sampleUser.email,
          status: sampleUser.status,
          role: sampleUser.role,  // ← Check role value
          Role: sampleUser.Role,  // ← Check Role value
          accountStatusReason: sampleUser.accountStatusReason,
          AccountStatusReason: sampleUser.AccountStatusReason,
          reason: sampleUser.reason,
          Reason: sampleUser.Reason,
          rawData: usersData[0], // Log raw data để debug
        });

        // ✨ NEW: Log all users with their roles to debug
        console.log('🔍 All users roles:', normalizedUsers.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          Role: u.Role,
          rawRole: usersData.find(raw => (raw.id ?? raw.Id) === u.id)?.role ?? usersData.find(raw => (raw.id ?? raw.Id) === u.id)?.Role
        })));
      }
      setUsers(normalizedUsers);
      const meta = res.Meta || res.meta || {};
      setUsersPage(meta.Page || meta.page || page);
      setUsersPageSize(meta.PageSize || meta.pageSize || pageSize);
      setUsersTotalPages(meta.TotalPages || meta.totalPages || 1);
    } catch (e) {
      console.error('Load users failed', e);
      showToast({ title: 'Lỗi', description: 'Không tải được danh sách người dùng', type: 'error' });
    } finally {
      setUsersLoading(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    // Optimistic update: update UI immediately
    const oldUsers = [...users];
    setUsers(prev => prev.map(u => {
      const id = u.id || u.Id;
      if (id === userId) {
        return { ...u, role: role, Role: role };
      }
      return u;
    }));

    try {
      await apiRequest(`/api/admin/users/${userId}/role`, { method: 'PUT', body: { role } });
      showToast({ title: 'Thành công', description: 'Đã cập nhật vai trò', type: 'success' });
      // No need to reload - optimistic update already done
    } catch (e) {
      console.error('Update role failed', e);
      // Rollback on error
      setUsers(oldUsers);
      showToast({ title: 'Lỗi', description: 'Không cập nhật được vai trò', type: 'error' });
    }
  };

  const updateUserStatus = async (userId, status) => {
    // ✅ SAFEGUARD: Check if user is Staff before changing status
    const targetUser = users.find(u => (u.id || u.Id) === userId);
    const userRole = (targetUser?.role || targetUser?.Role || '').toString().toLowerCase();

    if ((userRole === 'staff' || userRole === 'sub_admin' || userRole === 'subadmin') &&
      (status === 'suspended' || status === 'deleted')) {
      const confirmed = window.confirm(
        '⚠️ CẢNH BÁO: Bạn đang thay đổi trạng thái của tài khoản Nhân viên!\n\n' +
        `Tài khoản: ${targetUser?.email || targetUser?.Email}\n` +
        `Vai trò: Nhân viên\n` +
        `Hành động: ${status === 'suspended' ? 'Tạm khóa' : 'Xóa'}\n\n` +
        'Điều này có thể ảnh hưởng đến hoạt động quản trị hệ thống.\n' +
        'Bạn có chắc chắn muốn tiếp tục?'
      );

      if (!confirmed) {
        console.log('❌ Admin cancelled status change for Staff user');
        return; // Cancel the operation
      }

      console.log('✅ Admin confirmed status change for Staff user');
    }

    // Optimistic update: update UI immediately
    const reasonLabel = (() => {
      const list = status === 'deleted' ? deletedReasonOptions : suspendedReasonOptions;
      const found = list.find(x => x.code === pendingStatusReasonCode);
      return found ? found.label : '';
    })();

    // Build the reason text that will be sent to backend
    // CRITICAL: If status is suspended/deleted, we MUST have a reason
    // Priority: reasonNote (custom text) > reasonLabel (from code) > existing reason
    let reasonText = '';
    if (status === 'suspended' || status === 'deleted') {
      // For suspended/deleted, we need a reason - use note if provided, otherwise use label from code
      reasonText = pendingStatusReasonNote?.trim() || reasonLabel || '';
    } else {
      // For active status, clear reason (optional)
      reasonText = '';
    }

    const oldUsers = [...users];
    setUsers(prev => prev.map(u => {
      const id = u.id || u.Id;
      if (id === userId) {
        // For suspended/deleted, always use the new reason text
        // For active, clear the reason
        const finalReasonText = (status === 'suspended' || status === 'deleted')
          ? reasonText
          : '';

        return {
          ...u,
          status: status,
          Status: status,
          reasonCode: (status === 'suspended' || status === 'deleted') ? (pendingStatusReasonCode || u.reasonCode || u.ReasonCode) : null,
          reasonNote: (status === 'suspended' || status === 'deleted') ? (pendingStatusReasonNote || u.reasonNote || u.ReasonNote) : null,
          reason: finalReasonText,
          ReasonCode: (status === 'suspended' || status === 'deleted') ? (pendingStatusReasonCode || u.ReasonCode || u.reasonCode) : null,
          ReasonNote: (status === 'suspended' || status === 'deleted') ? (pendingStatusReasonNote || u.ReasonNote || u.reasonNote) : null,
          Reason: finalReasonText,
          // CRITICAL: Also update AccountStatusReason for consistency
          accountStatusReason: finalReasonText,
          AccountStatusReason: finalReasonText,
        };
      }
      return u;
    }));

    try {
      // CRITICAL: Always send reason text for suspended/deleted status
      const requestBody = {
        status,
      };

      if (status === 'suspended' || status === 'deleted') {
        // For suspended/deleted, always include reason fields
        if (pendingStatusReasonCode) {
          requestBody.reasonCode = pendingStatusReasonCode;
        }
        if (pendingStatusReasonNote?.trim()) {
          requestBody.reasonNote = pendingStatusReasonNote.trim();
        }
        // Always send reason text (either from note or label)
        if (reasonText) {
          requestBody.reason = reasonText;
        }
      } else {
        // For active status, clear reason fields
        requestBody.reason = '';
      }

      await apiRequest(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: requestBody
      });
      // Debug: Log successful update
      console.log('✅ Status updated successfully:', {
        userId,
        status,
        requestBody,
      });
      showToast({ title: 'Thành công', description: 'Đã cập nhật trạng thái', type: 'success' });
      // Reload users without status filter to get all users
      // This ensures both tabs have fresh data after status change
      // We temporarily clear status filter, load, then restore it
      const currentStatusFilter = usersStatus;
      await loadUsers({ status: '', page: 1 });
      // Note: We don't restore usersStatus here because loadUsers already handles it
    } catch (e) {
      console.error('Update status failed', e);
      // Rollback on error
      setUsers(oldUsers);
      showToast({ title: 'Lỗi', description: 'Không cập nhật được trạng thái', type: 'error' });
    }
  };

  // No inline modal for user detail; we open seller profile in a new tab instead

  useEffect(() => {
    if (activeTab === 'users') {
      // Load ALL users without status filter
      // Tabs will filter on frontend for better UX
      loadUsers({ page: 1, status: '' });
    }
  }, [activeTab]);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminUserId, setAdminUserId] = useState(null);
  const [autoNotificationsSent, setAutoNotificationsSent] = useState(false);

  const getId = (x) => x?.id || x?.productId || x?.Id || x?.listingId;

  // Get inspection requests (vehicles with verificationStatus = Requested or InProgress)
  const getInspectionRequests = () => {
    // Use refreshTrigger to force re-evaluation
    console.log('🔍 getInspectionRequests called with allListings:', allListings.length);
    console.log('DEBUG: getInspectionRequests - allListings content before filter:', allListings.map(l => ({ id: l.id, productType: l.productType, verificationStatus: l.verificationStatus })));

    const requests = allListings.filter(listing => {
      const isVehicle = listing.productType === "Vehicle";
      const isRequested = listing.verificationStatus === "Requested";
      const isInProgress = listing.verificationStatus === "InProgress";

      console.log('🔍 Filtering listing:', {
        id: listing.id,
        title: listing.title,
        productType: listing.productType,
        verificationStatus: listing.verificationStatus,
        isVehicle,
        isRequested,
        isInProgress,
        shouldInclude: isVehicle && (isRequested || isInProgress)
      });

      return isVehicle && (isRequested || isInProgress);
    });

    console.log('🔍 getInspectionRequests result:', {
      allListingsCount: allListings.length,
      refreshTrigger,
      requestsCount: requests.length,
      allListingsVerificationStatus: allListings.map(l => ({
        id: l.id,
        title: l.title,
        productType: l.productType,
        verificationStatus: l.verificationStatus
      })),
      requests: requests.map(r => ({ id: r.id, title: r.title, verificationStatus: r.verificationStatus }))
    });

    return requests;
  };


  // Add refresh function
  const refreshData = async () => {
    setLoading(true);
    // Clear cache to force fresh data load
    localStorage.removeItem('admin_cached_products');
    localStorage.removeItem('admin_cached_users');
    localStorage.removeItem('admin_cached_orders');
    localStorage.removeItem('admin_cached_processed_listings');
    localStorage.removeItem('admin_cached_timestamp');

    await loadAdminData();
  };

  // Load admin notifications
  const loadAdminNotifications = async () => {
    try {
      if (!adminUserId) return;

      console.log('🔔 Loading admin notifications for user:', adminUserId);
      const notificationData = await getUserNotifications(adminUserId);
      setNotifications(notificationData.notifications || []);

      // Get unread count
      const unreadCount = await getUnreadCount(adminUserId);
      setUnreadNotificationCount(unreadCount);

      console.log('🔔 Admin notifications loaded:', notificationData.notifications?.length || 0);
    } catch (error) {
      console.error('❌ Error loading admin notifications:', error);
    }
  };

  // Load fee settings
  const loadFeeSettings = async () => {
    try {
      setFeeLoading(true);
      const response = await apiRequest('/api/FeeSetting', {
        method: 'GET',
      });
      setFeeSettings(response || []);
      console.log('✅ Fee settings loaded:', response);
    } catch (error) {
      console.error('❌ Error loading fee settings:', error);
      showToast({
        title: 'Lỗi',
        description: 'Không thể tải cài đặt phí',
        type: 'error',
      });
    } finally {
      setFeeLoading(false);
    }
  };

  // Update fee setting
  const updateFeeSetting = async (feeId, feeData) => {
    try {
      setFeeLoading(true);
      const response = await apiRequest(`/api/FeeSetting/${feeId}`, {
        method: 'PUT',
        body: feeData,
      });

      // ✅ CRITICAL: Clear feeService cache so new values are used immediately
      feeService.clearCache();
      console.log('✅ FeeService cache cleared after update');

      // Refresh fee settings
      await loadFeeSettings();

      showToast({
        title: 'Thành công',
        description: 'Đã cập nhật cài đặt phí. Giá trị mới sẽ được áp dụng ngay lập tức.',
        type: 'success',
      });

      setEditingFee(null);
      setFeeFormData({ feeValue: '', isActive: true });

      return response;
    } catch (error) {
      console.error('❌ Error updating fee setting:', error);
      showToast({
        title: 'Lỗi',
        description: 'Không thể cập nhật cài đặt phí',
        type: 'error',
      });
      throw error;
    } finally {
      setFeeLoading(false);
    }
  };

  // Handle edit fee
  const handleEditFee = (fee) => {
    setEditingFee(fee);
    setFeeFormData({
      feeValue: fee.feeValue || fee.FeeValue || '',
      isActive: fee.isActive !== undefined ? fee.isActive : (fee.IsActive !== undefined ? fee.IsActive : true),
    });
  };

  // Handle save fee
  const handleSaveFee = async () => {
    if (!editingFee) return;

    const feeId = editingFee.feeId || editingFee.FeeId;
    const feeType = editingFee.feeType || editingFee.FeeType;

    if (!feeId || !feeType) {
      showToast({
        title: 'Lỗi',
        description: 'Thông tin phí không hợp lệ',
        type: 'error',
      });
      return;
    }

    const feeValue = parseFloat(feeFormData.feeValue);
    if (isNaN(feeValue) || feeValue < 0) {
      showToast({
        title: 'Lỗi',
        description: 'Giá trị phí phải là số không âm',
        type: 'error',
      });
      return;
    }

    await updateFeeSetting(feeId, {
      feeType: feeType,
      feeValue: feeValue,
      isActive: feeFormData.isActive,
    });
  };

  // Get admin user ID
  const getAdminUserId = async () => {
    try {
      const users = await apiRequest('/api/User');
      const adminUser = users.find(user =>
        user.role === 'admin' ||
        user.role === 'Admin' ||
        user.isAdmin === true ||
        user.email?.includes('admin') ||
        user.fullName?.includes('Admin')
      );

      if (adminUser) {
        const userId = adminUser.id || adminUser.userId || adminUser.accountId;
        setAdminUserId(userId);
        return userId;
      }

      // Fallback: use first user as admin
      if (users.length > 0) {
        const userId = users[0].id || users[0].userId || users[0].accountId;
        setAdminUserId(userId);
        return userId;
      }

      return null;
    } catch (error) {
      console.error('Error getting admin user ID:', error);
      return null;
    }
  };

  // Handle force sending notifications for successful payments
  const handleForceSendNotifications = async () => {
    if (!window.confirm('Bạn có chắc muốn gửi thông báo cho tất cả thanh toán kiểm định đã thành công?')) {
      return;
    }

    try {
      showToast({
        title: 'Đang xử lý...',
        description: 'Đang gửi thông báo cho các thanh toán kiểm định thành công',
        type: 'info',
      });

      // Try the known payments function first (more reliable)
      let notificationsSent = await sendNotificationsForKnownPayments();

      // If no notifications sent, try the full function
      if (notificationsSent === 0) {
        console.log('🔧 Trying full payment function...');
        notificationsSent = await forceSendNotificationsForAllSuccessfulPayments();
      }

      if (notificationsSent > 0) {
        showToast({
          title: 'Thành công!',
          description: `Đã gửi ${notificationsSent} thông báo cho admin`,
          type: 'success',
        });

        // Reload notifications
        await loadAdminNotifications();
      } else {
        showToast({
          title: 'Không có thông báo nào',
          description: 'Không tìm thấy thanh toán kiểm định thành công nào cần gửi thông báo',
          type: 'info',
        });
      }
    } catch (error) {
      console.error('Error force sending notifications:', error);
      showToast({
        title: 'Lỗi',
        description: 'Không thể gửi thông báo. Vui lòng thử lại.',
        type: 'error',
      });
    }
  };

  // Tạo review cho người mua sau khi admin xác nhận
  const createReviewForBuyer = async (productId) => {
    try {
      // Đợi một chút để database cập nhật sau khi admin confirm
      // Backend PaymentController đã update Order.OrderStatus = "Completed" và CompletedDate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Lấy thông tin order để tìm buyer
      const orders = await apiRequest("/api/Order");
      const ordersArray = Array.isArray(orders) ? orders : [];

      console.log(`🔍 Looking for completed order for productId: ${productId}`);
      console.log(`🔍 Total orders: ${ordersArray.length}`);

      // Tìm order đã hoàn thành với logic robust hơn
      const completedOrder = ordersArray.find(order => {
        // Check productId với nhiều field names khác nhau
        const orderProductId = order.ProductId || order.productId ||
          order.product?.ProductId || order.product?.productId ||
          order.product?.id;
        const productIdMatch = orderProductId == productId ||
          orderProductId === productId ||
          parseInt(orderProductId) === parseInt(productId);

        if (!productIdMatch) {
          return false;
        }

        // Check order status với nhiều field names khác nhau (case-insensitive)
        // QUAN TRỌNG: Backend PaymentController đã update Order.OrderStatus = "Completed" khi admin confirm
        const orderStatus = (order.Status || order.status ||
          order.orderStatus || order.OrderStatus || '').toLowerCase();
        const isCompleted = orderStatus === 'completed';

        // Check completed date (backend cũng set CompletedDate khi admin confirm)
        const hasCompletedDate = order.CompletedDate || order.completedDate;

        // Check product status (fallback - endpoint /api/Order có thể không trả về Product.Status)
        const productStatus = (order.Product?.Status || order.product?.status ||
          order.product?.Status || '').toLowerCase();
        const isProductSold = productStatus === 'sold' || productStatus === 'completed';

        // Order được coi là completed nếu:
        // 1. ProductId match
        // 2. VÀ (orderStatus === 'completed' HOẶC (isProductSold && hasCompletedDate))
        // Ưu tiên check Order.Status trước vì backend đã update khi admin confirm
        const matches = isCompleted || (isProductSold && hasCompletedDate);

        // Debug logging
        console.log(`🔍 Order ${order.OrderId || order.orderId || order.id}:`, {
          orderProductId,
          productId,
          productIdMatch,
          orderStatus,
          productStatus,
          isCompleted,
          isProductSold,
          hasCompletedDate,
          Status: order.Status,
          OrderStatus: order.OrderStatus,
          CompletedDate: order.CompletedDate,
          ProductId: order.ProductId,
          matches
        });

        return matches;
      });

      if (!completedOrder) {
        console.error('❌ No completed order found. Available orders:',
          ordersArray.map(o => ({
            OrderId: o.OrderId || o.orderId || o.id,
            ProductId: o.ProductId || o.productId,
            Status: o.Status || o.status || o.orderStatus || o.OrderStatus,
            CompletedDate: o.CompletedDate || o.completedDate,
            ProductStatus: o.Product?.Status || o.product?.status || o.product?.Status
          }))
        );
        throw new Error("Không tìm thấy order đã hoàn thành cho sản phẩm này");
      }

      console.log(`✅ Found completed order:`, {
        OrderId: completedOrder.OrderId || completedOrder.orderId || completedOrder.id,
        ProductId: completedOrder.ProductId || completedOrder.productId,
        BuyerId: completedOrder.BuyerId || completedOrder.buyerId,
        SellerId: completedOrder.SellerId || completedOrder.sellerId,
        Status: completedOrder.Status || completedOrder.status
      });

      // Tạo review cho buyer
      // Sử dụng field names từ backend (có thể là PascalCase hoặc camelCase)
      const reviewData = {
        orderId: completedOrder.OrderId || completedOrder.orderId || completedOrder.id,
        productId: productId,
        buyerId: completedOrder.BuyerId || completedOrder.buyerId ||
          completedOrder.userId || completedOrder.UserId,
        sellerId: completedOrder.SellerId || completedOrder.sellerId,
        ratingValue: 0, // Mặc định 0, buyer sẽ cập nhật sau
        comment: "", // Để trống, buyer sẽ điền sau
        isCompleted: false // Chưa hoàn thành đánh giá
      };

      // Gọi API tạo review
      await apiRequest("/api/Rating", {
        method: 'POST',
        body: reviewData
      });

      console.log(`✅ Review created for buyer ${reviewData.buyerId} on product ${productId}`);

    } catch (error) {
      console.error('Error creating review for buyer:', error);
      throw error;
    }
  };

  // Handle admin confirmation for reserved products
  const handleAdminConfirm = async (productId) => {
    if (!window.confirm('Bạn có chắc muốn xác nhận giao dịch này đã hoàn tất thành công?')) {
      return;
    }

    try {
      showToast({
        title: 'Đang xử lý...',
        description: 'Đang xác nhận giao dịch',
        type: 'info',
      });

      // Use the new Payment API admin-confirm endpoint
      await apiRequest(`/api/payment/admin-confirm`, {
        method: 'POST',
        body: {
          Request: {
            ProductId: productId
          }
        }
      });

      showToast({
        title: 'Thành công!',
        description: 'Đã xác nhận giao dịch thành công! Sản phẩm đã chuyển sang trạng thái "Đã bán".',
        type: 'success',
      });

      // Tự động tạo review cho người mua
      try {
        await createReviewForBuyer(productId);
        showToast({
          title: 'Review đã được tạo!',
          description: 'Người mua có thể đánh giá sản phẩm trong phần "Đánh giá của tôi".',
          type: 'success',
        });
      } catch (reviewError) {
        console.warn('Không thể tạo review:', reviewError);
        // Không hiển thị thông báo cảnh báo cho user
      }

      // Reload data to update UI
      await loadAdminData();
    } catch (error) {
      console.error('Error confirming transaction:', error);
      showToast({
        title: 'Lỗi',
        description: 'Không thể xác nhận giao dịch. Vui lòng thử lại.',
        type: 'error',
      });
    }
  };

  // Handle mark transaction as failed - Simple version: just save reason to CancellationReason
  const handleMarkTransactionFailed = async (productId, failureReason = null) => {
    // If reason is provided, proceed directly; otherwise open modal
    if (!failureReason) {
      const product = allListings.find(p => (p.id || p.productId) == productId);
      setTransactionFailureModal({
        isOpen: true,
        product: product,
        reasonCode: '',
        reasonNote: '',
        refundOption: 'refund',
      });
      return;
    }

    try {
      showToast({
        title: 'Đang xử lý...',
        description: 'Đang lưu lý do từ chối',
        type: 'info',
      });

      // Find the product to get its details
      const product = allListings.find(p => (p.id || p.productId) == productId);
      console.log('📦 Product:', product);

      // Find the order related to this product
      let orderId = null;
      try {
        const orders = await apiRequest("/api/Order");
        console.log('🔍 All orders:', orders);
        console.log('🔍 Looking for order with productId:', productId);

        // Find order that matches productId - check multiple status values
        const order = orders.find(o => {
          const orderProductId = o.productId || o.ProductId || o.product?.productId || o.product?.id;
          const orderStatus = (o.status || o.orderStatus || o.Status || o.OrderStatus || '').toLowerCase();

          console.log(`🔍 Checking order ${o.orderId}:`, {
            orderProductId,
            productId,
            match: orderProductId == productId,
            orderStatus
          });

          // Match productId and check if order is in a cancellable state
          return (orderProductId == productId || orderProductId === productId) &&
            (orderStatus === 'deposited' || orderStatus === 'pending' || orderStatus === 'reserved' ||
              orderStatus === 'depositpaid' || orderStatus === 'deposit_paid');
        });

        if (order) {
          orderId = order.orderId || order.OrderId || order.id;
          console.log('✅ Found order:', orderId, 'for product:', productId, 'Status:', order.status || order.orderStatus);
        } else {
          console.warn('⚠️ No order found for product:', productId, 'Available orders:', orders.map(o => ({
            orderId: o.orderId || o.OrderId,
            productId: o.productId || o.ProductId,
            status: o.status || o.orderStatus || o.Status || o.OrderStatus
          })));
        }
      } catch (error) {
        console.warn('⚠️ Could not find order:', error);
      }

      // Build failure reason text from ReasonCode + ReasonNote
      const reasonCode = failureReason.reasonCode || '';
      const reasonNote = failureReason.reasonNote || '';
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

      // Call API to save cancellation reason to Order using admin-reject endpoint
      if (orderId) {
        try {
          const refundOption = failureReason.refundOption || 'refund';

          // Use admin-reject endpoint
          const response = await apiRequest(`/api/Order/${orderId}/admin-reject`, {
            method: 'POST',
            body: {
              Reason: cancellationReasonText,
              RefundOption: refundOption
            }
          });
          console.log('✅ Cancellation reason saved to Order:', cancellationReasonText);
          console.log('✅ Refund option:', refundOption);
          console.log('✅ Admin-reject response:', response);

          // ✅ NOTE: Backend admin-reject endpoint already updates product status from "Reserved" → "Active"
          // No need to call PUT /api/Product/{id} separately as it requires all required fields (Brand, Title, ProductType)
          // Backend OrderController.AdminRejectOrder() handles product status update automatically
          console.log(`✅ [ADMIN REJECT] Backend has automatically updated product status to Active`);

          // Send notification to buyer
          try {
            const buyerId = response.buyerId || order?.userId;
            if (buyerId) {
              const refundMessage = refundOption === 'refund'
                ? `Số tiền cọc ${formatPrice(response.refundAmount || order?.depositAmount || 0)} sẽ được hoàn lại vào tài khoản của người mua trong vòng 3-5 ngày làm việc.`
                : 'Số tiền cọc sẽ không được hoàn lại do điều khoản hủy giao dịch.';

              await apiRequest('/api/Notification', {
                method: 'POST',
                body: {
                  UserId: buyerId,
                  Title: 'Giao dịch đã bị hủy',
                  Message: `Giao dịch của bạn đã bị admin hủy. Lý do: ${cancellationReasonText}. ${refundMessage}`,
                  Type: 'error',
                  IsRead: false
                }
              });
              console.log('✅ Notification sent to buyer:', buyerId);
            }
          } catch (notifError) {
            console.warn('⚠️ Could not send notification to buyer:', notifError);
          }
        } catch (orderError) {
          console.error('❌ Could not update order:', orderError);
          showToast({
            title: 'Lỗi',
            description: `Không thể lưu lý do từ chối: ${orderError.message || 'Vui lòng thử lại.'}`,
            type: 'error',
          });
          return;
        }
      } else {
        showToast({
          title: 'Cảnh báo',
          description: 'Không tìm thấy đơn hàng liên quan đến sản phẩm này.',
          type: 'warning',
        });
        return;
      }

      showToast({
        title: 'Thành công!',
        description: 'Đã hủy giao dịch và cập nhật trạng thái sản phẩm.',
        type: 'success',
      });

      // Clear cache to force fresh data reload
      try {
        localStorage.removeItem('admin_cached_processed_listings');
        localStorage.removeItem('admin_cached_users');
        localStorage.removeItem('admin_cached_products');
        localStorage.removeItem('admin_cached_timestamp');
        localStorage.removeItem('admin_cached_orders');
        console.log('✅ Cleared admin cache (including products cache)');
      } catch (cacheError) {
        console.warn('⚠️ Could not clear cache:', cacheError);
      }

      // Wait a bit for backend to finish updating product status
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload data to update UI
      await loadAdminData();

    } catch (error) {
      console.error('❌ Error marking transaction as failed:', error);
      showToast({
        title: 'Lỗi',
        description: `Không thể lưu lý do từ chối: ${error.message || 'Vui lòng thử lại.'}`,
        type: 'error',
      });
    }
  };

  // Check for duplicate license plate in expanded details modal
  const checkDuplicateLicensePlateForExpandedDetails = async (licensePlate, currentProductId) => {
    if (!licensePlate || licensePlate.trim() === '' || licensePlate === 'N/A') {
      setExpandedDetailsDuplicateWarning({ hasDuplicate: false, duplicates: [] });
      return;
    }

    try {
      // Get all products to check for duplicates
      const allProducts = await apiRequest('/api/Product');
      const productsList = Array.isArray(allProducts) ? allProducts : allProducts?.items || [];

      // Find products with same license plate (excluding current product)
      const duplicates = productsList.filter(p => {
        const productId = p.productId || p.id || p.ProductId || p.Id;
        const plate = (p.licensePlate || p.license_plate || '').trim().toUpperCase();
        const currentPlate = licensePlate.trim().toUpperCase();

        return plate === currentPlate &&
          plate !== '' &&
          plate !== 'N/A' &&
          productId !== currentProductId;
      });

      if (duplicates.length > 0) {
        setExpandedDetailsDuplicateWarning({ hasDuplicate: true, duplicates });
        console.log(`⚠️ Duplicate license plate found in expanded details: ${licensePlate}`, duplicates);
      } else {
        setExpandedDetailsDuplicateWarning({ hasDuplicate: false, duplicates: [] });
      }
    } catch (error) {
      console.error('Error checking duplicate license plate:', error);
      setExpandedDetailsDuplicateWarning({ hasDuplicate: false, duplicates: [] });
    }
  };

  // Handle view product details
  const handleViewDetails = async (product, cancelledOrder = null) => {
    // Use the same modal as Dashboard tab (expandedDetails)
    const productId = product.id || product.productId;
    setExpandedDetails(productId);
    setShowModal(false);
    // Track cancelled order context if viewing from cancelled orders
    setCancelledOrderContext(cancelledOrder);

    // Check for duplicate license plate if it's a vehicle
    if (product.productType?.toLowerCase().includes("vehicle")) {
      const licensePlate = product.licensePlate || product.license_plate || '';
      await checkDuplicateLicensePlateForExpandedDetails(licensePlate, productId);
    } else {
      setExpandedDetailsDuplicateWarning({ hasDuplicate: false, duplicates: [] });
    }
  };

  // Helper function to close modal and reset context
  const closeDetailsModal = () => {
    setExpandedDetails(false);
    setCancelledOrderContext(null);
  };

  // Filter orders based on transaction status filter
  useEffect(() => {
    if (orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];
    if (transactionStatusFilter !== "all") {
      filtered = filtered.filter(order => {
        const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || '').toLowerCase();
        if (transactionStatusFilter === "pending") {
          return status === 'pending' || status === 'processing' || status === 'depositpaid' ||
            status === 'deposited' || status === 'confirmed';
        } else if (transactionStatusFilter === "completed") {
          return status === 'completed';
        } else if (transactionStatusFilter === "rejected") {
          return status === 'cancelled' || status === 'failed' || status === 'canceled' || status === 'rejected';
        }
        return true;
      });
    }

    // Sort orders by creation date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdDate || a.CreatedDate || a.createdAt || a.CreatedAt || a.orderDate || a.OrderDate || 0);
      const dateB = new Date(b.createdDate || b.CreatedDate || b.createdAt || b.CreatedAt || b.orderDate || b.OrderDate || 0);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });

    setFilteredOrders(filtered);
  }, [orders, transactionStatusFilter]);

  useEffect(() => {
    console.log('🔍 AdminDashboard mounted, loading data...');
    const initializeAdmin = async () => {
      await loadAdminData();
      await getAdminUserId();
    };
    initializeAdmin();
  }, []);

  useEffect(() => {
    if (adminUserId) {
      loadAdminNotifications();

      // Auto-send notifications for successful verification payments (only once)
      if (!autoNotificationsSent) {
        const autoSendNotifications = async () => {
          try {
            console.log('🔔 Auto-checking for verification payments...');
            const notificationsSent = await sendNotificationsForKnownPayments();

            if (notificationsSent > 0) {
              console.log(`✅ Auto-sent ${notificationsSent} verification notifications`);
              setAutoNotificationsSent(true); // Mark as sent

              // Reload notifications to show the new ones
              await loadAdminNotifications();

              // Do not auto-open dropdown or show toast; icon bell already indicates updates
            }
          } catch (error) {
            console.error('❌ Error auto-sending notifications:', error);
          }
        };

        // Run auto-send after a short delay to ensure dashboard is loaded
        setTimeout(autoSendNotifications, 2000);
      }
    }
  }, [adminUserId]);

  // Load fee settings when fees tab is active
  useEffect(() => {
    if (activeTab === 'fees') {
      loadFeeSettings();
    }
  }, [activeTab]);

  useEffect(() => {
    filterListings();
  }, [allListings, searchTerm, statusFilter, productTypeFilter, dateFilter, activeTab]);

  // Helper function to handle tab change with scroll to top
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadAdminData = async () => {
    try {
      // Load each API separately to handle individual failures
      let users = [];
      let listings = [];
      let transactions = [];

      try {
        users = await apiRequest("/api/User");
        console.log("✅ Users loaded:", users);
      } catch (error) {
        console.warn("⚠️ Failed to load users:", error.message);
        // Try to get cached users data
        const cachedUsers = localStorage.getItem('admin_cached_users');
        if (cachedUsers) {
          try {
            users = JSON.parse(cachedUsers);
            console.log("📦 Using cached users:", users.length);
          } catch (e) {
            console.warn("Failed to parse cached users");
          }
        }
      }

      try {
        // Load all products from unified API (has productType field)
        const allProducts = await apiRequest("/api/Product");
        listings = Array.isArray(allProducts)
          ? allProducts
          : allProducts?.items || [];
        console.log("✅ Products loaded:", listings.length, listings.map(p => ({ id: p.id, verificationStatus: p.verificationStatus, productType: p.productType })));
        console.log("🔍 Products with Requested status:", listings.filter(p => p.verificationStatus === "Requested" || p.verificationStatus === "requested"));

        // Debug: Log first battery product to see all fields
        const firstBattery = listings.find(p => p.productType && p.productType.toLowerCase() !== 'vehicle' && p.productType.toLowerCase() !== 'xe điện');
        if (firstBattery) {
          console.log('🔍 First Battery Product from API (FULL DATA):', {
            id: firstBattery.id || firstBattery.productId,
            title: firstBattery.title,
            productType: firstBattery.productType,
            manufactureYear: firstBattery.manufactureYear,
            batteryType: firstBattery.batteryType,
            batteryHealth: firstBattery.batteryHealth,
            capacity: firstBattery.capacity,
            voltage: firstBattery.voltage,
            bms: firstBattery.bms,
            cellType: firstBattery.cellType,
            cycleCount: firstBattery.cycleCount,
            warrantyPeriod: firstBattery.warrantyPeriod,
            ALL_FIELDS: firstBattery
          });
        }

        // Cache the products data
        localStorage.setItem('admin_cached_products', JSON.stringify(listings));
        localStorage.setItem('admin_cached_timestamp', Date.now().toString());
      } catch (error) {
        console.warn("⚠️ Failed to load products:", error.message);
        // Try to get cached products data
        const cachedProducts = localStorage.getItem('admin_cached_products');
        const cachedTimestamp = localStorage.getItem('admin_cached_timestamp');

        if (cachedProducts && cachedTimestamp) {
          const cacheAge = Date.now() - parseInt(cachedTimestamp);
          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            try {
              listings = JSON.parse(cachedProducts);
              console.log("📦 Using cached products:", listings.length);
            } catch (e) {
              console.warn("Failed to parse cached products");
            }
          }
        }
      }

      try {
        transactions = await apiRequest("/api/Order");
        console.log("✅ Orders loaded:", transactions);
        
        // ✅ DEBUG: Log sample order to check field names
        if (transactions && transactions.length > 0) {
          console.log("🔍 Sample order from API:", transactions[0]);
          console.log("🔍 Sample order keys:", Object.keys(transactions[0]));
          
          // Check for cancelled orders
          const cancelledSample = transactions.find(o => {
            const status = (o.status || o.Status || '').toLowerCase();
            return status === 'cancelled' || status === 'failed' || status === 'canceled';
          });
          if (cancelledSample) {
            console.log("🔍 Sample CANCELLED order:", cancelledSample);
            console.log("🔍 Cancelled order keys:", Object.keys(cancelledSample));
          }
        }
      } catch (error) {
        console.warn("⚠️ Failed to load orders:", error.message);
        // Try to get cached orders data
        const cachedOrders = localStorage.getItem('admin_cached_orders');
        if (cachedOrders) {
          try {
            transactions = JSON.parse(cachedOrders);
            console.log("📦 Using cached orders:", transactions.length);
          } catch (e) {
            console.warn("Failed to parse cached orders");
          }
        }
      }

      console.log("Admin loaded data:", {
        users: users.length,
        listings: listings.length,
        transactions: transactions.length,
        usersSample: users.slice(0, 2),
        listingsSample: listings.slice(0, 2)
      });

      const norm = (v) => String(v || "").toLowerCase();

      // ✅ OPTIMIZED: Process listings without delays - just map data, don't load images
      const processedListings = [];

      console.log("🔍 Starting to process listings:", listings.length, "items");

      // ✅ Process all listings in parallel - NO DELAYS, NO IMAGE LOADING
      for (let i = 0; i < listings.length; i++) {
        const item = listings[i];
        // ✅ Reduced logging for faster performance
        if (i % 10 === 0 || i === listings.length - 1) {
          console.log(`🔍 Processing items ${i + 1}/${listings.length}...`);
        }

        const norm = (v) => String(v || "").toLowerCase();
        // Get seller info from users array if sellerId exists
        const sellerId = item.sellerId || item.userId || item.ownerId || item.createdBy;
        let sellerInfo = {
          name: item.sellerName || item.ownerName || item.userName || "Không rõ",
          phone: item.sellerPhone || item.ownerPhone || item.contactPhone || "N/A",
          email: item.sellerEmail || item.ownerEmail || item.contactEmail || "N/A"
        };

        // Try to find seller info from users array
        if (sellerId && users.length > 0) {
          const seller = users.find(u =>
            u.userId === sellerId ||
            u.id === sellerId ||
            u.UserId === sellerId
          );
          if (seller) {
            console.log(`Found seller for product ${getId(item)}:`, seller);
            sellerInfo = {
              name: seller.fullName || seller.full_name || seller.name || sellerInfo.name,
              phone: seller.phone || sellerInfo.phone,
              email: seller.email || sellerInfo.email
            };
          } else {
            console.log(`No seller found for product ${getId(item)} with sellerId: ${sellerId}`);
          }
        } else {
          console.log(`No sellerId or users for product ${getId(item)}:`, { sellerId, usersLength: users.length });
        }

        // Debug: Log raw item data for battery products
        if (item.productType && item.productType.toLowerCase() !== 'vehicle' && item.productType.toLowerCase() !== 'xe điện') {
          console.log('🔍 Raw Battery Product Data:', {
            id: getId(item),
            title: item.title,
            productType: item.productType,
            manufactureYear: item.manufactureYear,
            year: item.year,
            batteryType: item.batteryType,
            batteryHealth: item.batteryHealth,
            capacity: item.capacity,
            voltage: item.voltage,
            bms: item.bms,
            cellType: item.cellType,
            cycleCount: item.cycleCount,
            allFields: Object.keys(item).reduce((acc, key) => {
              acc[key] = item[key];
              return acc;
            }, {})
          });
        }

        const mapped = {
          id: getId(item),
          title: item.title || item.name || item.productName || "Không có tiêu đề",
          brand: item.brand || item.brandName || "Không rõ",
          model: item.model || item.modelName || "Không rõ",
          // Handle manufactureYear: 0 means no year set, null/undefined also means no year
          year: (item.manufactureYear && item.manufactureYear > 0) ? item.manufactureYear : (item.year && item.year > 0) ? item.year : (item.modelYear && item.modelYear > 0) ? item.modelYear : (item.manufacturingYear && item.manufacturingYear > 0) ? item.manufacturingYear : null,
          manufactureYear: (item.manufactureYear && item.manufactureYear > 0) ? item.manufactureYear : (item.year && item.year > 0) ? item.year : (item.modelYear && item.modelYear > 0) ? item.modelYear : (item.manufacturingYear && item.manufacturingYear > 0) ? item.manufacturingYear : null,
          price: parseFloat(item.price || item.listPrice || item.sellingPrice || 0),
          status: (() => {
            // Check multiple possible status fields (Status, status, etc.)
            const rawStatus = norm(item.status || item.Status || item.verificationStatus || item.approvalStatus || "pending");

            // Debug logging for status mapping
            const productId = getId(item);

            // ✅ FIX: Cross-check with order status - if order is completed, product should be sold
            // ✅ FIX: Cross-check with order status - if order is cancelled, product should be Active
            if (productId && transactions && transactions.length > 0) {
              // First check for completed orders
              const completedOrder = transactions.find(o => {
                const orderProductId = o.productId || o.ProductId || o.product?.productId || o.product?.id;
                const orderStatus = (o.status || o.orderStatus || o.Status || o.OrderStatus || '').toLowerCase();
                return (orderProductId == productId || orderProductId === productId) && orderStatus === 'completed';
              });

              if (completedOrder) {
                // If order is completed, product should be sold regardless of product status
                console.log(`✅ Product ${productId} has completed order - forcing status to "sold"`);
                return "sold";
              }

              // Then check for cancelled/rejected orders
              const cancelledOrder = transactions.find(o => {
                const orderProductId = o.productId || o.ProductId || o.product?.productId || o.product?.id;
                const orderStatus = (o.status || o.orderStatus || o.Status || o.OrderStatus || '').toLowerCase();
                return (orderProductId == productId || orderProductId === productId) &&
                  (orderStatus === 'cancelled' || orderStatus === 'canceled' || orderStatus === 'rejected' || orderStatus === 'failed');
              });

              if (cancelledOrder) {
                // If order is cancelled, product should be Active (available for sale again) regardless of product status
                console.log(`✅ Product ${productId} has cancelled order - forcing status to "Active"`);
                return "Active";
              }
            }

            if (productId && (rawStatus === "reserved" || rawStatus === "sold")) {
              console.log(`🔍 Product ${productId} status mapping:`, {
                productId,
                title: item.title,
                rawStatus,
                itemStatus: item.status,
                itemStatusCapital: item.Status,
                verificationStatus: item.verificationStatus,
                mappedTo: rawStatus === "sold" ? "sold" : rawStatus === "reserved" ? "reserved" : rawStatus
              });
            }

            // Map backend statuses to frontend statuses
            // IMPORTANT: Check "sold" BEFORE "reserved" to ensure sold products show correctly
            if (rawStatus === "sold") return "sold"; // Đã bán thành công - check this FIRST
            if (rawStatus === "draft" || rawStatus === "re-submit") return "pending";
            if (rawStatus === "active" || rawStatus === "approved") return "Active";
            if (rawStatus === "rejected") return "rejected";
            if (rawStatus === "reserved") return "reserved"; // Đã thanh toán cọc
            return rawStatus;
          })(),
          productType: norm(item.productType || item.type || item.category || "vehicle"),
          licensePlate: item.licensePlate || item.plateNumber || item.registrationNumber || "N/A",
          warrantyPeriod: item.warrantyPeriod || item.warranty_period || item.WarrantyPeriod || "",
          mileage: item.mileage || item.odometer || item.distance || "N/A",
          fuelType: item.fuelType || item.energyType || item.powerSource || "N/A",
          transmission: item.transmission || item.gearbox || "N/A",
          color: item.color || item.paintColor || "N/A",
          condition: item.condition || item.vehicleCondition || "N/A",
          description: item.description || item.details || item.content || "Không có mô tả",
          location: item.location || item.address || item.city || "Không rõ",
          // Battery specific fields
          batteryType: item.batteryType || item.BatteryType || null,
          batteryHealth: item.batteryHealth || item.BatteryHealth || null,
          capacity: item.capacity || item.Capacity || null,
          voltage: item.voltage || item.Voltage || null,
          bms: item.bms || item.Bms || item.BMS || null,
          cellType: item.cellType || item.CellType || null,
          cycleCount: item.cycleCount || item.CycleCount || null,
          sellerId: sellerId,
          sellerName: sellerInfo.name,
          sellerPhone: sellerInfo.phone,
          sellerEmail: sellerInfo.email,
          createdDate: item.createdDate || item.createdAt || item.created_date || item.dateCreated || new Date().toISOString(),
          updatedDate: item.updatedDate || item.updatedAt || item.updated_date || item.dateUpdated,
          images: item.images || item.imageUrls || item.photos || [],
          imageUrl: item.imageUrl || item.mainImage || item.primaryImage,
          rejectionReason: item.rejectionReason || item.rejectReason || item.reason || null,
          verificationStatus: (() => {
            const rawStatus = norm(item.verificationStatus || item.status || "pending");
            let mappedStatus;

            // Map backend verification statuses to frontend statuses
            if (rawStatus === "draft" || rawStatus === "re-submit" || rawStatus === "notrequested") {
              mappedStatus = "NotRequested";
            } else if (rawStatus === "requested") {
              mappedStatus = "Requested";
            } else if (rawStatus === "inprogress") {
              mappedStatus = "InProgress";
            } else if (rawStatus === "verified") {
              mappedStatus = "Verified";
            } else if (rawStatus === "rejected") {
              mappedStatus = "Rejected";
            } else {
              mappedStatus = rawStatus;
            }

            console.log('🔍 Mapping verificationStatus:', {
              productId: getId(item),
              title: item.title,
              rawVerificationStatus: item.verificationStatus,
              rawStatus: rawStatus,
              mappedStatus: mappedStatus
            });

            return mappedStatus;
          })(),
        };

        // ✅ OPTIMIZED: Use only fallback images from product data - NO API CALLS
        // Admin dashboard doesn't need to load images from API, just use what's already in product data
        const fallbackImages = [];
        if (item.imageUrl) fallbackImages.push(item.imageUrl);
        if (item.imageUrls && Array.isArray(item.imageUrls)) fallbackImages.push(...item.imageUrls);
        if (item.images && Array.isArray(item.images)) fallbackImages.push(...item.images);
        if (item.photos && Array.isArray(item.photos)) fallbackImages.push(...item.photos);
        if (item.pictures && Array.isArray(item.pictures)) fallbackImages.push(...item.pictures);

        mapped.images = fallbackImages.filter(Boolean);

        processedListings.push(mapped);
      }

      // Filter out deleted products
      const nonDeletedListings = processedListings.filter(
        (l) => l.status !== "deleted"
      );

      console.log("Processed listings:", {
        total: processedListings.length,
        nonDeleted: nonDeletedListings.length,
        sample: processedListings.slice(0, 2)
      });

      // Sort listings: Pending first, then by updatedDate (recently updated first), then by createdDate
      const sortedListings = nonDeletedListings.sort((a, b) => {
        // Priority 1: Pending status first
        const isPendingA = a.status === "pending" ? 1 : 0;
        const isPendingB = b.status === "pending" ? 1 : 0;
        if (isPendingA !== isPendingB) {
          return isPendingB - isPendingA; // Pending items first
        }

        // Priority 2: Recently updated products first (only for pending items)
        if (a.status === "pending" && b.status === "pending") {
          const updatedA = new Date(a.updatedDate || a.createdDate || 0);
          const updatedB = new Date(b.updatedDate || b.createdDate || 0);
          if (updatedA.getTime() !== updatedB.getTime()) {
            return updatedB - updatedA; // Most recently updated first
          }
        }

        // Priority 3: Newest created first
        const dateA = new Date(a.createdDate || 0);
        const dateB = new Date(b.createdDate || 0);
        return dateB - dateA;
      });

      console.log("Final sorted listings:", {
        total: sortedListings.length,
        sample: sortedListings.slice(0, 2)
      });

      // Calculate stats
      const vehicleListings = sortedListings.filter(l =>
        l.productType?.toLowerCase().includes("vehicle") ||
        l.productType?.toLowerCase().includes("xe")
      );
      const batteryListings = sortedListings.filter(l =>
        l.productType?.toLowerCase().includes("battery") ||
        l.productType?.toLowerCase().includes("pin")
      );

      const pendingListings = sortedListings.filter(l => l.status === "pending");
      const approvedListings = sortedListings.filter(l => l.status === "Active");
      const rejectedListings = sortedListings.filter(l => l.status === "rejected");
      const soldListings = sortedListings.filter(l => l.status === "sold");

      // ✅ FIX: Normalize transactions array
      const transactionsArray = Array.isArray(transactions) ? transactions : [];

      // ✅ FIX: Calculate orders stats with normalized status checking
      const completedOrders = transactionsArray.filter(t => {
        const orderStatus = String(t.status || t.orderStatus || t.Status || t.OrderStatus || "").toLowerCase();
        return orderStatus === "completed";
      }).length;

      const activeOrders = transactionsArray.filter(t => {
        const orderStatus = String(t.status || t.orderStatus || t.Status || t.OrderStatus || "").toLowerCase();
        return orderStatus === "pending" || orderStatus === "processing" || orderStatus === "confirmed" || orderStatus === "depositpaid" || orderStatus === "deposited";
      }).length;

      // ✅ FIX: Calculate revenue from completed orders (actual sales), not from approved products
      const completedOrdersList = transactionsArray.filter(t => {
        const orderStatus = String(t.status || t.orderStatus || t.Status || t.OrderStatus || "").toLowerCase();
        return orderStatus === "completed";
      });

      // ✅ NEW: Fetch revenue statistics from new API endpoint
      let totalRevenue = 0;
      let depositRevenue = 0;
      let verificationRevenue = 0;
      let cancelledNoRefundRevenue = 0;
      let cancelledNoRefundOrders = [];
      let allVerificationPayments = []; // Keep for date-based calculations
      
      try {
        const revenueStats = await apiRequest('/api/Order/revenue-statistics');
        console.log('💰 [REVENUE API] Revenue statistics:', revenueStats);
        
        totalRevenue = revenueStats.totalRevenue || 0;
        depositRevenue = revenueStats.completedOrdersRevenue || 0;
        verificationRevenue = revenueStats.verificationRevenue || 0;
        cancelledNoRefundRevenue = revenueStats.cancelledNoRefundRevenue || 0;
        cancelledNoRefundOrders = revenueStats.cancelledNoRefundOrders || [];
        
        console.log('💰 [REVENUE DEBUG] Revenue breakdown:', {
          totalRevenue: totalRevenue.toLocaleString('vi-VN'),
          depositRevenue: depositRevenue.toLocaleString('vi-VN'),
          verificationRevenue: verificationRevenue.toLocaleString('vi-VN'),
          cancelledNoRefundRevenue: cancelledNoRefundRevenue.toLocaleString('vi-VN'),
          completedOrdersCount: revenueStats.completedOrdersCount,
          verificationPaymentsCount: revenueStats.verificationPaymentsCount,
          cancelledNoRefundCount: revenueStats.cancelledNoRefundCount
        });
        
        // Still fetch verification payments for date-based calculations
        try {
          const payments = await apiRequest('/api/Payment');
          const verificationPayments = payments.filter(p => {
            const paymentType = (p.paymentType || p.PaymentType || '').toLowerCase();
            const status = (p.status || p.Status || '').toLowerCase();
            return paymentType === 'verification' && status === 'success';
          });
          
          const seenPaymentIds = new Set();
          allVerificationPayments = verificationPayments.filter(p => {
            const paymentId = p.paymentId || p.PaymentId || p.id || p.Id;
            if (paymentId && !seenPaymentIds.has(paymentId)) {
              seenPaymentIds.add(paymentId);
              return true;
            }
            return !paymentId;
          });
        } catch (paymentError) {
          console.error('[REVENUE API] Failed to fetch payments for date calculations:', paymentError);
        }
      } catch (error) {
        console.error('[REVENUE API] Failed to fetch revenue statistics, using fallback:', error);
        
        // Fallback to old calculation
        depositRevenue = completedOrdersList.reduce((sum, o) => {
          return sum + parseFloat(o.depositAmount || o.DepositAmount || 0);
        }, 0);
        
        try {
          const payments = await apiRequest('/api/Payment');
          const verificationPayments = payments.filter(p => {
            const paymentType = (p.paymentType || p.PaymentType || '').toLowerCase();
            const status = (p.status || p.Status || '').toLowerCase();
            return paymentType === 'verification' && status === 'success';
          });
          
          const seenPaymentIds = new Set();
          allVerificationPayments = verificationPayments.filter(p => {
            const paymentId = p.paymentId || p.PaymentId || p.id || p.Id;
            if (paymentId && !seenPaymentIds.has(paymentId)) {
              seenPaymentIds.add(paymentId);
              return true;
            }
            return !paymentId;
          });
          
          verificationRevenue = allVerificationPayments.reduce((sum, p) => {
            return sum + parseFloat(p.amount || p.Amount || 0);
          }, 0);
        } catch (paymentError) {
          console.error('[REVENUE API] Failed to fetch payments:', paymentError);
        }
        
        totalRevenue = depositRevenue + verificationRevenue;
      }

      // ✅ FIX: Calculate revenue by date from completed orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ✅ Today's revenue from deposits
      const todaysDepositRevenue = completedOrdersList
        .filter(o => {
          const orderDate = new Date(o.createdDate || o.CreatedDate || o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate || 0);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        })
        .reduce((sum, o) => sum + parseFloat(o.depositAmount || o.DepositAmount || 0), 0);

      // ✅ Today's revenue from verification (reuse fetched data)
      const todaysVerificationRevenue = allVerificationPayments
        .filter(p => {
          const paymentDate = new Date(p.createdDate || p.CreatedDate || p.paymentDate || p.PaymentDate || 0);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate.getTime() === today.getTime();
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || p.Amount || 0), 0);

      const todaysRevenue = todaysDepositRevenue + todaysVerificationRevenue;

      // ✅ This year's revenue from deposits
      const thisYearDepositRevenue = completedOrdersList
        .filter(o => {
          const orderDate = new Date(o.createdDate || o.CreatedDate || o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate || 0);
          const currentYear = new Date().getFullYear();
          return orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + parseFloat(o.depositAmount || o.DepositAmount || 0), 0);

      // ✅ This year's revenue from verification (reuse fetched data)
      const thisYearVerificationRevenue = allVerificationPayments
        .filter(p => {
          const paymentDate = new Date(p.createdDate || p.CreatedDate || p.paymentDate || p.PaymentDate || 0);
          const currentYear = new Date().getFullYear();
          return paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || p.Amount || 0), 0);

      const thisYearRevenue = thisYearDepositRevenue + thisYearVerificationRevenue;

      // ✅ This month's revenue from deposits
      const thisMonthDepositRevenue = completedOrdersList
        .filter(o => {
          const orderDate = new Date(o.createdDate || o.CreatedDate || o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate || 0);
          const currentDate = new Date();
          return orderDate.getMonth() === currentDate.getMonth() &&
            orderDate.getFullYear() === currentDate.getFullYear();
        })
        .reduce((sum, o) => sum + parseFloat(o.depositAmount || o.DepositAmount || 0), 0);

      // ✅ This month's revenue from verification (reuse fetched data)
      const thisMonthVerificationRevenue = allVerificationPayments
        .filter(p => {
          const paymentDate = new Date(p.createdDate || p.CreatedDate || p.paymentDate || p.PaymentDate || 0);
          const currentDate = new Date();
          return paymentDate.getMonth() === currentDate.getMonth() &&
                 paymentDate.getFullYear() === currentDate.getFullYear();
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || p.Amount || 0), 0);

      const thisMonthRevenue = thisMonthDepositRevenue + thisMonthVerificationRevenue;

      // ✅ FIX: Calculate average deposit value from completed orders only (exclude verification fees for more accurate per-order average)
      const averageDepositValue = completedOrdersList.length > 0 ? depositRevenue / completedOrdersList.length : 0;
      // ✅ Total average includes both deposit and verification
      const averageOrderValue = completedOrdersList.length > 0 ? totalRevenue / completedOrdersList.length : 0;
      const completionRate = transactionsArray.length > 0 ? (completedOrders / transactionsArray.length) * 100 : 0;

      setStats({
        totalUsers: users.length,
        totalListings: sortedListings.length,
        pendingListings: pendingListings.length,
        approvedListings: approvedListings.length,
        rejectedListings: rejectedListings.length,
        totalRevenue,
        depositRevenue,
        verificationRevenue,
        cancelledNoRefundRevenue,
        vehicleListings: vehicleListings.length,
        batteryListings: batteryListings.length,
        activeListings: approvedListings.length,
        totalOrders: transactions.length,
        completedOrders,
        activeOrders,
        todaysRevenue,
        thisYearRevenue,
        thisMonthRevenue,
        averageOrderValue,
        completionRate,
        totalVehicles: vehicleListings.length,
        totalBatteries: batteryListings.length,
        soldVehicles: vehicleListings.filter(v => v.status === "sold").length,
        soldBatteries: batteryListings.filter(b => b.status === "sold").length,
      });
      
      setCancelledNoRefundOrders(cancelledNoRefundOrders);

      setAllListings(sortedListings);

      // ✅ FIX: Remove duplicate orders based on orderId AND productId+buyerId combination
      const ordersArray = Array.isArray(transactions) ? transactions : [];

      // First pass: Remove duplicates by orderId
      const seenOrderIds = new Set();
      const ordersByOrderId = [];
      for (const order of ordersArray) {
        const orderId = order.orderId || order.OrderId || order.id || order.Id;
        if (orderId && !seenOrderIds.has(orderId)) {
          seenOrderIds.add(orderId);
          ordersByOrderId.push(order);
        } else if (!orderId) {
          ordersByOrderId.push(order);
        }
      }

      // Second pass: Remove duplicates by productId + buyerId combination
      // Keep the order with highest priority status (completed > deposited > pending)
      const orderPriority = {
        'completed': 3,
        'deposited': 2,
        'depositpaid': 2,
        'pending': 1,
        'processing': 1,
        'confirmed': 1,
        'cancelled': 0,
        'failed': 0
      };

      const ordersByProductBuyer = new Map();
      const cancelledOrders = []; // ✅ Keep cancelled orders separately

      for (const order of ordersByOrderId) {
        const productId = order.productId || order.ProductId || order.product?.productId || order.product?.id;
        const buyerId = order.buyerId || order.BuyerId || order.userId || order.UserId;
        const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || '').toLowerCase();
        const priority = orderPriority[status] || 0;

        // ✅ If order is cancelled/failed, add to separate array and skip deduplication
        if (status === 'cancelled' || status === 'failed' || status === 'canceled') {
          cancelledOrders.push(order);
          console.log(`✅ Keeping cancelled order ${order.orderId || order.OrderId} (status: ${status})`);
          continue;
        }

        // Create unique key from productId + buyerId
        const key = `${productId}_${buyerId}`;

        if (!productId || !buyerId) {
          // Keep orders without productId or buyerId (shouldn't happen, but just in case)
          ordersByProductBuyer.set(`order_${order.orderId || order.OrderId || order.id}`, order);
          continue;
        }

        const existing = ordersByProductBuyer.get(key);
        if (!existing) {
          ordersByProductBuyer.set(key, order);
        } else {
          // Compare priority - keep the one with higher priority
          const existingStatus = (existing.status || existing.orderStatus || existing.Status || existing.OrderStatus || '').toLowerCase();
          const existingPriority = orderPriority[existingStatus] || 0;

          if (priority > existingPriority) {
            // Current order has higher priority, replace
            ordersByProductBuyer.set(key, order);
            console.log(`🔄 Replaced order ${existing.orderId || existing.OrderId} with ${order.orderId || order.OrderId} (higher priority: ${status} > ${existingStatus})`);
          } else if (priority === existingPriority) {
            // Same priority, keep the newer one
            const existingDate = new Date(existing.createdDate || existing.CreatedDate || existing.createdAt || existing.CreatedAt || 0);
            const currentDate = new Date(order.createdDate || order.CreatedDate || order.createdAt || order.CreatedAt || 0);
            if (currentDate > existingDate) {
              ordersByProductBuyer.set(key, order);
              console.log(`🔄 Replaced order ${existing.orderId || existing.OrderId} with ${order.orderId || order.OrderId} (newer date)`);
            } else {
              console.log(`⏭️ Skipped duplicate order ${order.orderId || order.OrderId} (same priority, older date)`);
            }
          } else {
            console.log(`⏭️ Skipped duplicate order ${order.orderId || order.OrderId} (lower priority: ${status} < ${existingStatus})`);
          }
        }
      }

      // ✅ Combine active orders with cancelled orders
      const uniqueOrders = [...Array.from(ordersByProductBuyer.values()), ...cancelledOrders];
      console.log(`✅ Deduplicated orders: ${ordersArray.length} → ${uniqueOrders.length} (removed ${ordersArray.length - uniqueOrders.length} duplicates)`);
      console.log(`✅ Cancelled orders kept: ${cancelledOrders.length}`);
      setOrders(uniqueOrders); // Store unique orders in state
      console.log("DEBUG: allListings set to:", sortedListings.length, "items. Content:", sortedListings.map(l => ({ id: l.id, verificationStatus: l.verificationStatus, productType: l.productType })));

      // Cache the processed data for future use
      localStorage.setItem('admin_cached_processed_listings', JSON.stringify(sortedListings));
      localStorage.setItem('admin_cached_users', JSON.stringify(users));
      localStorage.setItem('admin_cached_orders', JSON.stringify(transactions));

    } catch (error) {
      console.error("Error loading admin data:", error);

      // Try to get cached processed data first
      const cachedProcessed = localStorage.getItem('admin_cached_processed_listings');
      if (cachedProcessed) {
        try {
          const cachedListings = JSON.parse(cachedProcessed);
          console.log("📦 Using cached processed listings:", cachedListings.length);
          setAllListings(cachedListings);

          // Calculate stats from cached data
          const vehicleListings = cachedListings.filter(l =>
            l.productType?.toLowerCase().includes("vehicle") ||
            l.productType?.toLowerCase().includes("xe")
          );
          const batteryListings = cachedListings.filter(l =>
            l.productType?.toLowerCase().includes("battery") ||
            l.productType?.toLowerCase().includes("pin")
          );
          const pendingListings = cachedListings.filter(l => l.status === "pending");
          const approvedListings = cachedListings.filter(l => l.status === "Active");
          const rejectedListings = cachedListings.filter(l => l.status === "rejected");
          const totalRevenue = approvedListings.reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

          setStats({
            totalUsers: 0, // Will be updated when users load successfully
            totalListings: cachedListings.length,
            pendingListings: pendingListings.length,
            approvedListings: approvedListings.length,
            rejectedListings: rejectedListings.length,
            totalRevenue,
            vehicleListings: vehicleListings.length,
            batteryListings: batteryListings.length,
            activeListings: approvedListings.length,
            totalOrders: 0, // Will be updated when orders load successfully
            completedOrders: 0,
            activeOrders: 0,
            todaysRevenue: 0,
            thisYearRevenue: 0,
            thisMonthRevenue: 0,
            averageOrderValue: approvedListings.length > 0 ? totalRevenue / approvedListings.length : 0,
            completionRate: 0,
            totalVehicles: vehicleListings.length,
            totalBatteries: batteryListings.length,
            soldVehicles: vehicleListings.filter(v => v.status === "Active").length,
            soldBatteries: batteryListings.filter(b => b.status === "Active").length,
          });

          // Show warning toast
          showToast({
            title: "Cảnh báo",
            description: "Đang sử dụng dữ liệu đã lưu trữ. Một số thông tin có thể không cập nhật.",
            type: "warning",
          });

        } catch (e) {
          console.error("Failed to parse cached processed listings:", e);
          // Fall through to fallback
        }
      }

      // If no cached processed data, try to load products directly as fallback
      if (!cachedProcessed) {
        try {
          console.log("Trying fallback: loading products directly...");
          const fallbackProducts = await apiRequest("/api/Product");
          const fallbackListings = Array.isArray(fallbackProducts)
            ? fallbackProducts
            : fallbackProducts?.items || [];

          console.log("Fallback products loaded:", fallbackListings.length);

          if (fallbackListings.length > 0) {
            // Simple mapping for fallback
            const simpleMapped = fallbackListings.map(item => ({
              id: getId(item),
              title: item.title || item.name || "Không có tiêu đề",
              brand: item.brand || "Không rõ",
              model: item.model || "Không rõ",
              price: parseFloat(item.price || 0),
              status: item.status || "pending",
              productType: item.productType || "vehicle",
              sellerId: item.sellerId || item.userId || item.ownerId || item.createdBy || "N/A",
              sellerName: item.sellerName || item.ownerName || item.userName || "Không rõ",
              createdDate: item.createdDate || new Date().toISOString(),
              images: item.images || [],
            }));

            setAllListings(simpleMapped);
            console.log("Fallback listings set:", simpleMapped.length);

            // Cache fallback data
            localStorage.setItem('admin_cached_processed_listings', JSON.stringify(simpleMapped));
          } else {
            setAllListings([]);
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          setAllListings([]);
        }
      }

      // Only reset stats if we have no data at all
      if (!cachedProcessed && allListings.length === 0) {
        setStats({
          totalUsers: 0,
          totalListings: 0,
          pendingListings: 0,
          approvedListings: 0,
          rejectedListings: 0,
          totalRevenue: 0,
          vehicleListings: 0,
          batteryListings: 0,
          activeListings: 0,
          totalOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          todaysRevenue: 0,
          thisYearRevenue: 0,
          thisMonthRevenue: 0,
          averageOrderValue: 0,
          completionRate: 0,
          totalVehicles: 0,
          totalBatteries: 0,
          soldVehicles: 0,
          soldBatteries: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = allListings;

    console.log("Filtering listings:", {
      allListings: allListings.length,
      activeTab,
      searchTerm,
      statusFilter,
      productTypeFilter,
      dateFilter
    });

    // Filter by active tab (vehicle/battery management)
    if (activeTab === "vehicles") {
      filtered = filtered.filter((l) =>
        l.productType?.toLowerCase().includes("vehicle") ||
        l.productType?.toLowerCase().includes("xe")
      );
    } else if (activeTab === "batteries") {
      filtered = filtered.filter((l) =>
        l.productType?.toLowerCase().includes("battery") ||
        l.productType?.toLowerCase().includes("pin")
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
          (l.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.licensePlate || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "verification_requested") {
        // Filter for products that need verification
        filtered = filtered.filter((l) =>
          l.verificationStatus === "Requested" || l.verificationStatus === "InProgress"
        );
      } else {
        // ✅ FIX: Map filter value to actual status value
        // "approved" filter should match "Active" status
        let filterStatus = statusFilter;
        if (statusFilter === "approved") {
          filterStatus = "Active";
        }
        // Regular status filter
        filtered = filtered.filter((l) => l.status === filterStatus);
      }
    }

    // Product type filter
    if (productTypeFilter !== "all") {
      filtered = filtered.filter((l) => {
        const matches = l.productType?.toLowerCase() === productTypeFilter.toLowerCase();
        return matches;
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((l) => {
        const listingDate = new Date(l.createdDate || 0);
        return listingDate >= filterDate;
      });
    }

    console.log("Final filtered listings:", {
      count: filtered.length,
      sample: filtered.slice(0, 2)
    });

    setFilteredListings(filtered);
  };

  const handleApprove = async (productId) => {
    // Show confirmation dialog
    if (!window.confirm("Bạn có chắc chắn muốn duyệt sản phẩm này?")) {
      return;
    }

    // Add to processing set
    setProcessingIds(prev => new Set(prev).add(productId));

    try {
      await approveProduct(productId);

      // Update local state - chỉ cập nhật status, không động vào verificationStatus
      setAllListings((prev) =>
        prev.map((item) =>
          getId(item) === productId
            ? { ...item, status: "Active" }
            : item
        )
      );

      // Send notification
      const product = allListings.find((item) => getId(item) === productId);
      const sellerId = product?.sellerId || product?.userId;
      if (sellerId) {
        await notifyPostApproved(sellerId, product?.title || product?.name);
      }

      showToast({
        title: "Duyệt thành công",
        description: `Sản phẩm "${product?.title || product?.name}" đã được duyệt và thông báo đã được gửi`,
        type: "success",
      });
    } catch (error) {
      console.error("Error approving product:", error);
      showToast({
        title: "Lỗi",
        description: "Không thể duyệt sản phẩm",
        type: "error",
      });
    } finally {
      // Remove from processing set
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleReject = async (productId, rejectionReason) => {
    // Validate productId
    if (!productId || productId === 'undefined') {
      console.error("Invalid product ID:", productId);
      showToast({
        title: "Lỗi",
        description: "ID sản phẩm không hợp lệ",
        type: "error",
      });
      return;
    }

    try {
      await rejectProduct(productId, rejectionReason);

      // Update local state
      setAllListings((prev) =>
        prev.map((item) =>
          getId(item) === productId
            ? {
              ...item,
              status: "rejected",
              verificationStatus: "Rejected",
              rejectionReason,
            }
            : item
        )
      );

      // Send notification
      const product = allListings.find((item) => getId(item) === productId);
      const sellerId = product?.sellerId || product?.userId;
      if (sellerId) {
        await notifyPostRejected(sellerId, product?.title || product?.name);

        // Also send verification rejection notification
        await sendVerificationNotificationToUser(
          productId,
          'Rejected',
          rejectionReason || 'Sản phẩm không đạt yêu cầu kiểm định.'
        );
      }

      showToast({
        title: "Từ chối thành công",
        description: `Sản phẩm đã bị từ chối và thông báo đã được gửi`,
        type: "success",
      });
    } catch (error) {
      console.error("Error rejecting product:", error);
      throw error;
    }
  };

  const openRejectModal = (product) => {
    setRejectModal({
      isOpen: true,
      product,
    });
  };

  const closeRejectModal = () => {
    setRejectModal({
      isOpen: false,
      product: null,
    });
  };

  const handleStartInspection = async (productId) => {
    try {
      console.log(`📋 Opening inspection modal for product ${productId}...`);

      // Lấy thông tin sản phẩm hiện tại
      const product = allListings.find(p => getId(p) === productId);
      if (!product) {
        showToast("Không tìm thấy thông tin sản phẩm", "error");
        return;
      }

      // ✅ CHỈ MỞ MODAL - KHÔNG GỌI API, KHÔNG THAY ĐỔI STATUS
      // Trạng thái chỉ thay đổi khi admin bấm "Hoàn thành kiểm định"
      console.log("📋 Product data for inspection:", {
        manufactureYear: product.manufactureYear,
        year: product.year,
        mileage: product.mileage,
        condition: product.condition,
        licensePlate: product.licensePlate,
        fullProduct: product
      });
      setCurrentInspectionProduct(product);
      setInspectionImages([]);
      setInspectionFiles([]);
      setShowInspectionModal(true);

      showToast("Vui lòng upload hình ảnh kiểm định để hoàn thành.", "info");

    } catch (error) {
      console.error("Failed to open inspection modal:", error);
      showToast("Không thể mở modal kiểm định. Vui lòng thử lại.", "error");
    }
  };

  // Helper function to send verification notification to user
  const sendVerificationNotificationToUser = async (productId, verificationResult, adminNotes = '') => {
    try {
      const product = allListings.find(p => getId(p) === productId);
      if (!product) return false;

      const sellerId = product.userId || product.sellerId || product.ownerId;
      if (!sellerId) return false;

      const notificationSent = await notifyUserVerificationCompleted(
        sellerId,
        product.title || product.name || 'Sản phẩm',
        productId,
        verificationResult,
        adminNotes
      );

      if (notificationSent) {
        console.log(`✅ Verification ${verificationResult} notification sent to user ${sellerId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to send verification notification to user:', error);
      return false;
    }
  };

  const uploadAdminVerificationImages = async (productId, files) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('imageFile', file);

        const response = await apiRequest('/api/ProductImage/admin-verification', {
          method: 'POST',
          body: formData
        });

        return response;
      });

      const results = await Promise.all(uploadPromises);
      console.log("✅ Admin verification images uploaded:", results);
      return results;
    } catch (error) {
      console.error("❌ Failed to upload admin verification images:", error);
      throw error;
    }
  };

  // ✅ Function to add watermark to image
  const addWatermarkToImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Add watermark "VERIFIED" to đùng ở giữa ảnh
          const fontSize = Math.max(60, img.width / 8); // Large font size
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const watermarkText = 'VERIFIED';

          // Vẽ ở giữa ảnh
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          // Shadow để text nổi bật hơn
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 5;
          ctx.shadowOffsetY = 5;

          // Viền trắng dày
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = Math.max(8, fontSize / 10);
          ctx.strokeText(watermarkText, centerX, centerY);

          // Chữ xanh dương
          ctx.fillStyle = 'rgba(37, 99, 235, 0.85)';
          ctx.fillText(watermarkText, centerX, centerY);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, { type: file.type });
              resolve(watermarkedFile);
            } else {
              reject(new Error('Failed to create watermarked image'));
            }
          }, file.type);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleCompleteInspection = async (productId) => {
    try {
      console.log(`📋 Completing inspection for product ${productId}...`);

      // Validate inspection files
      if (!inspectionFiles || inspectionFiles.length === 0) {
        showToast("Vui lòng upload ít nhất một hình ảnh kiểm định!", "error");
        return;
      }

      // Get product details
      const product = allListings.find(p => getId(p) === productId);
      if (!product) {
        showToast("Không tìm thấy thông tin sản phẩm", "error");
        return;
      }

      // ✅ BƯỚC 1: Ảnh đã được watermark ngay khi upload, không cần watermark lại
      console.log(`📋 Images already watermarked during upload. Preparing to upload ${inspectionFiles.length} images...`);
      const watermarkedFiles = inspectionFiles; // Đã có watermark rồi

      // ✅ BƯỚC 2: Upload ảnh kiểm định qua API /api/ProductImage/multiple
      console.log(`🔄 Uploading ${watermarkedFiles.length} watermarked admin inspection images...`);
      try {
        // Tạo FormData cho multiple upload
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('name', 'Vehicle'); // ✅ Tên loại ảnh (Vehicle/Battery/Document)

        // Thêm tất cả file đã watermark vào FormData
        watermarkedFiles.forEach((file, index) => {
          // Rename file để đánh dấu là ảnh admin kiểm định
          const adminFileName = `ADMIN-INSPECTION-${Date.now()}-${index + 1}-${file.name}`;
          const renamedFile = new File([file], adminFileName, { type: file.type });
          formData.append('images', renamedFile);
          console.log(`  📎 Added watermarked file ${index + 1}:`, adminFileName, file.size, 'bytes');
        });

        // Gọi API upload multiple images
        const uploadResponse = await apiRequest('/api/ProductImage/multiple', {
          method: 'POST',
          body: formData,
          // Không set Content-Type header, browser sẽ tự động set cho FormData
        });

        console.log(`✅ Uploaded ${uploadResponse.length} admin inspection images:`, uploadResponse);
        showToast(`Đã upload ${uploadResponse.length} hình ảnh kiểm định thành công!`, "success");

      } catch (uploadError) {
        console.error("❌ Failed to upload admin inspection images:", uploadError);
        showToast("Không thể upload hình ảnh kiểm định. Vui lòng thử lại.", "error");
        return; // Dừng lại nếu upload thất bại
      }

      // ✅ BƯỚC 3: Cập nhật VerificationStatus thành "Verified" TRƯỚC (quan trọng!)
      console.log(`🔄 Calling verify API for product ${productId}...`);
      try {
        const verifyResponse = await apiRequest(`/api/Product/verify/${productId}`, {
          method: 'PUT'
        });
        console.log("✅ Product verified successfully:", verifyResponse);
      } catch (verifyError) {
        console.error("❌ Failed to verify product:", verifyError);
        showToast("Không thể hoàn thành kiểm định. Vui lòng thử lại.", "error");
        return;
      }

      // ✅ BƯỚC 4: Cập nhật thông tin sản phẩm SAU khi đã verify (nếu admin đã chỉnh sửa)
      console.log(`🔄 Updating product information for product ${productId} using admin API...`);
      console.log("📋 Current inspection product data:", currentInspectionProduct);

      try {
        // Helper function to parse int safely
        const safeParseInt = (value) => {
          if (!value || value === "N/A" || value === "") return null;
          const parsed = parseInt(value);
          return isNaN(parsed) ? null : parsed;
        };

        // Helper function to parse float safely
        const safeParseFloat = (value) => {
          if (!value || value === "N/A" || value === "") return 0;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Chuẩn bị dữ liệu cho ProductRequest DTO (PascalCase)
        const productData = {
          // ⚠️ ProductType là REQUIRED - phải có giá trị "Vehicle" hoặc "Battery"
          ProductType: currentInspectionProduct.productType || "Vehicle",
          Title: currentInspectionProduct.title || "",
          Description: currentInspectionProduct.description || "",
          Price: safeParseFloat(currentInspectionProduct.price),
          Brand: currentInspectionProduct.brand || "",
          Model: currentInspectionProduct.model || "",
          Condition: currentInspectionProduct.condition || "",
          // Các trường cho xe (nếu là xe)
          VehicleType: currentInspectionProduct.vehicleType || null,
          ManufactureYear: safeParseInt(currentInspectionProduct.manufactureYear || currentInspectionProduct.year),
          Mileage: safeParseInt(currentInspectionProduct.mileage),
          Transmission: currentInspectionProduct.transmission || null,
          SeatCount: safeParseInt(currentInspectionProduct.seatCount),
          LicensePlate: currentInspectionProduct.licensePlate || "",
          // Các trường cho pin (nếu là pin) - set null để backend giữ giá trị cũ
          BatteryType: currentInspectionProduct.batteryType || null,
          BatteryHealth: currentInspectionProduct.batteryHealth || null,
          Capacity: currentInspectionProduct.capacity || null,
          Voltage: currentInspectionProduct.voltage || null,
          BMS: currentInspectionProduct.bms || null,
          CellType: currentInspectionProduct.cellType || null,
          CycleCount: safeParseInt(currentInspectionProduct.cycleCount)
        };

        console.log("📝 Product data to update (ProductRequest DTO):", JSON.stringify(productData, null, 2));

        // ✅ Gọi API PUT /api/Product/admin/update/{id}
        console.log(`🚀 Calling API: PUT /api/Product/admin/update/${productId}`);
        const updateResponse = await apiRequest(`/api/Product/admin/update/${productId}`, {
          method: 'PUT',
          body: productData
        });

        console.log("✅ Product information updated successfully (status preserved):", updateResponse);
        console.log("✅ Updated fields from response:", {
          Title: updateResponse.title,
          Brand: updateResponse.brand,
          Model: updateResponse.model,
          Price: updateResponse.price,
          Condition: updateResponse.condition,
          ManufactureYear: updateResponse.manufactureYear,
          Mileage: updateResponse.mileage,
          LicensePlate: updateResponse.licensePlate
        });

      } catch (updateError) {
        console.error("❌ Failed to update product information:", updateError);
        console.error("❌ Error details:", {
          status: updateError.status,
          message: updateError.message,
          data: updateError.data
        });
        console.error("❌ Full error object:", updateError);
        // Không return - tiếp tục đóng modal ngay cả khi update thất bại
        // Vì đã verify thành công rồi
      }

      // ✅ BƯỚC 4: Cập nhật local state
      setAllListings((prev) =>
        prev.map((item) =>
          getId(item) === productId
            ? { ...item, verificationStatus: "Verified" }
            : item
        )
      );

      // ✅ BƯỚC 5: Gửi thông báo cho người bán (nếu có)
      try {
        await sendVerificationNotificationToUser(
          productId,
          'Verified',
          'Xe đã được kiểm định thành công và đạt tiêu chuẩn chất lượng.'
        );
      } catch (notifError) {
        console.warn("⚠️ Failed to send notification:", notifError);
        // Không dừng lại nếu gửi thông báo thất bại
      }

      // ✅ BƯỚC 6: Refresh data để cập nhật UI
      console.log("🔄 Refreshing admin data...");
      await loadAdminData();

      // ✅ BƯỚC 7: Đóng modal và reset state
      console.log("🔄 Closing inspection modal and resetting state...");
      setShowInspectionModal(false);
      setCurrentInspectionProduct(null);
      setInspectionImages([]);
      setInspectionFiles([]);
      setShowNotifications(false);

      showToast("✅ Đã hoàn thành kiểm định xe và cập nhật thông tin thành công!", "success");

    } catch (error) {
      console.error("❌ Failed to complete inspection:", error);
      showToast("Không thể hoàn thành kiểm định. Vui lòng thử lại.", "error");

      // Đóng modal ngay cả khi có lỗi
      setShowInspectionModal(false);
      setCurrentInspectionProduct(null);
      setInspectionImages([]);
      setInspectionFiles([]);
      setShowNotifications(false);
    }
  };

  // Check for duplicate license plate when viewing product details
  const checkDuplicateLicensePlateForDetail = async (licensePlate, currentProductId) => {
    if (!licensePlate || licensePlate.trim() === '' || licensePlate === 'N/A') {
      setDuplicateLicensePlateWarning({ hasDuplicate: false, duplicates: [] });
      return;
    }

    try {
      // Get all products to check for duplicates
      const allProducts = await apiRequest('/api/Product');
      const productsList = Array.isArray(allProducts) ? allProducts : allProducts?.items || [];

      // Find products with same license plate (excluding current product)
      const duplicates = productsList.filter(p => {
        const productId = p.productId || p.id || p.ProductId || p.Id;
        const plate = (p.licensePlate || p.license_plate || '').trim().toUpperCase();
        const currentPlate = licensePlate.trim().toUpperCase();

        return plate === currentPlate &&
          plate !== '' &&
          plate !== 'N/A' &&
          productId !== currentProductId;
      });

      if (duplicates.length > 0) {
        setDuplicateLicensePlateWarning({ hasDuplicate: true, duplicates });
        console.log(`⚠️ Duplicate license plate found: ${licensePlate}`, duplicates);
      } else {
        setDuplicateLicensePlateWarning({ hasDuplicate: false, duplicates: [] });
      }
    } catch (error) {
      console.error('Error checking duplicate license plate:', error);
      setDuplicateLicensePlateWarning({ hasDuplicate: false, duplicates: [] });
    }
  };

  const openListingModal = async (listing) => {
    // Debug: Log product data to see what we're getting
    console.log('🔍 Selected Listing Data:', {
      id: listing.id,
      title: listing.title,
      productType: listing.productType,
      categoryId: listing.categoryId,
      isVehicle: listing.productType === "Vehicle" || listing.categoryId === 1,
      isBattery: listing.productType !== "Vehicle" && listing.categoryId !== 1,
      manufactureYear: listing.manufactureYear,
      year: listing.year,
      batteryType: listing.batteryType,
      batteryHealth: listing.batteryHealth,
      capacity: listing.capacity,
      voltage: listing.voltage,
      bms: listing.bms,
      cellType: listing.cellType,
      cycleCount: listing.cycleCount,
      warrantyPeriod: listing.warrantyPeriod,
      allFields: Object.keys(listing).reduce((acc, key) => {
        acc[key] = listing[key];
        return acc;
      }, {})
    });

    setSelectedListing(listing);
    setCurrentImageIndex(0);
    closeDetailsModal();
    setShowModal(true);

    // Check for duplicate license plate if it's a vehicle
    if (listing.productType === 'Vehicle' || listing.productType === 'vehicle') {
      const licensePlate = listing.licensePlate || listing.license_plate || '';
      const productId = getId(listing);
      await checkDuplicateLicensePlateForDetail(licensePlate, productId);
    } else {
      setDuplicateLicensePlateWarning({ hasDuplicate: false, duplicates: [] });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Đang chờ duyệt" },
      Active: { color: "bg-green-100 text-green-800", text: "Đã duyệt" },
      rejected: { color: "bg-red-100 text-red-800", text: "Bị từ chối" },
      reserved: { color: "bg-orange-100 text-orange-800", text: "Đã thanh toán cọc" },
      sold: { color: "bg-blue-100 text-blue-800", text: "Đã bán thành công" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getVerificationStatusBadge = (verificationStatus) => {
    const statusConfig = {
      NotRequested: { color: "bg-gray-100 text-gray-800", text: "Chưa yêu cầu" },
      Requested: { color: "bg-yellow-100 text-yellow-800", text: "Đang yêu cầu" },
      InProgress: { color: "bg-blue-100 text-blue-800", text: "Đang kiểm định" },
      Verified: { color: "bg-green-100 text-green-800", text: "Đã kiểm định" },
      Rejected: { color: "bg-red-100 text-red-800", text: "Từ chối kiểm định" },
    };

    const config = statusConfig[verificationStatus] || { color: "bg-gray-100 text-gray-800", text: "Không xác định" };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getProductTypeBadge = (productType) => {
    const isVehicle = productType?.toLowerCase().includes("vehicle") ||
      productType?.toLowerCase().includes("xe");
    const isBattery = productType?.toLowerCase().includes("battery") ||
      productType?.toLowerCase().includes("pin");

    if (isVehicle) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          Xe điện
        </span>
      );
    } else if (isBattery) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          Pin
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        {productType || "Không rõ"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-10">
        {/* Logo Section */}
        <div className="px-6 py-4">
          <div
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              handleTabChange("dashboard");
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">EV Market</h1>
              <p className="text-sm text-gray-500 leading-tight">Cổng quản trị</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quản trị viên</h3>
              <p className="text-sm text-gray-500">Quản trị cấp cao</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <div className="space-y-2">
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "dashboard"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => handleTabChange("dashboard")}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Bảng điều khiển</span>
            </div>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "vehicles"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => handleTabChange("vehicles")}
            >
              <Car className="h-5 w-5" />
              <span>Quản lý phương tiện</span>
            </div>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "batteries"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => handleTabChange("batteries")}
            >
              <Shield className="h-5 w-5" />
              <span>Quản lý pin</span>
            </div>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "users"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => handleTabChange("users")}
            >
              <Users className="h-5 w-5" />
              <span>Quản lý người dùng</span>
            </div>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "transactions"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => handleTabChange("transactions")}
            >
              <DollarSign className="h-5 w-5" />
              <span>Quản lý giao dịch</span>
            </div>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "reports"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => handleTabChange("reports")}
            >
              <Flag className="h-5 w-5" />
              <span>Báo cáo vi phạm</span>
            </div>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === "fees"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => handleTabChange("fees")}
            >
              <Settings className="h-5 w-5" />
              <span>Quản lý phí</span>
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
      <div className="ml-64 p-8 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {activeTab === "dashboard" && "Bảng điều khiển quản trị"}
                {activeTab === "vehicles" && "Quản lý phương tiện"}
                {activeTab === "batteries" && "Quản lý pin"}
                {activeTab === "users" && "Quản lý người dùng"}
                {activeTab === "transactions" && "Quản lý giao dịch"}
                {activeTab === "reports" && "Báo cáo vi phạm"}
                {activeTab === "fees" && "Quản lý phí"}
              </h1>
              <p className="text-gray-600">
                {activeTab === "dashboard" && "Tổng quan hệ thống EV Market • Cập nhật theo thời gian thực"}
                {activeTab === "vehicles" && "Quản lý bài đăng xe và phê duyệt"}
                {activeTab === "batteries" && "Quản lý bài đăng pin và phê duyệt"}
                {activeTab === "users" && "Quản lý tài khoản người dùng, vai trò và trạng thái"}
                {activeTab === "transactions" && "Quản lý các giao dịch giữa người bán và người mua"}
                {activeTab === "reports" && "Xem xét và xử lý các báo cáo vi phạm từ người dùng"}
                {activeTab === "fees" && "Quản lý phí đặt cọc và phí kiểm định"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Only show on dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">TỔNG DOANH THU</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Bao gồm 3 nguồn doanh thu</p>
                </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-green-600">✅ Đơn hoàn thành: {formatPrice(stats.depositRevenue)}</p>
                <p className="text-xs text-blue-600">🔍 Phí kiểm định: {formatPrice(stats.verificationRevenue)}</p>
                <p className="text-xs text-orange-600">⚠️ Đơn hủy (không hoàn): {formatPrice(stats.cancelledNoRefundRevenue)}</p>
              </div>
            </div>

            {/* Today's Revenue */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">DOANH THU ĐƠN HÀNG HOÀN TẤT HÔM NAY</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.todaysRevenue)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Từ đơn hàng hoàn tất</p>
                </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Trung bình/Tháng: {formatPrice(stats.thisYearRevenue > 0 ? stats.thisYearRevenue / 12 : 0)}</p>
                <p className="text-xs text-gray-500">Đơn hoàn tất: {stats.completedOrders}</p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">TỔNG ĐƠN HÀNG</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalOrders}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Tổng cộng</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Hoàn tất: {stats.completedOrders}</p>
                <p className="text-xs text-gray-500">Đang hoạt động: {stats.activeOrders}</p>
              </div>
            </div>

            {/* Average Value/Order */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">GIÁ TRỊ TB/ĐƠN HÀNG</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.averageOrderValue)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Bao gồm cọc + phí kiểm định</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Tổng đơn hoàn tất: {stats.completedOrders}</p>
                <p className="text-xs text-gray-500">Tổng sản phẩm: {stats.totalListings}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats Row - Only show on dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Completed Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">ĐƠN HÀNG HOÀN TẤT</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.completedOrders}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Tỉ lệ hoàn tất {stats.completionRate.toFixed(1)}%</p>
                </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Đơn đang hoạt động: {stats.activeOrders}</p>
                <p className="text-xs text-gray-500">Tổng giá trị: {formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">DOANH THU ĐƠN HÀNG HOÀN TẤT THÁNG NÀY</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.thisMonthRevenue)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-xl">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Trung bình/Ngày: {formatPrice(stats.thisMonthRevenue > 0 && new Date().getDate() > 0 ? stats.thisMonthRevenue / new Date().getDate() : 0)}</p>
                <p className="text-xs text-gray-500">Đơn hoàn tất: {stats.completedOrders}</p>
              </div>
            </div>

            {/* Vehicle vs Battery Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">XE & PIN</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.totalVehicles + stats.totalBatteries}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Tổng sản phẩm</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-xl">
                  <Car className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Xe: {stats.totalVehicles}</p>
                <p className="text-xs text-gray-500">Pin: {stats.totalBatteries}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats Row for Inspections - Only show on dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Pending Inspections */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">KIỂM ĐỊNH ĐANG CHỜ</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {allListings.filter(l => l.verificationStatus === "Requested").length}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Chờ quản trị viên xử lý</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-xl">
                  <Camera className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Đang thực hiện: {allListings.filter(l => l.verificationStatus === "InProgress").length}</p>
                <p className="text-xs text-gray-500">Đã hoàn thành: {allListings.filter(l => l.verificationStatus === "Verified").length}</p>
              </div>
            </div>

          </div>
        )}

        {/* Fee Management */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Quản lý phí hệ thống</h2>
              <p className="text-sm text-gray-600">Cấu hình phí đặt cọc và phí kiểm định cho hệ thống</p>
            </div>

            {feeLoading && feeSettings.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Đang tải...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  // Filter and deduplicate fees - only show one fee per type
                  // Priority: active fees first, then newest by createdDate
                  const filteredFees = feeSettings.filter(fee => {
                    const feeType = fee.feeType || fee.FeeType || '';
                    return feeType === 'DepositPercentage' || feeType === 'VerificationFee';
                  });

                  // Group by feeType and get the best one for each type
                  const feeMap = new Map();
                  filteredFees.forEach(fee => {
                    const feeType = fee.feeType || fee.FeeType || '';
                    const isActive = fee.isActive !== undefined ? fee.isActive : (fee.IsActive !== undefined ? fee.IsActive : false);
                    const createdDate = fee.createdDate || fee.CreatedDate;
                    const existingFee = feeMap.get(feeType);

                    if (!existingFee) {
                      feeMap.set(feeType, fee);
                    } else {
                      const existingIsActive = existingFee.isActive !== undefined ? existingFee.isActive : (existingFee.IsActive !== undefined ? existingFee.IsActive : false);
                      const existingDate = existingFee.createdDate || existingFee.CreatedDate;

                      // Priority: active > inactive, then newest date
                      if (isActive && !existingIsActive) {
                        feeMap.set(feeType, fee);
                      } else if (isActive === existingIsActive) {
                        // If both have same active status, prefer newer one
                        if (createdDate && existingDate) {
                          const feeDate = new Date(createdDate);
                          const existingFeeDate = new Date(existingDate);
                          if (feeDate > existingFeeDate) {
                            feeMap.set(feeType, fee);
                          }
                        } else if (createdDate && !existingDate) {
                          feeMap.set(feeType, fee);
                        }
                      }
                    }
                  });

                  return Array.from(feeMap.values());
                })().map((fee) => {
                  const feeId = fee.feeId || fee.FeeId;
                  const feeType = fee.feeType || fee.FeeType || '';
                  const feeValue = fee.feeValue || fee.FeeValue || 0;
                  const isActive = fee.isActive !== undefined ? fee.isActive : (fee.IsActive !== undefined ? fee.IsActive : false);
                  const createdDate = fee.createdDate || fee.CreatedDate;

                  const isEditing = editingFee && (editingFee.feeId || editingFee.FeeId) === feeId;

                  return (
                    <div
                      key={feeId}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {feeType === 'DepositPercentage' ? (
                              <CreditCard className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Shield className="h-5 w-5 text-green-600" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {feeType === 'DepositPercentage' ? 'Phí đặt cọc' : 'Phí kiểm định'}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {isActive ? 'Đang hoạt động' : 'Đã tắt'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {feeType === 'DepositPercentage'
                              ? 'Tỷ lệ phần trăm đặt cọc (ví dụ: 0.1 = 10%)'
                              : 'Phí kiểm định xe (VNĐ)'}
                          </p>
                          {createdDate && (
                            <p className="text-xs text-gray-500">
                              Ngày tạo: {formatDate(createdDate)}
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {feeType === 'DepositPercentage' ? 'Tỷ lệ phần trăm' : 'Giá trị phí (VNĐ)'}
                            </label>
                            <input
                              type="number"
                              step={feeType === 'DepositPercentage' ? '0.01' : '1'}
                              min="0"
                              value={feeFormData.feeValue}
                              onChange={(e) =>
                                setFeeFormData({ ...feeFormData, feeValue: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={
                                feeType === 'DepositPercentage' ? '0.1' : '50000'
                              }
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`active-${feeId}`}
                              checked={feeFormData.isActive}
                              onChange={(e) =>
                                setFeeFormData({ ...feeFormData, isActive: e.target.checked })
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`active-${feeId}`}
                              className="ml-2 text-sm text-gray-700"
                            >
                              Kích hoạt phí này
                            </label>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleSaveFee}
                              disabled={feeLoading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {feeLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingFee(null);
                                setFeeFormData({ feeValue: '', isActive: true });
                              }}
                              disabled={feeLoading}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {feeType === 'DepositPercentage' ? (
                                `${(feeValue * 100).toFixed(1)}%`
                              ) : (
                                formatPrice(feeValue)
                              )}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {feeType === 'DepositPercentage'
                                ? `Tỷ lệ: ${feeValue} (${(feeValue * 100).toFixed(1)}%)`
                                : `Giá trị: ${feeValue.toLocaleString('vi-VN')} VNĐ`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleEditFee(fee)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Chỉnh sửa
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(() => {
                  // Use same deduplication logic for empty check
                  const filteredFees = feeSettings.filter(fee => {
                    const feeType = fee.feeType || fee.FeeType || '';
                    return feeType === 'DepositPercentage' || feeType === 'VerificationFee';
                  });

                  const feeMap = new Map();
                  filteredFees.forEach(fee => {
                    const feeType = fee.feeType || fee.FeeType || '';
                    const isActive = fee.isActive !== undefined ? fee.isActive : (fee.IsActive !== undefined ? fee.IsActive : false);
                    const createdDate = fee.createdDate || fee.CreatedDate;
                    const existingFee = feeMap.get(feeType);

                    if (!existingFee) {
                      feeMap.set(feeType, fee);
                    } else {
                      const existingIsActive = existingFee.isActive !== undefined ? existingFee.isActive : (existingFee.IsActive !== undefined ? existingFee.IsActive : false);
                      const existingDate = existingFee.createdDate || existingFee.CreatedDate;

                      if (isActive && !existingIsActive) {
                        feeMap.set(feeType, fee);
                      } else if (isActive === existingIsActive) {
                        if (createdDate && existingDate) {
                          const feeDate = new Date(createdDate);
                          const existingFeeDate = new Date(existingDate);
                          if (feeDate > existingFeeDate) {
                            feeMap.set(feeType, fee);
                          }
                        } else if (createdDate && !existingDate) {
                          feeMap.set(feeType, fee);
                        }
                      }
                    }
                  });

                  return feeMap.size === 0;
                })() && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Chưa có cài đặt phí nào</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Users Management */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            {/* Sub-tabs */}
            <div className="flex items-center space-x-1 mb-6 border-b border-gray-200">
              <button
                onClick={() => {
                  setUserSubTab('active');
                }}
                className={`px-6 py-3 font-medium text-sm transition-colors relative ${userSubTab === 'active'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Đang hoạt động</span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    {users.filter(u => {
                      const st = (u.status || u.Status || 'active').toString().toLowerCase();
                      return st === 'active' || st === '';
                    }).length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  setUserSubTab('restricted');
                }}
                className={`px-6 py-3 font-medium text-sm transition-colors relative ${userSubTab === 'restricted'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Bị hạn chế</span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                    {users.filter(u => {
                      const st = (u.status || u.Status || '').toString().toLowerCase();
                      return st === 'suspended' || st === 'deleted';
                    }).length}
                  </span>
                </div>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, số điện thoại"
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') loadUsers({ page: 1, search: e.target.value }); }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={usersRole}
                  onChange={(e) => { setUsersRole(e.target.value); loadUsers({ page: 1, role: e.target.value }); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="sub_admin">Nhân viên</option>
                  <option value="user">Người dùng</option>
                </select>
                <button
                  onClick={() => loadUsers({ page: 1 })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={usersLoading}
                >
                  {usersLoading ? 'Đang tải...' : 'Làm mới'}
                </button>
              </div>
            </div>

            {/* Active Users Tab */}
            {userSubTab === 'active' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Họ tên</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vai trò</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ngày tạo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(() => {
                      const activeUsersList = users.filter(u => {
                        const st = (u.status || u.Status || 'active').toString().toLowerCase();
                        return st === 'active' || st === '';
                      });
                      return activeUsersList.map((u) => (
                        <tr key={u.id || u.Id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{u.fullName || u.FullName || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email || u.Email}</td>
                          <td className="px-4 py-3 text-sm">
                            {(() => {
                              const role = (u.role || u.Role || 'user').toString().toLowerCase();

                              // 🔍 DEBUG: Log role value for each user
                              if (role !== 'user' && role !== 'admin') {
                                console.log('🔍 User role debug:', {
                                  email: u.email,
                                  rawRole: u.role,
                                  rawRoleUpper: u.Role,
                                  normalizedRole: role,
                                  isSubAdmin: role === 'sub_admin',
                                  isStaff: role === 'staff',
                                  isSubadmin: role === 'subadmin'
                                });
                              }

                              // Map roles: admin, sub_admin (staff), user
                              let normalizedRole = 'user';
                              let label = 'Người dùng';
                              let cls = 'bg-gray-100 text-gray-800';

                              if (role === 'admin') {
                                normalizedRole = 'admin';
                                label = 'Quản trị viên';
                                cls = 'bg-red-100 text-red-800';
                              } else if (role === 'sub_admin' || role === 'staff' || role === 'subadmin') {
                                normalizedRole = 'staff';
                                label = 'Nhân viên';
                                cls = 'bg-blue-100 text-blue-800';
                              }

                              return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{label}</span>;
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <select
                              title={getReasonTextForUser(u) || undefined}
                              defaultValue={(u.status || u.Status || 'active').toLowerCase()}
                              onChange={(e) => {
                                const id = u.id || u.Id;
                                const next = e.target.value;
                                if (next === 'suspended' || next === 'deleted') {
                                  setPendingStatusUserId(id);
                                  setPendingStatus(next);
                                  setPendingStatusReason('');
                                  setShowStatusModal(true);
                                  // revert UI select until confirmed
                                  e.target.value = (u.status || u.Status || 'active').toLowerCase();
                                } else if (next === 'active') {
                                  // When restoring to active, clear the reason but keep status update
                                  updateUserStatus(id, next);
                                } else {
                                  updateUserStatus(id, next);
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="active" hidden>Đang hoạt động</option>
                              <option value="suspended">Tạm khóa người dùng</option>
                              <option value="deleted">Xóa người dùng</option>
                            </select>
                            {(() => {
                              const txt = getReasonTextForUser(u);
                              const st = (u.status || u.Status || '').toString().toLowerCase();
                              if (!txt || (st !== 'suspended' && st !== 'deleted')) return null;
                              return (
                                <div className="mt-1 text-xs text-gray-500 truncate" title={txt}>{txt}</div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {u.createdAt || u.CreatedAt ? new Date(u.createdAt || u.CreatedAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <button
                              className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 text-blue-600"
                              title="Xem hồ sơ"
                              onClick={() => {
                                const id = u.id || u.Id;
                                if (id) {
                                  navigate(`/seller/${id}`);
                                } else {
                                  showToast({ title: 'Lỗi', description: 'Không xác định được ID người dùng', type: 'error' });
                                }
                              }}
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                    {(() => {
                      const activeUsersList = users.filter(u => {
                        const st = (u.status || u.Status || 'active').toString().toLowerCase();
                        return st === 'active' || st === '';
                      });
                      return activeUsersList.length === 0 && !usersLoading && (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>Không có tài khoản đang hoạt động</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Restricted Users Tab */}
            {userSubTab === 'restricted' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Họ tên</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vai trò</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Lý do</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ngày bị hạn chế</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {users.filter(u => {
                      const st = (u.status || u.Status || '').toString().toLowerCase();
                      return st === 'suspended' || st === 'deleted';
                    }).map((u) => (
                      <tr key={u.id || u.Id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{u.fullName || u.FullName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email || u.Email}</td>
                        <td className="px-4 py-3 text-sm">
                          {(() => {
                            const role = (u.role || u.Role || 'user').toString().toLowerCase();

                            // 🔍 DEBUG: Log role value for each restricted user
                            if (role !== 'user' && role !== 'admin') {
                              console.log('🔍 Restricted user role debug:', {
                                email: u.email,
                                rawRole: u.role,
                                rawRoleUpper: u.Role,
                                normalizedRole: role,
                                isSubAdmin: role === 'sub_admin',
                                isStaff: role === 'staff',
                                isSubadmin: role === 'subadmin'
                              });
                            }

                            // Map roles: admin, sub_admin (staff), user
                            let normalizedRole = 'user';
                            let label = 'Người dùng';
                            let cls = 'bg-gray-100 text-gray-800';

                            if (role === 'admin') {
                              normalizedRole = 'admin';
                              label = 'Quản trị viên';
                              cls = 'bg-red-100 text-red-800';
                            } else if (role === 'sub_admin' || role === 'staff' || role === 'subadmin') {
                              normalizedRole = 'staff';
                              label = 'Nhân viên';
                              cls = 'bg-blue-100 text-blue-800';
                            }

                            return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{label}</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            title={getReasonTextForUser(u) || undefined}
                            defaultValue={(u.status || u.Status || 'suspended').toLowerCase()}
                            onChange={(e) => {
                              const id = u.id || u.Id;
                              const next = e.target.value;
                              const currentStatus = (u.status || u.Status || '').toString().toLowerCase();

                              // If changing between restricted statuses (suspended <-> deleted)
                              // Ask if they want to update the reason
                              if ((next === 'suspended' || next === 'deleted') &&
                                (currentStatus === 'suspended' || currentStatus === 'deleted') &&
                                next !== currentStatus) {
                                const updateReason = window.confirm(
                                  `Bạn đang chuyển trạng thái từ "${currentStatus === 'suspended' ? 'Tạm khóa' : 'Đã xóa'}" sang "${next === 'suspended' ? 'Tạm khóa' : 'Đã xóa'}".\n\n` +
                                  'Bạn có muốn cập nhật lý do hạn chế không?\n\n' +
                                  '• Chọn "OK" để nhập lý do mới\n' +
                                  '• Chọn "Cancel" để giữ nguyên lý do cũ'
                                );

                                if (updateReason) {
                                  // Open modal to update reason
                                  setPendingStatusUserId(id);
                                  setPendingStatus(next);
                                  setPendingStatusReason('');
                                  setPendingStatusReasonCode('');
                                  setPendingStatusReasonNote('');
                                  setShowStatusModal(true);
                                  e.target.value = currentStatus;
                                } else {
                                  // Keep old reason, just change status
                                  updateUserStatus(id, next);
                                }
                              } else if (next === 'active') {
                                // Restoring to active - clear reason
                                updateUserStatus(id, next);
                              } else {
                                // This shouldn't happen in restricted tab, but handle it
                                e.target.value = currentStatus;
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="active">Khôi phục hoạt động</option>
                            <option value="suspended">Đã tạm khóa</option>
                            <option value="deleted">Đã xóa</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {(() => {
                            const txt = getReasonTextForUser(u);
                            // Debug log for restricted accounts
                            if ((u.status || u.Status || '').toString().toLowerCase() === 'suspended' ||
                              (u.status || u.Status || '').toString().toLowerCase() === 'deleted') {
                              console.log('🔍 Restricted user reason:', {
                                id: u.id || u.Id,
                                email: u.email || u.Email,
                                status: u.status || u.Status,
                                accountStatusReason: u.accountStatusReason || u.AccountStatusReason,
                                reason: u.reason || u.Reason,
                                reasonCode: u.reasonCode || u.ReasonCode,
                                reasonNote: u.reasonNote || u.ReasonNote,
                                result: txt
                              });
                            }
                            return txt ? (
                              <button
                                onClick={() => {
                                  setSelectedUserForReason(u);
                                  setShowReasonDetailModal(true);
                                }}
                                className="text-left hover:text-blue-600 hover:underline cursor-pointer line-clamp-2"
                                title="Click để xem chi tiết lý do"
                              >
                                {txt}
                              </button>
                            ) : '-';
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {u.statusChangedDate || u.StatusChangedDate
                            ? new Date(u.statusChangedDate || u.StatusChangedDate).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => {
                      const st = (u.status || u.Status || '').toString().toLowerCase();
                      return st === 'suspended' || st === 'deleted';
                    }).length === 0 && !usersLoading && (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>Không có tài khoản bị hạn chế</td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">Trang {usersPage} / {usersTotalPages}</div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 border rounded disabled:opacity-50"
                  disabled={usersPage <= 1 || usersLoading}
                  onClick={() => { const p = usersPage - 1; setUsersPage(p); loadUsers({ page: p }); }}
                >
                  Trước
                </button>
                <button
                  className="px-3 py-2 border rounded disabled:opacity-50"
                  disabled={usersPage >= usersTotalPages || usersLoading}
                  onClick={() => { const p = usersPage + 1; setUsersPage(p); loadUsers({ page: p }); }}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No inline modal; using seller profile page in new tab */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowStatusModal(false)} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 z-10">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{pendingStatus === 'suspended' ? 'Chọn lý do tạm khóa' : 'Chọn lý do xóa'}</h3>
              <div className="space-y-3">
                <select
                  value={pendingStatusReasonCode}
                  onChange={(e) => setPendingStatusReasonCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3"
                >
                  <option value="">-- Chọn lý do --</option>
                  {(pendingStatus === 'deleted' ? deletedReasonOptions : suspendedReasonOptions).map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
                {(pendingStatusReasonCode === 'OTHER') && (
                  <textarea
                    value={pendingStatusReasonNote}
                    onChange={(e) => setPendingStatusReasonNote(e.target.value)}
                    placeholder="Nhập ghi chú bổ sung..."
                    className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="px-4 py-2 rounded-lg border" onClick={() => setShowStatusModal(false)}>Hủy</button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={!pendingStatusUserId || !pendingStatusReasonCode || (pendingStatusReasonCode === 'OTHER' && pendingStatusReasonNote.trim().length === 0)}
                  onClick={async () => {
                    const uid = pendingStatusUserId;
                    const st = pendingStatus;
                    // Debug: Log before updating
                    console.log('🔍 Submitting status change from modal:', {
                      userId: uid,
                      status: st,
                      reasonCode: pendingStatusReasonCode,
                      reasonNote: pendingStatusReasonNote,
                    });
                    setShowStatusModal(false);
                    await updateUserStatus(uid, st);
                    // Reset pending status fields after update
                    setPendingStatusUserId(null);
                    setPendingStatus('');
                    setPendingStatusReason('');
                    setPendingStatusReasonCode('');
                    setPendingStatusReasonNote('');
                  }}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Filters and Search - Hide on reports, users, transactions, and fees tabs */}
        {activeTab !== "reports" && activeTab !== "users" && activeTab !== "transactions" && activeTab !== "fees" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, thương hiệu, model, biển số..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái ({allListings.length})</option>
                  <option value="pending">Đang chờ duyệt ({allListings.filter(l => l.status === "pending").length})</option>
                  <option value="approved">Đã duyệt ({allListings.filter(l => l.status === "Active").length})</option>
                  <option value="rejected">Bị từ chối ({allListings.filter(l => l.status === "rejected").length})</option>
                  <option value="reserved">Đã thanh toán cọc ({allListings.filter(l => l.status === "reserved").length})</option>
                  <option value="sold">Đã bán thành công ({allListings.filter(l => l.status === "sold").length})</option>
                  <option value="verification_requested">Yêu cầu kiểm định ({allListings.filter(l => l.verificationStatus === "Requested" || l.verificationStatus === "InProgress").length})</option>
                </select>
                <select
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="vehicle">Xe điện</option>
                  <option value="battery">Pin</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="year">Năm nay</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Listings Table - Hide on inspections, transactions, reports, users and fees tabs */}
        {activeTab !== "inspections" && activeTab !== "transactions" && activeTab !== "reports" && activeTab !== "users" && activeTab !== "fees" && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === "dashboard" && `Danh sách sản phẩm (${filteredListings.length})`}
                {activeTab === "vehicles" && `Danh sách xe (${filteredListings.length})`}
                {activeTab === "batteries" && `Danh sách pin (${filteredListings.length})`}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người bán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kiểm định
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={listing.images[0]}
                                alt={listing.title}
                                onError={(e) => {
                                  console.log("Image failed to load:", listing.images[0]);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className={`h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center ${listing.images && listing.images.length > 0 ? 'hidden' : ''}`}
                              style={{ display: listing.images && listing.images.length > 0 ? 'none' : 'flex' }}
                            >
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {listing.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {listing.brand} {listing.model}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {listing.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getProductTypeBadge(listing.productType)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="font-medium">{formatPrice(listing.price)}</div>
                          <div className="text-xs text-blue-600">
                            Cọc: {formatPrice(listing.price * (() => {
                              // Get active deposit percentage from fee settings
                              const depositFee = feeSettings.find(f => 
                                (f.feeType || f.FeeType) === 'DepositPercentage' && 
                                (f.isActive !== undefined ? f.isActive : f.IsActive)
                              );
                              return depositFee ? (depositFee.feeValue || depositFee.FeeValue || 0.01) : 0.01;
                            })())}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{listing.sellerName || "Không rõ"}</div>
                        <div className="text-xs text-gray-500">ID: {listing.sellerId || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(listing.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerificationStatusBadge(listing.verificationStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(listing.createdDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={async () => {
                              const productId = listing.id || listing.productId;
                              setExpandedDetails(productId);
                              // Check for duplicate license plate if it's a vehicle
                              if (listing.productType?.toLowerCase().includes("vehicle")) {
                                const licensePlate = listing.licensePlate || listing.license_plate || '';
                                await checkDuplicateLicensePlateForExpandedDetails(licensePlate, productId);
                              } else {
                                setExpandedDetailsDuplicateWarning({ hasDuplicate: false, duplicates: [] });
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Inspection button for products with Requested or InProgress verification status */}
                          {(listing.verificationStatus === "Requested" || listing.verificationStatus === "InProgress") && (
                            <button
                              onClick={() => handleStartInspection(listing.id)}
                              className={`px-3 py-1 rounded-lg text-xs flex items-center space-x-1 ${listing.verificationStatus === "InProgress"
                                  ? "bg-orange-600 text-white hover:bg-orange-700"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              title={listing.verificationStatus === "InProgress" ? "Tiếp tục kiểm định" : "Bắt đầu kiểm định"}
                            >
                              <Camera className="h-3 w-3" />
                              <span>{listing.verificationStatus === "InProgress" ? "Tiếp tục" : "Kiểm định"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        {expandedDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {(() => {
                const product = allListings.find(p => getId(p) === expandedDetails);
                if (!product) return null;

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
                          <p className="text-sm text-gray-600">Chi tiết sản phẩm</p>
                        </div>
                      </div>
                      <button
                        onClick={closeDetailsModal}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XCircle className="h-6 w-6 text-gray-500" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Images */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h4>
                          {product.images && product.images.length > 0 ? (
                            <div className="space-y-4">
                              <div className="relative">
                                <img
                                  src={product.images[currentImageIndex]}
                                  alt={product.title}
                                  className="w-full h-64 object-cover rounded-lg"
                                />
                              </div>
                              {product.images.length > 1 && (
                                <div className="flex space-x-2 overflow-x-auto">
                                  {product.images.map((img, index) => (
                                    <button
                                      key={index}
                                      onClick={() => setCurrentImageIndex(index)}
                                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                    >
                                      <img
                                        src={img}
                                        alt={`${product.title} ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h4>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Loại sản phẩm</p>
                                <p className="font-medium">{getProductTypeBadge(product.productType)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Trạng thái</p>
                                <p className="font-medium">
                                  {cancelledOrderContext ? (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                      Giao dịch đã bị hủy
                                    </span>
                                  ) : (
                                    getStatusBadge(product.status)
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Thương hiệu</p>
                                <p className="font-medium">{product.brand}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Model</p>
                                <p className="font-medium">{product.model}</p>
                              </div>
                            </div>

                            {/* Only show year for vehicles */}
                            {(product.productType?.toLowerCase().includes("vehicle") || product.categoryId === 1) && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Năm sản xuất</p>
                                  <p className="font-medium">{product.year || product.manufactureYear || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Giá</p>
                                  <p className="font-medium text-green-600">{formatPrice(product.price)}</p>
                                </div>
                              </div>
                            )}

                            {/* For batteries, show price and technical specs */}
                            {product.productType?.toLowerCase() !== "vehicle" && product.categoryId !== 1 && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Giá</p>
                                  <p className="font-medium text-green-600">{formatPrice(product.price)}</p>
                                </div>
                              </div>
                            )}

                            {product.productType?.toLowerCase().includes("vehicle") && (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Biển số</p>
                                    <p className="font-medium">{product.licensePlate}</p>
                                    {/* Duplicate License Plate Warning */}
                                    {expandedDetailsDuplicateWarning.hasDuplicate && (
                                      <div className="mt-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                                        <div className="flex items-start">
                                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-xs font-semibold text-yellow-900 mb-1">
                                              ⚠️ Biển số đã trùng
                                            </p>
                                            <p className="text-xs text-yellow-800 mb-1">
                                              Biển số "{product.licensePlate}" đã được sử dụng bởi {expandedDetailsDuplicateWarning.duplicates.length} sản phẩm khác:
                                            </p>
                                            <ul className="text-xs text-yellow-700 list-disc list-inside space-y-0.5">
                                              {expandedDetailsDuplicateWarning.duplicates.slice(0, 3).map((dup, idx) => (
                                                <li key={idx}>
                                                  {dup.title || dup.name} (ID: {dup.productId || dup.id})
                                                </li>
                                              ))}
                                              {expandedDetailsDuplicateWarning.duplicates.length > 3 && (
                                                <li>... và {expandedDetailsDuplicateWarning.duplicates.length - 3} sản phẩm khác</li>
                                              )}
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Số km</p>
                                    <p className="font-medium">{product.mileage}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Tình trạng</p>
                                    <p className="font-medium">{product.condition}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Thời hạn bảo hành</p>
                                    <p className="font-medium">{product.warrantyPeriod || "Chưa cập nhật"}</p>
                                  </div>
                                </div>
                              </>
                            )}

                            <div>
                              <p className="text-sm text-gray-500">Mô tả</p>
                              <p className="font-medium text-gray-700">{product.description}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Người bán</p>
                                <p className="font-medium">{product.sellerName}</p>
                              </div>
                              {product.sellerPhone && product.sellerPhone !== "N/A" && (
                                <div>
                                  <p className="text-sm text-gray-500">Số điện thoại</p>
                                  <p className="font-medium">{product.sellerPhone}</p>
                                </div>
                              )}
                              {product.sellerEmail && product.sellerEmail !== "N/A" && (
                                <div>
                                  <p className="text-sm text-gray-500">Email</p>
                                  <p className="font-medium">{product.sellerEmail}</p>
                                </div>
                              )}
                            </div>

                            {product.rejectionReason && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800 font-medium">Lý do từ chối:</p>
                                <p className="text-sm text-red-700 mt-1">{product.rejectionReason}</p>
                              </div>
                            )}

                            {/* Show cancellation reason if viewing from cancelled orders */}
                            {cancelledOrderContext && cancelledOrderContext.cancellationReason && (() => {
                              // ✅ Clean cancellationReason: Remove emoji icons only
                              let cleanReason = cancelledOrderContext.cancellationReason;
                              cleanReason = cleanReason.replace(/[✅⚠️]/g, '').trim();
                              
                              return (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                                  <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm text-red-800 font-medium mb-1">Lý do hủy giao dịch:</p>
                                      <p className="text-sm text-red-700 whitespace-pre-line">{cleanReason}</p>
                                      {cancelledOrderContext.CancelledDate && (
                                        <p className="text-xs text-red-600 mt-2">
                                          Ngày hủy: {formatDate(cancelledOrderContext.CancelledDate)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex items-center justify-end space-x-3">
                        <button
                          onClick={closeDetailsModal}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Đóng
                        </button>
                        {(product.status === "pending" || product.status === "Re-submit" || product.status === "Draft") && (
                          <>
                            <button
                              onClick={() => {
                                closeDetailsModal();
                                handleApprove(product.id);
                              }}
                              disabled={processingIds.has(product.id)}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {processingIds.has(product.id) ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => {
                                closeDetailsModal();
                                openRejectModal(product);
                              }}
                              disabled={processingIds.has(product.id)}
                              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}


        {/* Reject Modal */}
        <RejectProductModal
          isOpen={rejectModal.isOpen}
          onClose={closeRejectModal}
          product={rejectModal.product}
          onReject={handleReject}
        />

        {/* Product Detail Modal */}
        {showModal && selectedListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết sản phẩm</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Images */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h4>
                    {selectedListing.images && selectedListing.images.length > 0 ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={selectedListing.images[currentImageIndex]}
                            alt={selectedListing.title}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        </div>
                        {selectedListing.images.length > 1 && (
                          <div className="flex space-x-2 overflow-x-auto">
                            {selectedListing.images.map((img, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                                  }`}
                              >
                                <img
                                  src={img}
                                  alt={`${selectedListing.title} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Car className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h4>
                    <div className="space-y-4">
                      {/* Row 1: Loại sản phẩm & Trạng thái */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-500 mb-1">Loại sản phẩm</p>
                          <p className="font-medium">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {selectedListing.productType === "Vehicle" || selectedListing.categoryId === 1 ? "Xe điện" : "Pin"}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                          <p className="font-medium">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${(selectedListing.status || "").toLowerCase() === "pending" || (selectedListing.status || "").toLowerCase() === "đang chờ duyệt"
                                ? "bg-yellow-100 text-yellow-800"
                                : (selectedListing.status || "").toLowerCase() === "approved" || (selectedListing.status || "").toLowerCase() === "đã duyệt"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                              {selectedListing.status || "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Row 2: Thương hiệu & Model */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-500 mb-1">Thương hiệu</p>
                          <p className="font-medium">{selectedListing.brand || "N/A"}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-500 mb-1">Model</p>
                          <p className="font-medium">{selectedListing.model || "N/A"}</p>
                        </div>
                      </div>

                      {/* Vehicle-specific details - Only show for vehicles */}
                      {((selectedListing.productType && selectedListing.productType.toLowerCase() === "vehicle") || selectedListing.categoryId === 1) && (
                        <>
                          {/* Row 3: Năm sản xuất & Giá */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 mb-1">Năm sản xuất</p>
                              <p className="font-medium">{
                                (selectedListing.manufactureYear && selectedListing.manufactureYear !== "N/A" && selectedListing.manufactureYear !== null && selectedListing.manufactureYear !== undefined)
                                  ? selectedListing.manufactureYear
                                  : (selectedListing.year && selectedListing.year !== "N/A" && selectedListing.year !== null && selectedListing.year !== undefined)
                                    ? selectedListing.year
                                    : "N/A"
                              }</p>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 mb-1">Giá</p>
                              <p className="font-medium text-green-600">{formatPrice(selectedListing.price || 0)}</p>
                            </div>
                          </div>

                          {/* Row 4: Biển số & Số km */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 mb-1">Biển số</p>
                              <p className="font-medium">{selectedListing.licensePlate || selectedListing.license_plate || "N/A"}</p>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 mb-1">Số km</p>
                              <p className="font-medium">{selectedListing.mileage || "N/A"}</p>
                            </div>
                          </div>

                          {/* Row 5: Tình trạng & Thời hạn bảo hành */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 mb-1">Tình trạng</p>
                              <p className="font-medium">{selectedListing.condition || "N/A"}</p>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 mb-1">Thời hạn bảo hành</p>
                              <p className="font-medium">{selectedListing.warrantyPeriod || selectedListing.warranty_period || "Chưa cập nhật"}</p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Battery Product Details - Thông số kỹ thuật pin */}
                      {selectedListing.productType && selectedListing.productType.toLowerCase() !== "vehicle" && selectedListing.categoryId !== 1 && (
                        <>
                          {/* Row 3: Giá - Full width for battery */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-500 mb-1">Giá</p>
                              <p className="font-medium text-green-600">{formatPrice(selectedListing.price || 0)}</p>
                            </div>
                          </div>

                          {/* Thông số kỹ thuật pin */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-base font-semibold text-gray-900 mb-4">Thông số kỹ thuật</h5>

                            {/* Row 1: Loại pin & Tình trạng pin */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">Loại pin</p>
                                <p className="font-medium">{selectedListing.batteryType || selectedListing.BatteryType || "N/A"}</p>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">Tình trạng pin</p>
                                <p className="font-medium">{selectedListing.batteryHealth || selectedListing.BatteryHealth || "N/A"}</p>
                              </div>
                            </div>

                            {/* Row 2: Dung lượng & Điện áp */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">Dung lượng</p>
                                <p className="font-medium">{selectedListing.capacity || selectedListing.Capacity || "N/A"}</p>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">Điện áp</p>
                                <p className="font-medium">{selectedListing.voltage || selectedListing.Voltage || "N/A"}</p>
                              </div>
                            </div>

                            {/* Row 3: BMS & Loại cell */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">BMS</p>
                                <p className="font-medium">{selectedListing.bms || selectedListing.Bms || selectedListing.BMS || "N/A"}</p>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">Loại cell</p>
                                <p className="font-medium">{selectedListing.cellType || selectedListing.CellType || "N/A"}</p>
                              </div>
                            </div>

                            {/* Row 4: Số chu kỳ sạc & Thời hạn bảo hành */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">Số chu kỳ sạc</p>
                                <p className="font-medium">{(selectedListing.cycleCount !== null && selectedListing.cycleCount !== undefined) ? selectedListing.cycleCount : (selectedListing.CycleCount !== null && selectedListing.CycleCount !== undefined) ? selectedListing.CycleCount : "N/A"}</p>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-500 mb-1">Thời hạn bảo hành</p>
                                <p className="font-medium">{selectedListing.warrantyPeriod || selectedListing.warranty_period || selectedListing.WarrantyPeriod || "Chưa cập nhật"}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Row 6: Mô tả - Full width */}
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-500 mb-1">Mô tả</p>
                        <p className="font-medium text-gray-700">{selectedListing.description || "Chưa có mô tả"}</p>
                      </div>

                      {/* Row 7: Người bán - Full width */}
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-500 mb-1">Người bán</p>
                        <p className="font-medium">{selectedListing.sellerName || "Unknown"}</p>
                      </div>

                      {/* Row 8: Số điện thoại - Full width */}
                      {selectedListing.sellerPhone && selectedListing.sellerPhone !== "N/A" && (
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                          <p className="font-medium">{selectedListing.sellerPhone}</p>
                        </div>
                      )}

                      {/* Row 9: Email - Full width */}
                      {selectedListing.sellerEmail && selectedListing.sellerEmail !== "N/A" && (
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-500 mb-1">Email</p>
                          <p className="font-medium">{selectedListing.sellerEmail}</p>
                        </div>
                      )}
                    </div>

                    {/* Duplicate License Plate Warning */}
                    {duplicateLicensePlateWarning.hasDuplicate && (
                      <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-900 mb-1">
                              ⚠️ Biển số xe đã trùng
                            </p>
                            <p className="text-xs text-yellow-800 mb-2">
                              Biển số "{selectedListing.licensePlate || selectedListing.license_plate}" đã được sử dụng bởi {duplicateLicensePlateWarning.duplicates.length} sản phẩm khác:
                            </p>
                            <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                              {duplicateLicensePlateWarning.duplicates.slice(0, 3).map((dup, idx) => (
                                <li key={idx}>
                                  {dup.title || dup.name} (ID: {dup.productId || dup.id})
                                </li>
                              ))}
                              {duplicateLicensePlateWarning.duplicates.length > 3 && (
                                <li>... và {duplicateLicensePlateWarning.duplicates.length - 3} sản phẩm khác</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inspection Images Section */}
                    {selectedListing.inspectionImages && selectedListing.inspectionImages.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <Camera className="h-5 w-5 mr-2 text-blue-600" />
                          Hình ảnh kiểm định của Admin
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedListing.inspectionImages.map((img, index) => (
                            <div key={index} className="relative">
                              <img
                                src={img.url}
                                alt={img.description || `Hình kiểm định ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-blue-200"
                              />
                              <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                Admin
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      {/* Show inspection button only for products with Requested verification status */}
                      {selectedListing.verificationStatus === "Requested" && (
                        <button
                          onClick={() => handleStartInspection(selectedListing.id)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Camera className="h-5 w-5" />
                          <span>Bắt đầu kiểm định</span>
                        </button>
                      )}

                      {/* Show button for testing - temporarily show for all products */}
                      {selectedListing.verificationStatus !== "Requested" && selectedListing.verificationStatus !== "InProgress" && selectedListing.verificationStatus !== "Verified" && (
                        <button
                          onClick={() => {
                            // Temporarily change verification status to Requested for testing
                            const updatedListing = { ...selectedListing, verificationStatus: "Requested" };
                            setSelectedListing(updatedListing);
                            showToast("Đã chuyển trạng thái thành 'Yêu cầu kiểm định' để test", "success");
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          <Camera className="h-5 w-5" />
                          <span>Test: Chuyển thành yêu cầu kiểm định</span>
                        </button>
                      )}

                      {/* Show completion button for products with InProgress verification status */}
                      {selectedListing.verificationStatus === "InProgress" && (
                        <button
                          onClick={() => handleCompleteInspection(selectedListing.id)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-5 w-5" />
                          <span>Hoàn thành kiểm định</span>
                        </button>
                      )}

                      {/* Show status for verified products */}
                      {selectedListing.verificationStatus === "Verified" && (
                        <div className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span>Đã kiểm định</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                  {((selectedListing.status || "").toLowerCase() === "pending" ||
                    (selectedListing.status || "").toLowerCase() === "re-submit" ||
                    (selectedListing.status || "").toLowerCase() === "draft") && (
                      <>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            handleApprove(selectedListing.id);
                          }}
                          disabled={processingIds.has(selectedListing.id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {processingIds.has(selectedListing.id) ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span>Duyệt</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            setRejectModal({ isOpen: true, product: selectedListing });
                          }}
                          disabled={processingIds.has(selectedListing.id)}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Từ chối</span>
                        </button>
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Modal */}
        {showInspectionModal && currentInspectionProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Kiểm định xe: {currentInspectionProduct.title}
                  </h2>
                  <button
                    onClick={() => setShowInspectionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Editable Product Info Form */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Thông tin xe - Kiểm tra & Chỉnh sửa</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Title */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tiêu đề
                        </label>
                        <input
                          type="text"
                          value={currentInspectionProduct.title || ''}
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Brand */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thương hiệu
                        </label>
                        <input
                          type="text"
                          value={currentInspectionProduct.brand || ''}
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, brand: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Model */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          value={currentInspectionProduct.model || ''}
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, model: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* License Plate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Biển số xe
                        </label>
                        <input
                          type="text"
                          value={currentInspectionProduct.licensePlate || ''}
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, licensePlate: e.target.value })}
                          placeholder="VD: 30A-12345"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Mileage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số km đã đi
                        </label>
                        <input
                          type="number"
                          value={
                            currentInspectionProduct.mileage &&
                              currentInspectionProduct.mileage !== 'N/A' &&
                              currentInspectionProduct.mileage !== 0
                              ? currentInspectionProduct.mileage
                              : ''
                          }
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, mileage: e.target.value ? parseInt(e.target.value) : '' })}
                          placeholder="VD: 50000"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Manufacture Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Năm sản xuất
                        </label>
                        <input
                          type="number"
                          value={
                            currentInspectionProduct.manufactureYear &&
                              currentInspectionProduct.manufactureYear !== 'N/A' &&
                              currentInspectionProduct.manufactureYear !== 0
                              ? currentInspectionProduct.manufactureYear
                              : currentInspectionProduct.year &&
                                currentInspectionProduct.year !== 'N/A' &&
                                currentInspectionProduct.year !== 0
                                ? currentInspectionProduct.year
                                : ''
                          }
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, manufactureYear: e.target.value ? parseInt(e.target.value) : '' })}
                          placeholder="VD: 2023"
                          min="2000"
                          max="2030"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Condition */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tình trạng
                        </label>
                        <input
                          type="text"
                          value={currentInspectionProduct.condition || ''}
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, condition: e.target.value })}
                          placeholder="VD: Xuất sắc, Tốt, Khá, Kém..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giá (VNĐ)
                        </label>
                        <input
                          type="number"
                          value={currentInspectionProduct.price || ''}
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Description */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả
                        </label>
                        <textarea
                          value={currentInspectionProduct.description || ''}
                          onChange={(e) => setCurrentInspectionProduct({ ...currentInspectionProduct, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Hướng dẫn:</strong> Kiểm tra và chỉnh sửa thông tin xe nếu cần. Thông tin sẽ được cập nhật khi bạn hoàn thành kiểm định.
                      </p>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Upload hình ảnh kiểm định</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Kéo thả hình ảnh kiểm định xe vào đây hoặc click để chọn file
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files);

                          // ✅ Thêm watermark ngay khi upload
                          console.log(`🎨 Adding watermarks to ${files.length} images...`);
                          for (const file of files) {
                            try {
                              // Add watermark to image
                              const watermarkedFile = await addWatermarkToImage(file);

                              // Create preview URL from watermarked image
                              const imageUrl = URL.createObjectURL(watermarkedFile);

                              // Add to state
                              setInspectionImages(prev => [...prev, imageUrl]);
                              setInspectionFiles(prev => [...prev, watermarkedFile]);

                              console.log(`  ✓ Watermarked and added: ${file.name}`);
                            } catch (error) {
                              console.error(`  ❌ Failed to watermark ${file.name}:`, error);
                              showToast(`Không thể thêm watermark vào ${file.name}`, "error");
                            }
                          }
                        }}
                        className="hidden"
                        id="inspection-image-upload"
                      />
                      <label
                        htmlFor="inspection-image-upload"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
                      >
                        Chọn hình ảnh
                      </label>
                    </div>

                    {/* Display uploaded images */}
                    {inspectionImages.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-medium mb-2">Hình ảnh đã upload:</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {inspectionImages.map((imageUrl, index) => (
                            <div key={index} className="relative">
                              <img
                                src={imageUrl}
                                alt={`Inspection ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => {
                                  setInspectionImages(prev => prev.filter((_, i) => i !== index));
                                  setInspectionFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        if (inspectionImages.length > 0) {
                          if (window.confirm("Bạn có chắc muốn hủy kiểm định? Hình ảnh đã upload sẽ bị mất và trạng thái xe không thay đổi.")) {
                            setShowInspectionModal(false);
                            setInspectionImages([]);
                            setInspectionFiles([]);
                            setCurrentInspectionProduct(null);
                            showToast("Đã hủy kiểm định. Trạng thái xe không thay đổi.", "info");
                          }
                        } else {
                          setShowInspectionModal(false);
                          setInspectionImages([]);
                          setInspectionFiles([]);
                          setCurrentInspectionProduct(null);
                          showToast("Đã hủy kiểm định. Trạng thái xe không thay đổi.", "info");
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={async () => {
                        if (inspectionImages.length === 0) {
                          showToast("Vui lòng upload ít nhất một hình ảnh kiểm định!", "error");
                          return;
                        }

                        // Sử dụng hàm handleCompleteInspection mới
                        await handleCompleteInspection(currentInspectionProduct.id);
                      }}
                      disabled={inspectionImages.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Hoàn thành kiểm định</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Management Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Thống kê các giao dịch trong quá trình thanh toán
              </h2>

              {/* Transaction Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <button
                  onClick={() => setTransactionStatusFilter("pending")}
                  className={`bg-yellow-50 border-2 rounded-lg p-4 text-left transition-all hover:shadow-md ${transactionStatusFilter === "pending"
                      ? "border-yellow-400 shadow-md"
                      : "border-yellow-200 hover:border-yellow-300"
                    }`}
                >
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Đã thanh toán cọc</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {orders.filter(order => {
                          const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || '').toLowerCase();
                          return status === 'pending' || status === 'processing' || status === 'depositpaid' ||
                            status === 'deposited' || status === 'confirmed';
                        }).length}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setTransactionStatusFilter("completed")}
                  className={`bg-green-50 border-2 rounded-lg p-4 text-left transition-all hover:shadow-md ${transactionStatusFilter === "completed"
                      ? "border-green-400 shadow-md"
                      : "border-green-200 hover:border-green-300"
                    }`}
                >
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Đã hoàn tất</p>
                      <p className="text-2xl font-bold text-green-600">
                        {orders.filter(order => {
                          const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || '').toLowerCase();
                          return status === 'completed';
                        }).length}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setTransactionStatusFilter("rejected")}
                  className={`bg-red-50 border-2 rounded-lg p-4 text-left transition-all hover:shadow-md ${transactionStatusFilter === "rejected"
                      ? "border-red-400 shadow-md"
                      : "border-red-200 hover:border-red-300"
                    }`}
                >
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Đã từ chối</p>
                      <p className="text-2xl font-bold text-red-600">
                        {orders.filter(order => {
                          const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || '').toLowerCase();
                          return status === 'cancelled' || status === 'failed' || status === 'canceled' || status === 'rejected';
                        }).length}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Filter Reset Button */}
              {transactionStatusFilter !== "all" && (
                <div className="mb-4">
                  <button
                    onClick={() => setTransactionStatusFilter("all")}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Hiển thị tất cả
                  </button>
                </div>
              )}

              {/* Orders List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách đơn hàng</h3>
                {filteredOrders.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người mua</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiền đặt cọc</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiền còn lại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hợp đồng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredOrders.map((order) => {
                            const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || "").toLowerCase();
                            const orderId = order.orderId || order.OrderId || order.id || order.Id;
                            const hasContract = order.contractUrl || order.ContractUrl;
                            return (
                              <tr key={orderId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  #{orderId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {order.buyerName || order.BuyerName || "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {(() => {
                                    const product = order.Product || order.product;
                                    if (product) {
                                      const brand = product.Brand || product.brand || "";
                                      const model = product.Model || product.model || "";
                                      if (brand && model) {
                                        return `${brand} ${model}`;
                                      } else if (brand) {
                                        return brand;
                                      } else if (model) {
                                        return model;
                                      }
                                    }
                                    return order.productName || order.ProductName || "N/A";
                                  })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatPrice(order.depositAmount || order.DepositAmount || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatPrice((order.totalAmount || order.TotalAmount || 0) - (order.depositAmount || order.DepositAmount || 0))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${status === 'completed' ? 'bg-green-100 text-green-800' :
                                      status === 'pending' || status === 'processing' || status === 'depositpaid' || status === 'deposited' ? 'bg-yellow-100 text-yellow-800' :
                                        status === 'cancelled' || status === 'canceled' || status === 'rejected' || status === 'failed' ? 'bg-red-100 text-red-800' :
                                          status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {getOrderStatusText(status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {hasContract ? (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                      Đã có
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                      Chưa có
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {(() => {
                                    // Try multiple date fields from backend
                                    const dateFields = [
                                      order.CreatedDate, // Backend returns this (PascalCase)
                                      order.createdDate,
                                      order.createdAt,
                                      order.CreatedAt,
                                      order.orderDate,
                                      order.OrderDate,
                                      order.dateCreated,
                                      order.DateCreated
                                    ];

                                    const validDate = dateFields.find(date => {
                                      if (!date) return false;
                                      try {
                                        const dateObj = new Date(date);
                                        return !isNaN(dateObj.getTime());
                                      } catch {
                                        return false;
                                      }
                                    });

                                    return validDate ? formatDateTime(validDate) : 'Chưa có';
                                  })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex flex-col space-y-2">
                                    <button
                                      onClick={async () => {
                                        setOrderDetailModal({ isOpen: true, order, orderDetails: null, loading: true });
                                        try {
                                          const details = await apiRequest(`/api/Order/details/${orderId}`);
                                          setOrderDetailModal({ isOpen: true, order, orderDetails: details, loading: false });
                                        } catch (error) {
                                          console.error("Error loading order details:", error);
                                          showToast({
                                            title: "Lỗi",
                                            description: "Không thể tải chi tiết đơn hàng",
                                            type: "error",
                                          });
                                          setOrderDetailModal({ isOpen: false, order: null, orderDetails: null, loading: false });
                                        }
                                      }}
                                      className="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center space-x-1 text-xs"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>Xem chi tiết</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {transactionStatusFilter !== "all"
                        ? `Không có đơn hàng nào với trạng thái "${transactionStatusFilter === "pending" ? "Đã thanh toán cọc" : transactionStatusFilter === "completed" ? "Đã hoàn tất" : "Đã từ chối"}"`
                        : "Chưa có đơn hàng nào"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cancelled Orders List */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quản lý giao dịch (Đã bị từ chối)</h3>
              {(() => {
                // Debug: Log all orders to see what we have
                console.log('🔍 [ADMIN] Total orders:', orders.length);
                console.log('🔍 [ADMIN] All orders statuses:', orders.map(o => ({
                  id: o.orderId || o.OrderId || o.id,
                  status: o.status || o.orderStatus || o.Status || o.OrderStatus,
                  statusLower: (o.status || o.orderStatus || o.Status || o.OrderStatus || '').toLowerCase()
                })));

                const cancelledOrders = orders.filter(order => {
                  const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || '').toLowerCase();
                  // ✅ Show ALL cancelled/failed orders, regardless of whether they have cancellation reason or refund option
                  return status === 'cancelled' || status === 'failed' || status === 'canceled';
                });

                console.log('🔍 [ADMIN] Cancelled orders found:', cancelledOrders.length);

                if (cancelledOrders.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Chưa có giao dịch nào bị từ chối</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cancelledOrders.map((order) => {
                      // Find the product for this order
                      const productId = order.productId || order.ProductId || order.product?.productId || order.product?.id;
                      const product = allListings.find(p => (p.id || p.productId) == productId);

                      // ✅ Parse refund option from CancellationReason if not available as separate field
                      let cancellationReason = order.cancellationReason || order.CancellationReason || '';
                      let refundOption = order.refundOption || order.RefundOption;
                      
                      // If refundOption not available, parse from CancellationReason
                      if (!refundOption && cancellationReason) {
                        if (cancellationReason.includes('không được hoàn tiền') || 
                            cancellationReason.includes('không hoàn tiền') ||
                            cancellationReason.toLowerCase().includes('no refund')) {
                          refundOption = 'no_refund';
                        } else if (cancellationReason.includes('hoàn tiền') || 
                                   cancellationReason.includes('hoàn lại') ||
                                   cancellationReason.toLowerCase().includes('refund')) {
                          refundOption = 'refund';
                        }
                      }

                      // ✅ Clean cancellationReason: Remove emoji icons (✅⚠️) only
                      if (cancellationReason) {
                        // Remove emoji icons
                        cancellationReason = cancellationReason.replace(/[✅⚠️]/g, '').trim();
                      }

                      // Debug: Log order object to see available fields
                      console.log('🔍 Cancelled order:', {
                        orderId: order.orderId || order.OrderId || order.id,
                        status: order.status || order.orderStatus,
                        cancellationReason: cancellationReason,
                        refundOption: refundOption,
                        parsedFromReason: !order.refundOption && !order.RefundOption,
                        adminNotes: order.adminNotes,
                        allKeys: Object.keys(order)
                      });

                      return (
                        <div key={order.orderId || order.OrderId || order.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              {product && product.images && product.images.length > 0 ? (
                                <img
                                  className="w-full h-full object-cover"
                                  src={product.images[0]}
                                  alt={product.title || product.name || 'Sản phẩm'}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-full h-full rounded-lg flex items-center justify-center bg-red-200"
                                style={{ display: (!product || !product.images || product.images.length === 0) ? 'flex' : 'none' }}
                              >
                                <XCircle className="h-6 w-6 text-red-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 line-clamp-2">
                                {product ? (product.title || product.name || 'Sản phẩm không tìm thấy') : 'Sản phẩm không tìm thấy'}
                              </h4>
                              <p className="text-lg font-bold text-red-600 mt-1">
                                {product ? formatPrice(product.price) : order.totalAmount ? formatPrice(order.totalAmount) : 'N/A'}
                              </p>
                              <div className="flex items-center mt-2">
                                <XCircle className="h-4 w-4 text-red-600 mr-1" />
                                <span className="text-sm text-red-600">Đã từ chối</span>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                <p>Order ID: {order.orderId || order.OrderId || order.id}</p>
                                {(() => {
                                  // Try to find a valid date from various possible fields
                                  // Priority: CancelledDate (backend sets this when admin rejects) > cancellationDate > updatedDate/updatedAt
                                  const dateFields = [
                                    order.CancelledDate, // Backend sets this when admin rejects (PascalCase)
                                    order.cancelledDate, // camelCase variant
                                    order.cancellationDate,
                                    order.CancellationDate,
                                    // If order is cancelled, updatedDate/updatedAt should reflect when it was cancelled
                                    order.updatedDate,
                                    order.updatedAt,
                                    order.UpdatedDate,
                                    order.modifiedDate,
                                    order.modifiedAt
                                  ];

                                  const validDate = dateFields.find(date => {
                                    if (!date) return false;
                                    const dateObj = new Date(date);
                                    return !isNaN(dateObj.getTime());
                                  });

                                  if (validDate) {
                                    return <p>Ngày hủy: {formatDate(validDate)}</p>;
                                  }
                                  // If no date found but order has cancellation reason, 
                                  // it means it was recently cancelled but date not yet synced
                                  // Show "Chưa xác định" for now
                                  return <p>Ngày hủy: Chưa xác định</p>;
                                })()}
                              </div>
                              {/* Cancellation Reason and Refund Status */}
                              {(cancellationReason || refundOption) && (
                                <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      {cancellationReason && (
                                        <>
                                          <p className="text-xs font-medium text-red-900 mb-1">Lý do từ chối:</p>
                                          <p className="text-xs text-red-800 mb-2 whitespace-pre-line">{cancellationReason}</p>
                                        </>
                                      )}
                                      {/* Refund Status - Always show if available */}
                                      {refundOption && (
                                        <div className={cancellationReason ? "mt-2 pt-2 border-t border-red-300" : ""}>
                                          <p className="text-xs font-medium text-red-900 mb-1">Trạng thái hoàn tiền:</p>
                                          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${refundOption === 'refund'
                                              ? 'bg-green-100 text-green-800 border border-green-300'
                                              : 'bg-gray-100 text-gray-800 border border-gray-300'
                                            }`}>
                                            {refundOption === 'refund' ? (
                                              <>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Hoàn tiền
                                              </>
                                            ) : (
                                              <>
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Không hoàn tiền
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {product && (
                            <div className="mt-4">
                              <button
                                onClick={() => handleViewDetails(product, order)}
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                              >
                                Xem chi tiết sản phẩm
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Reports Management Tab */}
        {activeTab === "reports" && (
          <AdminReports />
        )}

        {/* Transaction Failure Reason Modal */}
        {transactionFailureModal.isOpen && (
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
                      Đánh dấu giao dịch không thành công
                    </h3>
                    <p className="text-sm text-gray-600">
                      Vui lòng nhập lý do để hoàn tiền cho người mua
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransactionFailureModal({ isOpen: false, product: null, reasonCode: '', reasonNote: '' })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Product Info */}
              {transactionFailureModal.product && (
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start space-x-4">
                    {transactionFailureModal.product.images && transactionFailureModal.product.images.length > 0 && (
                      <img
                        src={transactionFailureModal.product.images[0]}
                        alt={transactionFailureModal.product.title || transactionFailureModal.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {transactionFailureModal.product.title || transactionFailureModal.product.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ID: {transactionFailureModal.product.id || transactionFailureModal.product.productId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Giá: {formatPrice(transactionFailureModal.product.price)}
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
                    onClick={() => setTransactionFailureModal({ isOpen: false, product: null, reasonCode: '', reasonNote: '', refundOption: 'refund' })}
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

                      const productId = transactionFailureModal.product?.id || transactionFailureModal.product?.productId;
                      if (!productId) {
                        showToast({
                          title: 'Lỗi',
                          description: 'Không tìm thấy thông tin sản phẩm',
                          type: 'error',
                        });
                        return;
                      }

                      // Close modal and proceed with failure
                      setTransactionFailureModal({ isOpen: false, product: null, reasonCode: '', reasonNote: '', refundOption: 'refund' });
                      await handleMarkTransactionFailed(productId, {
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
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${(orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                                (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'pending' || (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'processing' || (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'depositpaid' || (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'deposited' ? 'bg-yellow-100 text-yellow-800' :
                                  (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'cancelled' || (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'canceled' || (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'rejected' || (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'failed' ? 'bg-red-100 text-red-800' :
                                    (orderDetailModal.orderDetails.orderStatus || '').toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800' :
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
                          <span className="text-sm">Chưa có hợp đồng. Vui lòng đợi Staff gửi hợp đồng.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Only show for orders that can be confirmed */}
                    {(() => {
                      const orderStatus = (orderDetailModal.orderDetails.orderStatus || '').toLowerCase();
                      const canConfirm = orderStatus !== 'completed' && orderStatus !== 'cancelled';
                      const hasContract = !!orderDetailModal.orderDetails.contractUrl;

                      if (!canConfirm) return null;

                      return (
                        <div className="flex space-x-3 pt-4 border-t border-gray-200">
                          <button
                            disabled={!hasContract}
                            onClick={async () => {
                              // Prevent action if no contract
                              if (!hasContract) {
                                showToast({
                                  title: "Không thể xác nhận",
                                  description: "Vui lòng đợi staff gửi hợp đồng trước khi xác nhận giao dịch",
                                  type: "warning",
                                });
                                return;
                              }

                              if (!window.confirm('Bạn có chắc muốn xác nhận giao dịch này đã hoàn tất thành công?')) {
                                return;
                              }

                              try {
                                showToast({
                                  title: 'Đang xử lý...',
                                  description: 'Đang xác nhận giao dịch',
                                  type: 'info',
                                });

                                // LOGIC: When admin confirms order:
                                // 1. Update order status to "Completed"
                                // 2. Update product status from "Reserved" → "Sold" via admin-confirm endpoint

                                // First, update order status to Completed
                                try {
                                  await apiRequest(`/api/Order/${orderDetailModal.orderDetails.orderId}/status`, {
                                    method: "PUT",
                                    body: { Status: "Completed" },
                                  });
                                  console.log(`✅ [MODAL CONFIRM] Order ${orderDetailModal.orderDetails.orderId} status updated to Completed`);
                                } catch (orderError) {
                                  console.error(`❌ [MODAL CONFIRM] Error updating order status:`, orderError);
                                  showToast({
                                    title: "Lỗi",
                                    description: `Không thể cập nhật order status: ${orderError.message}`,
                                    type: "error",
                                  });
                                  return; // Stop if order update fails
                                }

                                // Try multiple sources for productId from order details
                                let productId = orderDetailModal.orderDetails.productId ||
                                  orderDetailModal.orderDetails.ProductId ||
                                  orderDetailModal.orderDetails.product?.productId ||
                                  orderDetailModal.orderDetails.product?.ProductId ||
                                  orderDetailModal.orderDetails.product?.id;

                                console.log(`🔍 [MODAL CONFIRM] Order confirmation data:`, {
                                  orderId: orderDetailModal.orderDetails.orderId,
                                  productId: productId,
                                  orderDetails: orderDetailModal.orderDetails
                                });

                                // Use the dedicated admin-confirm endpoint to update product status
                                if (productId) {
                                  try {
                                    console.log(`🔄 [MODAL CONFIRM] Calling /api/Payment/admin-confirm with ProductId: ${productId}...`);
                                    const acceptResponse = await apiRequest(`/api/Payment/admin-confirm`, {
                                      method: "POST",
                                      body: { ProductId: productId },
                                    });
                                    console.log(`✅ [MODAL CONFIRM] Admin confirm response:`, acceptResponse);

                                    // Verify the update was successful
                                    if (acceptResponse?.newStatus?.toLowerCase() === "sold" || acceptResponse?.productStatus?.toLowerCase() === "sold") {
                                      console.log(`✅ [MODAL CONFIRM] SUCCESS: Product ${productId} status is now "Sold"!`);
                                    } else {
                                      console.warn(`⚠️ [MODAL CONFIRM] Product status may not be updated correctly. Response:`, acceptResponse);
                                    }
                                  } catch (acceptError) {
                                    console.error(`❌ [MODAL CONFIRM] Error calling admin-confirm:`, acceptError);
                                    showToast({
                                      title: "Cảnh báo",
                                      description: `Không thể cập nhật product status: ${acceptError.message}`,
                                      type: "warning",
                                    });
                                  }
                                } else {
                                  console.error(`❌ [MODAL CONFIRM] CRITICAL: No productId found in order details! Cannot update product status.`);
                                  showToast({
                                    title: "Cảnh báo",
                                    description: `Không tìm thấy ProductId trong order details. Order đã được cập nhật nhưng product status chưa được cập nhật.`,
                                    type: "warning",
                                  });
                                }

                                // Clear cache to force fresh data reload
                                try {
                                  localStorage.removeItem('admin_cached_processed_listings');
                                  localStorage.removeItem('admin_cached_users');
                                  localStorage.removeItem('admin_cached_products');
                                  localStorage.removeItem('admin_cached_timestamp');
                                  localStorage.removeItem('admin_cached_orders');
                                  console.log('✅ Cleared admin cache (including products cache)');
                                } catch (cacheError) {
                                  console.warn('⚠️ Could not clear cache:', cacheError);
                                }

                                showToast({
                                  title: "Thành công",
                                  description: "Đã xác nhận giao dịch thành công",
                                  type: "success",
                                });
                                setOrderDetailModal({ isOpen: false, order: null, orderDetails: null, loading: false });
                                // Reload admin data to reflect status changes
                                await loadAdminData();
                              } catch (error) {
                                console.error("Error confirming transaction:", error);
                                showToast({
                                  title: "Lỗi",
                                  description: error.message || "Không thể xác nhận giao dịch",
                                  type: "error",
                                });
                              }
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${hasContract
                                ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                            title={!hasContract ? "Vui lòng đợi staff gửi hợp đồng trước khi xác nhận" : "Xác nhận giao dịch thành công"}
                          >
                            <CheckCircle className="h-5 w-5" />
                            <span>Xác nhận giao dịch thành công</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Không thể tải chi tiết đơn hàng
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reason Detail Modal */}
        {showReasonDetailModal && selectedUserForReason && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Chi tiết lý do hạn chế</h2>
                      <p className="text-sm text-gray-600">Thông tin tài khoản bị hạn chế</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowReasonDetailModal(false);
                      setSelectedUserForReason(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin tài khoản</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Họ tên</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedUserForReason.fullName || selectedUserForReason.FullName || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedUserForReason.email || selectedUserForReason.Email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Vai trò</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          const role = (selectedUserForReason.role || selectedUserForReason.Role || 'user').toString().toLowerCase();
                          if (role === 'admin') return 'Quản trị viên';
                          if (role === 'sub_admin' || role === 'staff' || role === 'subadmin') return 'Nhân viên';
                          return 'Người dùng';
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Trạng thái</p>
                      <p className="text-sm font-medium">
                        {(() => {
                          const status = (selectedUserForReason.status || selectedUserForReason.Status || '').toString().toLowerCase();
                          if (status === 'suspended') {
                            return <span className="text-orange-600">Đã tạm khóa</span>;
                          }
                          if (status === 'deleted') {
                            return <span className="text-red-600">Đã xóa</span>;
                          }
                          return <span className="text-green-600">Đang hoạt động</span>;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ngày tạo tài khoản</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedUserForReason.createdAt || selectedUserForReason.CreatedAt
                          ? new Date(selectedUserForReason.createdAt || selectedUserForReason.CreatedAt).toLocaleDateString('vi-VN')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ngày bị hạn chế</p>
                      <p className="text-sm font-medium text-red-600">
                        {selectedUserForReason.statusChangedDate || selectedUserForReason.StatusChangedDate
                          ? new Date(selectedUserForReason.statusChangedDate || selectedUserForReason.StatusChangedDate).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason Details */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Lý do hạn chế
                  </h3>

                  {/* Reason Code */}
                  {(selectedUserForReason.reasonCode || selectedUserForReason.ReasonCode) && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Mã lý do:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          const code = selectedUserForReason.reasonCode || selectedUserForReason.ReasonCode;
                          const status = (selectedUserForReason.status || selectedUserForReason.Status || '').toString().toLowerCase();
                          const list = status === 'deleted' ? deletedReasonOptions : suspendedReasonOptions;
                          const found = list.find(x => x.code === code);
                          return found ? found.label : code;
                        })()}
                      </p>
                    </div>
                  )}

                  {/* Main Reason Text */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Lý do chi tiết:</p>
                    <div className="bg-white rounded p-3 text-sm text-gray-900 whitespace-pre-wrap">
                      {getReasonTextForUser(selectedUserForReason) || 'Không có thông tin'}
                    </div>
                  </div>

                  {/* Additional Note */}
                  {(selectedUserForReason.reasonNote || selectedUserForReason.ReasonNote) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Ghi chú bổ sung:</p>
                      <div className="bg-white rounded p-3 text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedUserForReason.reasonNote || selectedUserForReason.ReasonNote}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      const id = selectedUserForReason.id || selectedUserForReason.Id;
                      if (id) {
                        navigate(`/seller/${id}`);
                        setShowReasonDetailModal(false);
                        setSelectedUserForReason(null);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Xem hồ sơ đầy đủ</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowReasonDetailModal(false);
                      setSelectedUserForReason(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};