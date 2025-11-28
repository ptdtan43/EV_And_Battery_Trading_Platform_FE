import { useState, useEffect } from "react";
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
  ClipboardCheck,
  Camera,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";
import { useToast } from "../contexts/ToastContext";
import { notifyPostApproved, notifyPostRejected } from "../lib/notificationApi";
import { rejectProduct } from "../lib/productApi";
import { RejectProductModal } from "../components/admin/RejectProductModal";
import { updateVerificationStatus, getVerificationRequests } from "../lib/verificationApi";

export const AdminDashboard = () => {
  const { show: showToast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalRevenue: 0,
  });
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [productTypeFilter, setProductTypeFilter] = useState("all"); // all, vehicle, battery
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState(false);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState("listings"); // listings, inspections

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    product: null,
  });

  const getId = (x) => x?.id || x?.productId || x?.Id || x?.listingId;

  // Get inspection requests (vehicles with verificationStatus = Requested or InProgress)
  const getInspectionRequests = () => {
    // Use refreshTrigger to force re-evaluation
    const requests = allListings.filter(listing => 
      listing.productType === "Vehicle" && 
      (listing.verificationStatus === "Requested" || listing.verificationStatus === "InProgress")
    );
    
    console.log('🔍 getInspectionRequests called:', {
      allListingsCount: allListings.length,
      refreshTrigger,
      requestsCount: requests.length,
      requests: requests.map(r => ({ id: r.id, title: r.title, verificationStatus: r.verificationStatus }))
    });
    
    return requests;
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterListings();
  }, [allListings, searchTerm, statusFilter, dateFilter, productTypeFilter]);

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
      }

      try {
        // Load all products from unified API (has productType field)
        const allProducts = await apiRequest("/api/Product");
        listings = Array.isArray(allProducts)
          ? allProducts
          : allProducts?.items || [];
        console.log("✅ Products loaded:", listings);
      } catch (error) {
        console.warn("⚠️ Failed to load products:", error.message);
      }

      try {
        transactions = await apiRequest("/api/Order");
        console.log("✅ Orders loaded:", transactions);
      } catch (error) {
        console.warn("⚠️ Failed to load orders:", error.message);
      }

      console.log("Admin loaded data:", { users, listings, transactions });
      console.log("Listings type:", typeof listings);
      console.log("Listings is array:", Array.isArray(listings));
      console.log("Listings length:", listings?.length);
      console.log("Listings content:", listings);

      const norm = (v) => String(v || "").toLowerCase();
      const mapStatus = (l) => {
        const raw = norm(l?.status || l?.Status);
        console.log(`Mapping status for listing ${l.id}: raw="${raw}"`);
        if (
          raw.includes("draft") ||
          raw.includes("pending") ||
          raw.includes("chờ")
        )
          return "pending";
        if (raw.includes("resubmit") || raw.includes("re-submit"))
          return "resubmit";
        if (
          raw.includes("active") ||
          raw.includes("approve") ||
          raw.includes("duyệt")
        )
          return "approved";
        if (raw.includes("reject") || raw.includes("từ chối"))
          return "rejected";
        if (raw.includes("sold") || raw.includes("đã bán")) return "sold";
        if (
          raw.includes("deleted") ||
          raw.includes("xóa") ||
          raw.includes("đã xóa")
        )
          return "deleted";
        const result = raw || "pending";
        console.log(`Mapped status: "${result}"`);
        return result;
      };

      // Handle different response formats
      let listingsArray = [];
      if (Array.isArray(listings)) {
        listingsArray = listings;
      } else if (listings?.items && Array.isArray(listings.items)) {
        listingsArray = listings.items;
      } else if (listings?.data && Array.isArray(listings.data)) {
        listingsArray = listings.data;
      } else {
        console.warn("Unexpected listings format:", listings);
        listingsArray = [];
      }

      console.log("Processed listings array:", listingsArray);
      console.log("Listings array length:", listingsArray.length);

      // Process all listings with images and seller info (with delay to prevent DbContext conflicts)
      const processedListings = await Promise.all(
        listingsArray.map(async (l, index) => {
          try {
            // Add delay between API calls to prevent DbContext conflicts
            if (index > 0) {
              await new Promise((resolve) => setTimeout(resolve, 100 * index));
            }

            const imagesData = await apiRequest(
              `/api/ProductImage/product/${l.id || l.productId || l.Id}`
            );
            const images = Array.isArray(imagesData)
              ? imagesData
              : imagesData?.items || [];

            // Get seller information
            let seller = null;
            try {
              if (l.sellerId || l.seller_id || l.userId || l.user_id) {
                const sellerId =
                  l.sellerId || l.seller_id || l.userId || l.user_id;
                seller = users.find(
                  (u) => u.id === sellerId || u.userId === sellerId
                );
              }
            } catch (error) {
              console.warn(
                `Failed to get seller info for product ${l.id}:`,
                error
              );
            }

            return {
              ...l,
              status: mapStatus(l),
              images: images.map(
                (img) => img.imageData || img.imageUrl || img.url
              ),
              seller: seller,
            };
          } catch (error) {
            console.warn(`Failed to load images for product ${l.id}:`, error);
            return { ...l, status: mapStatus(l), images: [], seller: null };
          }
        })
      );

      // Filter out deleted products
      const nonDeletedListings = processedListings.filter(
        (l) => l.status !== "deleted"
      );
      console.log(
        `Filtered out ${
          processedListings.length - nonDeletedListings.length
        } deleted products`
      );

      // Sort listings to show newest first (by createdDate or createdAt)
      const sortedListings = nonDeletedListings.sort((a, b) => {
        const dateA = new Date(
          a.createdDate || a.createdAt || a.created_date || 0
        );
        const dateB = new Date(
          b.createdDate || b.createdAt || b.created_date || 0
        );
        return dateB - dateA; // Newest first
      });

      const pending = nonDeletedListings.filter((l) => l.status === "pending");
      const approved = nonDeletedListings.filter(
        (l) => l.status === "approved"
      );
      const rejected = nonDeletedListings.filter(
        (l) => l.status === "rejected"
      );

      const revenue = Array.isArray(transactions)
        ? transactions
            ?.filter((t) => t.status === "completed")
            .reduce(
              (sum, t) => sum + parseFloat(t.totalAmount || t.amount || 0),
              0
            ) || 0
        : 0;

      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalListings: nonDeletedListings.length,
        pendingListings: pending.length,
        approvedListings: approved.length,
        rejectedListings: rejected.length,
        totalRevenue: revenue,
      });

      setAllListings(sortedListings);
    } catch (error) {
      console.error("Error loading admin data:", error);
      console.error("Error details:", error.message, error.status, error.data);

      // Set empty data on error
      setStats({
        totalUsers: 0,
        totalListings: 0,
        pendingListings: 0,
        approvedListings: 0,
        rejectedListings: 0,
        totalRevenue: 0,
      });
      setAllListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = allListings;

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
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    // Product type filter
    if (productTypeFilter !== "all") {
      console.log(
        "🔍 AdminDashboard filtering by productType:",
        productTypeFilter
      );
      filtered = filtered.filter((l) => {
        const matches =
          l.productType?.toLowerCase() === productTypeFilter.toLowerCase();
        console.log(
          `🔍 Product ${l.id}: productType="${l.productType}", filter="${productTypeFilter}", matches=${matches}`
        );
        return matches;
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((l) => {
        const createdDate = new Date(
          l.created_at || l.createdDate || l.createdAt
        );
        switch (dateFilter) {
          case "today":
            return createdDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return createdDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredListings(filtered);
  };

  const handleApprove = async (listingId) => {
    try {
      console.log("Approving listing with ID:", listingId);

      // Use the correct API endpoint: PUT /api/Product/approve/{id}
      await apiRequest(`/api/Product/approve/${listingId}`, {
        method: "PUT",
      });

      console.log("Product approved successfully!");

      // Send notification to the seller
      try {
        // Get listing details to find seller info
        const listing = allListings.find((l) => getId(l) === listingId);
        console.log("🔍 AdminDashboard - Listing found:", listing);
        console.log("🔍 AdminDashboard - Listing sellerId:", listing?.sellerId);
        console.log("🔍 AdminDashboard - Listing title:", listing?.title);

        if (listing && listing.sellerId) {
          console.log(
            "🔔 AdminDashboard - Sending notification to sellerId:",
            listing.sellerId
          );
          const notificationSent = await notifyPostApproved(
            listing.sellerId,
            listing.title || "Bài đăng của bạn"
          );

          if (notificationSent) {
            console.log("✅ Notification sent to seller");
          } else {
            console.log("⚠️ Notification API not available");
          }
        } else {
          console.warn("❌ Could not find listing or sellerId:", {
            listing,
            sellerId: listing?.sellerId,
          });
        }
      } catch (notificationError) {
        console.warn("Could not send notification:", notificationError);
        // Don't block the approve process
      }

      showToast({
        title: "✅ Duyệt bài đăng thành công!",
        description: "Bài đăng đã được phê duyệt và hiển thị trên trang chủ.",
        type: "success",
      });
      setShowModal(false);
      loadAdminData();
    } catch (error) {
      console.error("Error approving listing:", error);
      showToast({
        title: "❌ Lỗi khi duyệt bài đăng",
        description: error.message || "Unknown error",
        type: "error",
      });
    }
  };

  const handleReject = async (productId, rejectionReason) => {
    try {
      console.log("Rejecting product:", productId, "Reason:", rejectionReason);

      await rejectProduct(productId, rejectionReason);

      // Update local state
      setAllListings((prev) =>
        prev.map((item) =>
          getId(item) === productId
            ? {
                ...item,
                status: "rejected",
                verificationStatus: "rejected",
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

  const handleStartInspection = async (productId) => {
    try {
      console.log(`Starting inspection for product ${productId}...`);
      
      // Try multiple API endpoints to update verification status
      let response = null;
      
      try {
        // Try the verify endpoint first
        response = await apiRequest(`/api/Product/verify/${productId}`, {
          method: 'PUT'
        });
        console.log("✅ Used verify endpoint:", response);
      } catch (verifyError) {
        console.warn("⚠️ Verify endpoint failed, trying direct product update...");
        
        try {
          // Fallback: try direct product update
          response = await apiRequest(`/api/Product/${productId}`, {
            method: 'PUT',
            body: {
              verificationStatus: 'Verified'
            }
          });
          console.log("✅ Used direct product update:", response);
        } catch (directError) {
          console.warn("⚠️ Direct update failed, trying alternative approach...");
          
          // Alternative: try with different field name
          response = await apiRequest(`/api/Product/${productId}`, {
            method: 'PUT',
            body: {
              inspectionRequested: false,
              inspectionCompleted: true
            }
          });
          console.log("✅ Used alternative approach:", response);
        }
      }
      
      // Update local state to reflect verification
      setAllListings((prev) =>
        prev.map((item) =>
          getId(item) === productId
            ? {
                ...item,
                verificationStatus: 'Verified'
              }
            : item
        )
      );
      
      showToast({
        title: "✅ Hoàn thành kiểm định",
        description: "Xe đã được kiểm định thành công. Người bán sẽ không cần thanh toán thêm.",
        type: "success",
      });

      // Navigate to edit page for this product (optional - for uploading inspection images)
      window.open(`/listing/${productId}/edit`, '_blank');
      
      // Reload all data to reflect changes
      await loadAdminData();
      
      // Force re-render by updating refresh trigger
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Failed to start inspection:", error);
      showToast({
        title: "❌ Lỗi",
        description: "Không thể bắt đầu kiểm định. Vui lòng thử lại.",
        type: "error",
      });
    }
  };

  const handleCompleteInspection = async (productId) => {
    try {
      console.log(`Completing inspection for product ${productId}...`);
      
      // Update verification status to Verified
      const response = await updateVerificationStatus(productId, 'Verified', 'Kiểm định hoàn thành thành công');
      
      console.log("Inspection completed successfully:", response);
      
      showToast({
        title: "✅ Hoàn thành kiểm định",
        description: "Xe đã được kiểm định và xác minh thành công. Người bán sẽ không cần thanh toán thêm.",
        type: "success",
      });

      // Reload all data to reflect changes
      await loadAdminData();
      
      // Force re-render by updating refresh trigger
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Failed to complete inspection:", error);
      showToast({
        title: "❌ Lỗi",
        description: "Không thể hoàn thành kiểm định. Vui lòng thử lại.",
        type: "error",
      });
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

  const openListingModal = (listing) => {
    console.log("Opening modal for listing:", listing);
    console.log("Listing status:", listing.status);
    console.log("Will show approve buttons:", listing.status === "pending");
    setSelectedListing(listing);
    setCurrentImageIndex(0); // Reset to first image
    setExpandedDetails(false); // Reset expanded details
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Chờ duyệt",
        icon: Clock,
      },
      resubmit: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "Chờ duyệt lại",
        icon: Clock,
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Đã duyệt",
        icon: CheckCircle,
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Từ chối",
        icon: XCircle,
      },
      sold: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Đã bán",
        icon: Package,
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg font-medium">
            Đang tải dữ liệu admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Quản lý và duyệt bài đăng</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab("listings")}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === "listings"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Package className="h-5 w-5 mr-2" />
                Quản lý tin đăng
              </button>
              <button
                onClick={() => setActiveTab("inspections")}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === "inspections"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Kiểm định xe ({getInspectionRequests().length})
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Tổng tin đăng
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalListings}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.approvedListings} đã duyệt
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Chờ duyệt</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pendingListings}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Cần xử lý ngay</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-xl">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Từ chối</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.rejectedListings}
                </p>
                <p className="text-xs text-red-600 mt-1">Không đạt yêu cầu</p>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-xl">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Tổng người dùng
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
                <p className="text-xs text-blue-600 mt-1">Đã đăng ký</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Tỷ lệ duyệt
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.totalListings > 0
                    ? Math.round(
                        (stats.approvedListings / stats.totalListings) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-green-100 text-xs mt-1">
                  {stats.approvedListings}/{stats.totalListings} bài đăng
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Hoạt động hôm nay
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.pendingListings + stats.approvedListings}
                </p>
                <p className="text-purple-100 text-xs mt-1">Tin đăng mới</p>
              </div>
              <Activity className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Cần xử lý</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.pendingListings}
                </p>
                <p className="text-orange-100 text-xs mt-1">
                  Tin đăng chờ duyệt
                </p>
              </div>
              <Clock className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "listings" && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề, thương hiệu, model, biển số..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="resubmit">Chờ duyệt lại</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="sold">Đã bán</option>
              </select>
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
              </select>
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="vehicle">🚗 Xe điện</option>
                <option value="battery">🔋 Pin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Quản lý tin đăng
              </h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {filteredListings.length} kết quả
                </span>
              </div>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy tin đăng nào
              </h3>
              <p className="text-gray-500">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div
                    key={getId(listing)}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-24 h-24 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Car className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute -top-2 -right-2">
                          {getStatusBadge(listing.status)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                          {listing.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {listing.seller?.fullName ||
                                listing.seller?.full_name ||
                                listing.seller?.name ||
                                listing.seller?.email?.split("@")[0] ||
                                "Không xác định"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4" />
                            <span>
                              {listing.licensePlate ||
                                listing.license_plate ||
                                "Chưa cập nhật"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(
                                listing.createdAt ||
                                  listing.created_at ||
                                  listing.createdDate
                              ).toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xl font-bold text-blue-600">
                            {formatPrice(listing.price)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => openListingModal(listing)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </button>
                      {listing.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(getId(listing))}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm font-medium"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => openRejectModal(listing)}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm font-medium"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* Inspections Tab */}
        {activeTab === "inspections" && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Yêu cầu kiểm định xe
                </h2>
                <div className="flex items-center space-x-2">
                  <ClipboardCheck className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {getInspectionRequests().length} yêu cầu
                  </span>
                </div>
              </div>
            </div>

            {getInspectionRequests().length === 0 ? (
              <div className="text-center py-16">
                <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có yêu cầu kiểm định nào
                </h3>
                <p className="text-gray-500">
                  Các yêu cầu kiểm định xe sẽ hiển thị ở đây
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {getInspectionRequests().map((listing) => (
                    <div
                      key={getId(listing)}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-green-200 hover:border-green-300"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-24 h-24 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-24 h-24 bg-green-200 rounded-lg flex items-center justify-center">
                              <Car className="h-8 w-8 text-green-600" />
                            </div>
                          )}
                          <div className="absolute -top-2 -right-2">
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Kiểm định
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {listing.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {listing.brand} {listing.model}
                          </p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            {formatPrice(listing.price)}
                          </p>
                          
                          {/* Seller Info */}
                          {listing.seller && (
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Người bán: {listing.seller.fullName || listing.seller.email}</p>
                              {listing.seller.phone && (
                                <p>SĐT: {listing.seller.phone}</p>
                              )}
                            </div>
                          )}

                          {/* Vehicle Details */}
                          <div className="mt-3 space-y-1 text-sm text-gray-600">
                            {listing.licensePlate && (
                              <p>Biển số: <span className="font-medium">{listing.licensePlate}</span></p>
                            )}
                            {listing.manufactureYear && (
                              <p>Năm SX: <span className="font-medium">{listing.manufactureYear}</span></p>
                            )}
                            {listing.mileage && (
                              <p>Km: <span className="font-medium">{listing.mileage.toLocaleString()} km</span></p>
                            )}
                          </div>

                          {/* Status */}
                          <div className="mt-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              listing.verificationStatus === 'Requested' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : listing.verificationStatus === 'InProgress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {listing.verificationStatus === 'Requested' ? 'Chờ kiểm định' : 
                               listing.verificationStatus === 'InProgress' ? 'Đang kiểm định' : 
                               'Đã kiểm định'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => openListingModal(listing)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </button>
                        {listing.verificationStatus === 'Requested' && (
                          <button
                            onClick={() => handleStartInspection(getId(listing))}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm font-medium"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Kiểm định xe
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Chi tiết tin đăng
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  {selectedListing.images &&
                  selectedListing.images.length > 0 ? (
                    <div className="space-y-4">
                      {/* Image Slider */}
                      <div className="relative">
                        <img
                          src={selectedListing.images[currentImageIndex]}
                          alt={selectedListing.title}
                          className="w-full h-64 object-cover rounded-xl"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />

                        {/* Navigation Buttons */}
                        {selectedListing.images.length > 1 && (
                          <>
                            <button
                              onClick={() => {
                                const prevIndex =
                                  currentImageIndex === 0
                                    ? selectedListing.images.length - 1
                                    : currentImageIndex - 1;
                                setCurrentImageIndex(prevIndex);
                              }}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() => {
                                const nextIndex =
                                  currentImageIndex ===
                                  selectedListing.images.length - 1
                                    ? 0
                                    : currentImageIndex + 1;
                                setCurrentImageIndex(nextIndex);
                              }}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </>
                        )}

                        {/* Image Counter */}
                        {selectedListing.images.length > 1 && (
                          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} /{" "}
                            {selectedListing.images.length}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Car className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedListing.title}
                    </h4>
                    <div className="flex items-center space-x-2 mb-4">
                      {getStatusBadge(selectedListing.status)}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(selectedListing.price)}
                    </p>
                  </div>

                  {/* Product Info with Expandable Details */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    {/* Basic Info - Always Visible */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Thương hiệu
                        </p>
                        <p className="font-medium text-base">
                          {selectedListing.brand || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Model</p>
                        <p className="font-medium text-base">
                          {selectedListing.model || "Chưa cập nhật"}
                        </p>
                      </div>
                      {/* Only show license plate for vehicles */}
                      {(selectedListing.productType?.toLowerCase() ===
                        "vehicle" ||
                        (!selectedListing.productType &&
                          (selectedListing.licensePlate ||
                            selectedListing.license_plate ||
                            selectedListing.mileage ||
                            selectedListing.vehicleType))) && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Biển số</p>
                          <p className="font-medium text-base">
                            {selectedListing.licensePlate ||
                              selectedListing.license_plate ||
                              "Chưa cập nhật"}
                          </p>
                        </div>
                      )}
                      {/* Show battery type for batteries */}
                      {(selectedListing.productType?.toLowerCase() ===
                        "battery" ||
                        (!selectedListing.productType &&
                          (selectedListing.batteryType ||
                            selectedListing.batteryHealth ||
                            selectedListing.capacity ||
                            selectedListing.voltage))) && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Loại pin</p>
                          <p className="font-medium text-base">
                            {selectedListing.batteryType || "Chưa cập nhật"}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Đăng lúc</p>
                        <p className="font-medium text-base">
                          {new Date(
                            selectedListing.createdAt ||
                              selectedListing.created_at ||
                              selectedListing.createdDate
                          ).toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedDetails(!expandedDetails)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {expandedDetails ? "Thu gọn" : "Xem thêm thông tin"}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedDetails ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Expanded Details */}
                    {expandedDetails && (
                      <div className="space-y-4 pt-4 border-t border-gray-200 animate-fadeIn">
                        {/* Debug log for product type */}
                        {console.log("🔍 AdminDashboard Product Debug:", {
                          id: selectedListing.id || selectedListing.productId,
                          title: selectedListing.title,
                          productType: selectedListing.productType,
                          productTypeLower:
                            selectedListing.productType?.toLowerCase(),
                          isVehicle:
                            selectedListing.productType?.toLowerCase() ===
                            "vehicle",
                          isBattery:
                            selectedListing.productType?.toLowerCase() ===
                            "battery",
                        })}

                        {/* Vehicle Details */}
                        {(selectedListing.productType?.toLowerCase() ===
                          "vehicle" ||
                          (!selectedListing.productType &&
                            (selectedListing.licensePlate ||
                              selectedListing.license_plate ||
                              selectedListing.mileage ||
                              selectedListing.vehicleType) &&
                            !(
                              selectedListing.batteryType ||
                              selectedListing.batteryHealth ||
                              selectedListing.capacity ||
                              selectedListing.voltage
                            ))) && (
                          <div className="space-y-4">
                            <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                              <Car className="h-5 w-5 mr-2 text-blue-600" />
                              Thông tin xe điện
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Năm sản xuất
                                </p>
                                <p className="font-medium">
                                  {selectedListing.year ||
                                    selectedListing.manufactureYear ||
                                    "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Số km đã đi
                                </p>
                                <p className="font-medium">
                                  {selectedListing.mileage
                                    ? `${selectedListing.mileage.toLocaleString()} km`
                                    : "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Loại xe
                                </p>
                                <p className="font-medium">
                                  {selectedListing.vehicleType ||
                                    "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Hộp số
                                </p>
                                <p className="font-medium">
                                  {selectedListing.transmission ||
                                    "Chưa cập nhật"}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Tình trạng
                                </p>
                                <p className="font-medium">
                                  {selectedListing.condition || "Chưa cập nhật"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Battery Details */}
                        {(selectedListing.productType?.toLowerCase() ===
                          "battery" ||
                          (!selectedListing.productType &&
                            (selectedListing.batteryType ||
                              selectedListing.batteryHealth ||
                              selectedListing.capacity ||
                              selectedListing.voltage) &&
                            !(
                              selectedListing.licensePlate ||
                              selectedListing.license_plate ||
                              selectedListing.mileage ||
                              selectedListing.vehicleType
                            ))) && (
                          <div className="space-y-4">
                            <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                              <Shield className="h-5 w-5 mr-2 text-green-600" />
                              Thông tin pin
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Loại pin
                                </p>
                                <p className="font-medium">
                                  {selectedListing.batteryType ||
                                    "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Tình trạng pin
                                </p>
                                <p className="font-medium">
                                  {selectedListing.batteryHealth
                                    ? `${selectedListing.batteryHealth}%`
                                    : "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Dung lượng
                                </p>
                                <p className="font-medium">
                                  {selectedListing.capacity
                                    ? `${selectedListing.capacity} Ah`
                                    : "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Điện áp
                                </p>
                                <p className="font-medium">
                                  {selectedListing.voltage
                                    ? `${selectedListing.voltage} V`
                                    : "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  BMS
                                </p>
                                <p className="font-medium">
                                  {selectedListing.bms || "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Loại cell
                                </p>
                                <p className="font-medium">
                                  {selectedListing.cellType || "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Số chu kỳ
                                </p>
                                <p className="font-medium">
                                  {selectedListing.cycleCount
                                    ? `${selectedListing.cycleCount} chu kỳ`
                                    : "Chưa cập nhật"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Tình trạng
                                </p>
                                <p className="font-medium">
                                  {selectedListing.condition || "Chưa cập nhật"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Product Type Detection */}
                        {!selectedListing.productType && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h5 className="text-lg font-semibold text-yellow-900 flex items-center mb-2">
                              <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                              Phát hiện loại sản phẩm
                            </h5>
                            <div className="text-sm text-yellow-700">
                              <p>
                                <strong>Dựa trên dữ liệu có sẵn:</strong>
                              </p>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {selectedListing.licensePlate ||
                                selectedListing.license_plate ? (
                                  <li>✅ Có biển số xe → Sản phẩm xe điện</li>
                                ) : null}
                                {selectedListing.mileage ? (
                                  <li>✅ Có số km → Sản phẩm xe điện</li>
                                ) : null}
                                {selectedListing.vehicleType ? (
                                  <li>✅ Có loại xe → Sản phẩm xe điện</li>
                                ) : null}
                                {selectedListing.batteryType ? (
                                  <li>✅ Có loại pin → Sản phẩm pin</li>
                                ) : null}
                                {selectedListing.batteryHealth ? (
                                  <li>✅ Có tình trạng pin → Sản phẩm pin</li>
                                ) : null}
                                {selectedListing.capacity ? (
                                  <li>✅ Có dung lượng → Sản phẩm pin</li>
                                ) : null}
                                {selectedListing.voltage ? (
                                  <li>✅ Có điện áp → Sản phẩm pin</li>
                                ) : null}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Common Details */}
                        <div className="space-y-4">
                          <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                            <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                            Thông tin chung
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Địa chỉ
                              </p>
                              <p className="font-medium">
                                {selectedListing.location || "Chưa cập nhật"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Người bán
                              </p>
                              <p className="font-medium">
                                {selectedListing.sellerName ||
                                  selectedListing.seller?.fullName ||
                                  "Chưa cập nhật"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Email người bán
                              </p>
                              <p className="font-medium">
                                {selectedListing.sellerEmail ||
                                  selectedListing.seller?.email ||
                                  "Chưa cập nhật"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                SĐT người bán
                              </p>
                              <p className="font-medium">
                                {selectedListing.sellerPhone ||
                                  selectedListing.seller?.phone ||
                                  "Chưa cập nhật"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {selectedListing.description &&
                          selectedListing.description !== "Chưa có mô tả" && (
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                                Mô tả chi tiết
                              </h5>
                              <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                                {selectedListing.description}
                              </p>
                            </div>
                          )}

                        {/* Rejection Reason (if rejected) */}
                        {selectedListing.status === "rejected" &&
                          selectedListing.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h5 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
                                <XCircle className="h-5 w-5 mr-2 text-red-600" />
                                Lý do từ chối
                              </h5>
                              <p className="text-red-700 bg-red-100 p-3 rounded-lg">
                                {selectedListing.rejectionReason}
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Show approve/reject buttons for all non-approved listings */}
              {selectedListing.status !== "approved" &&
                selectedListing.status !== "sold" &&
                selectedListing.status !== "rejected" && (
                  <div className="mt-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Hành động quản trị
                      </h4>
                      <p className="text-sm text-blue-700">
                        Trạng thái hiện tại:{" "}
                        <span className="font-medium">
                          {selectedListing.status}
                        </span>
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleApprove(getId(selectedListing))}
                        className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Duyệt tin đăng
                      </button>
                      <button
                        onClick={() => openRejectModal(selectedListing)}
                        className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center font-medium"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Từ chối tin đăng
                      </button>
                    </div>
                  </div>
                )}

              {/* Show info for already approved/sold listings */}
              {selectedListing.status === "approved" && (
                <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-green-900">
                        Tin đăng đã được duyệt
                      </h4>
                      <p className="text-sm text-green-700">
                        Tin đăng này đã được phê duyệt và hiển thị trên trang
                        chủ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedListing.status === "sold" && (
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package className="h-6 w-6 text-gray-600 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Tin đăng đã bán
                      </h4>
                      <p className="text-sm text-gray-700">
                        Sản phẩm này đã được bán
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Product Modal */}
      <RejectProductModal
        isOpen={rejectModal.isOpen}
        onClose={closeRejectModal}
        product={rejectModal.product}
        onReject={handleReject}
      />
    </div>
  );
};
