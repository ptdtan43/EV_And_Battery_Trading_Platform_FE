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
  Camera,
  Bell,
  Flag,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";
import { useToast } from "../contexts/ToastContext";
import { notifyPostApproved, notifyPostRejected } from "../lib/notificationApi";
import { rejectProduct, approveProduct } from "../lib/productApi";
import { RejectProductModal } from "../components/admin/RejectProductModal";
import { AdminReports } from "../components/admin/AdminReports";
import { updateVerificationStatus, getVerificationRequests } from "../lib/verificationApi";
import { getUserNotifications, getUnreadCount, notifyUserVerificationCompleted } from "../lib/notificationApi";
import { forceSendNotificationsForAllSuccessfulPayments, sendNotificationsForKnownPayments, sendNotificationsForVerifiedProducts } from "../lib/verificationNotificationService";

export const AdminDashboard = () => {
  const { show: showToast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, vehicles, batteries, inspections, transactions, reports
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalRevenue: 0,
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

  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [skipImageLoading, setSkipImageLoading] = useState(false); // Add flag to skip image loading if causing issues

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    product: null,
  });

  // Inspection state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Inspection modal state
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionImages, setInspectionImages] = useState([]);
  const [inspectionFiles, setInspectionFiles] = useState([]);
  const [currentInspectionProduct, setCurrentInspectionProduct] = useState(null);

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
      // Lấy thông tin order để tìm buyer
      const orders = await apiRequest("/api/Order");
      const completedOrder = orders.find(order => 
        order.productId === productId && 
        order.orderStatus === "completed"
      );

      if (!completedOrder) {
        throw new Error("Không tìm thấy order đã hoàn thành cho sản phẩm này");
      }

      // Tạo review cho buyer
      const reviewData = {
        orderId: completedOrder.orderId,
        productId: productId,
        buyerId: completedOrder.userId,
        sellerId: completedOrder.sellerId,
        ratingValue: 0, // Mặc định 0, buyer sẽ cập nhật sau
        comment: "", // Để trống, buyer sẽ điền sau
        isCompleted: false // Chưa hoàn thành đánh giá
      };

      // Gọi API tạo review
      await apiRequest("/api/Rating", {
        method: 'POST',
        body: reviewData
      });

      console.log(`✅ Review created for buyer ${completedOrder.userId} on product ${productId}`);
      
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
        showToast({
          title: 'Cảnh báo',
          description: 'Giao dịch đã thành công nhưng không thể tạo review tự động.',
          type: 'warning',
        });
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

  // Handle mark transaction as failed and refund
  const handleMarkTransactionFailed = async (productId) => {
    if (!window.confirm('Bạn có chắc muốn đánh dấu giao dịch này không thành công? Sản phẩm sẽ được trả về Homepage và hoàn tiền cho người mua.')) {
      return;
    }

    try {
      showToast({
        title: 'Đang xử lý...',
        description: 'Đang hoàn tiền và trả sản phẩm về trang chủ',
        type: 'info',
      });


      // Find the product to get its details
      const product = allListings.find(p => (p.id || p.productId) == productId);
      console.log('📦 Product to return:', product);

      // Update product status to 'Active' to release it back to Homepage
      // Use PUT /api/Product/{id} to update the whole product
      try {
        // Get full product details first
        const fullProduct = await apiRequest(`/api/Product/${productId}`);
        console.log('📦 Full product data:', fullProduct);
        
        // Update product with Active status
        const productUpdateResponse = await apiRequest(`/api/Product/${productId}`, {
          method: 'PUT',
          body: {
            ...fullProduct,
            status: 'Active'
          }
        });
        console.log('✅ Product status updated to Active:', productUpdateResponse);
      } catch (statusError) {
        console.error('❌ Could not update product status:', statusError);
        showToast({
          title: 'Lỗi',
          description: 'Không thể cập nhật trạng thái sản phẩm. Vui lòng thử lại.',
          type: 'error',
        });
        return;
      }

      // Try to get payment details, but don't fail if this doesn't work
      let refundAmount = 'N/A';
      try {
        const payments = await apiRequest(`/api/payment/product/${productId}`);
        console.log('📝 Found payments for product:', payments);

        if (payments && payments.length > 0) {
          const latestPayment = payments[0];
          refundAmount = latestPayment.amount 
            ? (parseInt(latestPayment.amount) / 100).toLocaleString('vi-VN') 
            : 'N/A';
          
          console.log('💰 Refund amount calculated:', refundAmount);
        }
      } catch (paymentError) {
        console.warn('⚠️ Could not get payment details, using product price:', paymentError);
        // Use product price as fallback (no need to divide by 100, price is already in correct unit)
        refundAmount = product?.price ? parseInt(product.price).toLocaleString('vi-VN') : 'N/A';
      }

      // Save refund info to localStorage for banner display
      const refundData = {
        type: 'REFUND',
        amount: refundAmount,
        productTitle: product?.title || product?.name || 'Sản phẩm',
        timestamp: Date.now()
      };
      localStorage.setItem('evtb_refund_success', JSON.stringify(refundData));
      console.log('💾 Refund data saved to localStorage:', refundData);

      showToast({
        title: 'Thành công!',
        description: 'Giao dịch đã được đánh dấu không thành công. Sản phẩm đã được trả về trang chủ.',
        type: 'success',
      });

      // Reload data to update UI
      await loadAdminData();

      // Show info toast about refund banner
      setTimeout(() => {
        showToast({
          title: 'Hoàn tiền',
          description: 'Người mua sẽ thấy thông báo hoàn tiền khi vào Homepage',
          type: 'success',
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Error marking transaction as failed:', error);
      showToast({
        title: 'Lỗi',
        description: `Không thể đánh dấu giao dịch thất bại: ${error.message || 'Vui lòng thử lại.'}`,
        type: 'error',
      });
    }
  };

  // Handle view product details
  const handleViewDetails = (product) => {
    // Open product detail page in new tab
    const productUrl = `http://localhost:5173/product/${product.id || product.productId}`;
    window.open(productUrl, '_blank');
  };

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
              
              // Auto-show notification dropdown
              setShowNotifications(true);
              
              // Show success toast
              showToast({
                title: '🔔 Thông báo tự động',
                description: `Đã tự động gửi ${notificationsSent} thông báo kiểm định cho admin`,
                type: 'success',
              });
              
              // Auto-hide notification dropdown after 10 seconds
              setTimeout(() => {
                setShowNotifications(false);
              }, 10000);
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

  useEffect(() => {
    filterListings();
  }, [allListings, searchTerm, statusFilter, productTypeFilter, dateFilter, activeTab]);

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
        console.log("✅ Products loaded:", listings.length, listings.map(p => ({id: p.id, verificationStatus: p.verificationStatus, productType: p.productType})));
        console.log("🔍 Products with Requested status:", listings.filter(p => p.verificationStatus === "Requested" || p.verificationStatus === "requested"));
        
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

          const mapped = {
            id: getId(item),
            title: item.title || item.name || item.productName || "Không có tiêu đề",
            brand: item.brand || item.brandName || "Không rõ",
            model: item.model || item.modelName || "Không rõ",
            year: item.manufactureYear || item.year || item.modelYear || item.manufacturingYear || "N/A",
            manufactureYear: item.manufactureYear || item.year || item.modelYear || item.manufacturingYear || "N/A",
            price: parseFloat(item.price || item.listPrice || item.sellingPrice || 0),
            status: (() => {
              const rawStatus = norm(item.status || item.verificationStatus || item.approvalStatus || "pending");
              // Map backend statuses to frontend statuses
              if (rawStatus === "draft" || rawStatus === "re-submit") return "pending";
              if (rawStatus === "active" || rawStatus === "approved") return "Active";
              if (rawStatus === "rejected") return "rejected";
              if (rawStatus === "reserved") return "reserved"; // Đang trong quá trình thanh toán
              if (rawStatus === "sold") return "sold"; // Đã bán thành công
              return rawStatus;
            })(),
            productType: norm(item.productType || item.type || item.category || "vehicle"),
            licensePlate: item.licensePlate || item.plateNumber || item.registrationNumber || "N/A",
            mileage: item.mileage || item.odometer || item.distance || "N/A",
            fuelType: item.fuelType || item.energyType || item.powerSource || "N/A",
            transmission: item.transmission || item.gearbox || "N/A",
            color: item.color || item.paintColor || "N/A",
            condition: item.condition || item.vehicleCondition || "N/A",
            description: item.description || item.details || item.content || "Không có mô tả",
            location: item.location || item.address || item.city || "Không rõ",
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

      // Calculate revenue from approved products (since no payment system yet)
      const approvedProducts = sortedListings.filter(l => l.status === "Active");
      const totalRevenue = approvedProducts.reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);
      
      // Calculate orders stats from transactions (if any)
      const completedOrders = transactions.filter(t => t.orderStatus === "Completed" || t.orderStatus === "Paid").length;
      const activeOrders = transactions.filter(t => t.orderStatus === "Pending" || t.orderStatus === "Active").length;
      
      // Calculate revenue by date from approved products
      const todaysRevenue = approvedProducts
        .filter(p => {
          const productDate = new Date(p.createdDate || 0);
          const today = new Date();
          return productDate.toDateString() === today.toDateString();
        })
        .reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

      const thisYearRevenue = approvedProducts
        .filter(p => {
          const productDate = new Date(p.createdDate || 0);
          const currentYear = new Date().getFullYear();
          return productDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

      const thisMonthRevenue = approvedProducts
        .filter(p => {
          const productDate = new Date(p.createdDate || 0);
          const currentDate = new Date();
          return productDate.getMonth() === currentDate.getMonth() && 
                 productDate.getFullYear() === currentDate.getFullYear();
        })
        .reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

      const averageOrderValue = approvedProducts.length > 0 ? totalRevenue / approvedProducts.length : 0;
      const completionRate = transactions.length > 0 ? (completedOrders / transactions.length) * 100 : 0;

      setStats({
        totalUsers: users.length,
        totalListings: sortedListings.length,
        pendingListings: pendingListings.length,
        approvedListings: approvedListings.length,
        rejectedListings: rejectedListings.length,
        totalRevenue,
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
        soldVehicles: vehicleListings.filter(v => v.status === "Active").length,
        soldBatteries: batteryListings.filter(b => b.status === "Active").length,
      });

      setAllListings(sortedListings);
      console.log("DEBUG: allListings set to:", sortedListings.length, "items. Content:", sortedListings.map(l => ({id: l.id, verificationStatus: l.verificationStatus, productType: l.productType})));
      
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
        // Regular status filter
      filtered = filtered.filter((l) => l.status === statusFilter);
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

  const openListingModal = (listing) => {
    setSelectedListing(listing);
    setCurrentImageIndex(0);
    setExpandedDetails(false);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Đang chờ duyệt" },
      Active: { color: "bg-green-100 text-green-800", text: "Đã duyệt" },
      rejected: { color: "bg-red-100 text-red-800", text: "Bị từ chối" },
      reserved: { color: "bg-orange-100 text-orange-800", text: "Đang trong quá trình thanh toán" },
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-10">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EV Market</h1>
              <p className="text-sm text-gray-500">Admin Portal</p>
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
              <h3 className="font-semibold text-gray-900">Admin User</h3>
              <p className="text-sm text-gray-500">Super Administrator</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">95% uptime</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <div className="space-y-2">
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "dashboard" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </div>
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "vehicles" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("vehicles")}
            >
              <Car className="h-5 w-5" />
              <span>Vehicle Management</span>
            </div>
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "batteries" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("batteries")}
            >
              <Shield className="h-5 w-5" />
              <span>Battery Management</span>
            </div>
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "transactions" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("transactions")}
            >
              <DollarSign className="h-5 w-5" />
              <span>Transaction Management</span>
            </div>
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "reports" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("reports")}
            >
              <Flag className="h-5 w-5" />
              <span>Báo cáo vi phạm</span>
            </div>
          </div>
        </nav>

        {/* Tips Section */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">💡</span>
              </div>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Tips</p>
                <p className="text-xs text-yellow-700">Quick responses can help improve customer satisfaction.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {activeTab === "dashboard" && "Administration Dashboard"}
                {activeTab === "vehicles" && "Vehicle Management"}
                {activeTab === "batteries" && "Battery Management"}
                {activeTab === "transactions" && "Transaction Management"}
                {activeTab === "reports" && "Báo cáo vi phạm"}
              </h1>
              <p className="text-gray-600">
                {activeTab === "dashboard" && "EV Market system overview • Realtime update"}
                {activeTab === "vehicles" && "Manage all vehicle listings and approvals"}
                {activeTab === "batteries" && "Manage all battery listings and approvals"}
                {activeTab === "transactions" && "Manage completed transactions and seller confirmations"}
                {activeTab === "reports" && "Xem xét và xử lý các báo cáo vi phạm từ người dùng"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Notification Bell */}
              <div className="relative">
              <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Thông báo"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </div>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                      <p className="text-sm text-gray-500">{notifications.length} thông báo</p>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>Không có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id || notification.notificationId}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => {
                              // Handle notification click
                              if (notification.notificationType === 'verification_payment_success' && notification.metadata?.productId) {
                                // Find the product and show inspection modal
                                const product = allListings.find(p => getId(p) === notification.metadata.productId);
                                if (product) {
                                  setCurrentInspectionProduct(product);
                                  setShowInspectionModal(true);
                                  setShowNotifications(false);
                                }
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {notification.metadata?.formattedDate || 
                                   formatDate(notification.createdAt || notification.created_date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          // Navigate to full notifications page if needed
                        }}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        Xem tất cả thông báo
              </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-send notifications button - hidden as it's now automatic */}
              {/* <button
                onClick={handleForceSendNotifications}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Gửi thông báo cho thanh toán kiểm định thành công"
              >
                <Bell className="h-4 w-4" />
                <span>Gửi thông báo</span>
              </button> */}

              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                <span>Làm mới</span>
              </button>
              
              {skipImageLoading && (
              <button
                  onClick={() => {
                    setSkipImageLoading(false);
                    refreshData();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  <span>Bật tải hình ảnh</span>
              </button>
              )}
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
                  <p className="text-gray-500 text-sm font-medium">TOTAL VALUE</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.totalRevenue)}
                </p>
                  <p className="text-xs text-gray-600 mt-1">Approved Products</p>
              </div>
                <div className="bg-gray-100 p-4 rounded-xl">
                  <DollarSign className="h-8 w-8 text-gray-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">This Year: {formatPrice(stats.thisYearRevenue)}</p>
                <p className="text-xs text-gray-500">This Month: {formatPrice(stats.thisMonthRevenue)}</p>
            </div>
          </div>

            {/* Today's Revenue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">TODAY'S VALUE</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.todaysRevenue)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Approved Today</p>
              </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Average/Month: {formatPrice(stats.thisYearRevenue / 12)}</p>
                <p className="text-xs text-gray-500">Products Approved: {stats.approvedListings}</p>
            </div>
          </div>

            {/* Total Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">TOTAL ORDERS</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalOrders}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">All Time</p>
              </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Completed: {stats.completedOrders}</p>
                <p className="text-xs text-gray-500">Active: {stats.activeOrders}</p>
            </div>
          </div>

            {/* Average Value/Product */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">AVERAGE VALUE/PRODUCT</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.averageOrderValue)}
                </p>
                  <p className="text-xs text-gray-600 mt-1">Per Product</p>
              </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Highest: {formatPrice(stats.averageOrderValue * 1.5)}</p>
                <p className="text-xs text-gray-500">Lowest: {formatPrice(stats.averageOrderValue * 0.5)}</p>
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
                  <p className="text-gray-500 text-sm font-medium">COMPLETED ORDERS</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.completedOrders}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{stats.completionRate.toFixed(1)}% Completion Rate</p>
              </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Active Orders: {stats.activeOrders}</p>
                <p className="text-xs text-gray-500">Total Value: {formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>

            {/* This Month */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">THIS MONTH</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.thisMonthRevenue)}
                </p>
                  <p className="text-xs text-gray-600 mt-1">Month {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
              </div>
                <div className="bg-purple-100 p-4 rounded-xl">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Average/Day: {formatPrice(stats.thisMonthRevenue / new Date().getDate())}</p>
                <p className="text-xs text-gray-500">Total Orders: {stats.totalOrders}</p>
            </div>
          </div>

            {/* Vehicle vs Battery Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">VEHICLES & BATTERIES</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.totalVehicles + stats.totalBatteries}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Total Products</p>
              </div>
                <div className="bg-orange-100 p-4 rounded-xl">
                  <Car className="h-8 w-8 text-orange-600" />
            </div>
          </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Vehicles: {stats.totalVehicles}</p>
                <p className="text-xs text-gray-500">Batteries: {stats.totalBatteries}</p>
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
                  <p className="text-gray-500 text-sm font-medium">PENDING INSPECTIONS</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {allListings.filter(l => l.verificationStatus === "Requested").length}
                </p>
                  <p className="text-xs text-gray-600 mt-1">Awaiting Admin Action</p>
              </div>
                <div className="bg-yellow-100 p-4 rounded-xl">
                  <Camera className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">In Progress: {allListings.filter(l => l.verificationStatus === "InProgress").length}</p>
                <p className="text-xs text-gray-500">Completed: {allListings.filter(l => l.verificationStatus === "Verified").length}</p>
            </div>
          </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">RECENT NOTIFICATIONS</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {unreadNotificationCount}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Unread Messages</p>
              </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Total: {notifications.length}</p>
                <p className="text-xs text-gray-500">Verification: {notifications.filter(n => n.notificationType === 'verification_payment_success').length}</p>
        </div>
          </div>
        </div>
        )}

            {/* Filters and Search - Hide on reports tab */}
            {activeTab !== "reports" && (
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
                <option value="reserved">Đang trong quá trình thanh toán ({allListings.filter(l => l.status === "reserved").length})</option>
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

        {/* Listings Table - Hide on inspections, transactions and reports tabs */}
        {activeTab !== "inspections" && activeTab !== "transactions" && activeTab !== "reports" && (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(listing.price)}
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
                          onClick={() => setExpandedDetails(listing.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Xem chi tiết"
                      >
                          <Eye className="h-4 w-4" />
                      </button>
                      
                      {/* Inspection button for products with Requested or InProgress verification status */}
                      {(listing.verificationStatus === "Requested" || listing.verificationStatus === "InProgress") && (
                      <button
                          onClick={() => handleStartInspection(listing.id)}
                          className={`px-3 py-1 rounded-lg text-xs flex items-center space-x-1 ${
                            listing.verificationStatus === "InProgress" 
                              ? "bg-orange-600 text-white hover:bg-orange-700" 
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                          title={listing.verificationStatus === "InProgress" ? "Tiếp tục kiểm định" : "Bắt đầu kiểm định"}
                        >
                          <Camera className="h-3 w-3" />
                          <span>{listing.verificationStatus === "InProgress" ? "Tiếp tục" : "Kiểm định"}</span>
                      </button>
                      )}
                        
                        {(listing.status === "pending" || listing.status === "Đang chờ duyệt" || listing.status === "Re-submit" || listing.status === "Draft") && listing.status !== "reserved" && (
                          
                          <>
                            {console.log(`🔍 Product ${listing.id} debug:`, {
                              status: listing.status,
                              verificationStatus: listing.verificationStatus,
                              shouldShowButtons: listing.status === "pending" || listing.status === "Đang chờ duyệt" || listing.status === "Re-submit" || listing.status === "Draft",
                              statusType: typeof listing.status,
                              statusValue: JSON.stringify(listing.status)
                            })}
                          <button
                              onClick={() => handleApprove(listing.id)}
                              disabled={processingIds.has(listing.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Duyệt sản phẩm"
                            >
                              {processingIds.has(listing.id) ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              <span>Duyệt</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(listing)}
                              disabled={processingIds.has(listing.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Từ chối sản phẩm"
                          >
                              <XCircle className="h-3 w-3" />
                              <span>Từ chối</span>
                          </button>
                        </>
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
                        onClick={() => setExpandedDetails(false)}
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
                                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                                        index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
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
                                <p className="font-medium">{getStatusBadge(product.status)}</p>
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

                            <div className="grid grid-cols-2 gap-4">
                        <div>
                                <p className="text-sm text-gray-500">Năm sản xuất</p>
                                <p className="font-medium">{product.year}</p>
                            </div>
                      <div>
                                <p className="text-sm text-gray-500">Giá</p>
                                <p className="font-medium text-green-600">{formatPrice(product.price)}</p>
                      </div>
                    </div>

                            {product.productType?.toLowerCase().includes("vehicle") && (
                              <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                    <p className="text-sm text-gray-500">Biển số</p>
                                    <p className="font-medium">{product.licensePlate}</p>
                              </div>
                              <div>
                                    <p className="text-sm text-gray-500">Số km</p>
                                    <p className="font-medium">{product.mileage}</p>
                              </div>
                              </div>
                                <div className="grid grid-cols-2 gap-4">
                              <div>
                                    <p className="text-sm text-gray-500">Tình trạng</p>
                                    <p className="font-medium">{product.condition}</p>
                              </div>
                              <div>
                                    <p className="text-sm text-gray-500">Màu sắc</p>
                                    <p className="font-medium">{product.color}</p>
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
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex items-center justify-end space-x-3">
                        <button
                          onClick={() => setExpandedDetails(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Đóng
                        </button>
                        {(product.status === "pending" || product.status === "Re-submit" || product.status === "Draft") && (
                          <>
                          <button
                              onClick={() => {
                                setExpandedDetails(false);
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
                                setExpandedDetails(false);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images */}
                <div>
                  <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                    {selectedListing.images && selectedListing.images.length > 0 ? (
                        <img
                          src={selectedListing.images[currentImageIndex]}
                          alt={selectedListing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Car className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                    <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedListing.title}
                    </h3>
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(selectedListing.price)}
                      </p>
                    </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Car className="h-4 w-4 mr-2" />
                      <span>{selectedListing.brand} {selectedListing.model}</span>
                  </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Ngày tạo: {formatDate(selectedListing.createdAt)}</span>
                </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Người bán: {selectedListing.sellerName || "Unknown"}</span>
                    </div>
                  </div>

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
                    {/* Debug info */}
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                      <strong>Debug Info:</strong><br/>
                      verificationStatus: {selectedListing.verificationStatus}<br/>
                      status: {selectedListing.status}
                    </div>
                    
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
                          const updatedListing = {...selectedListing, verificationStatus: "Requested"};
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
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, title: e.target.value})}
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
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, brand: e.target.value})}
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
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, model: e.target.value})}
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
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, licensePlate: e.target.value})}
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
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, mileage: e.target.value ? parseInt(e.target.value) : ''})}
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
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, manufactureYear: e.target.value ? parseInt(e.target.value) : ''})}
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
                      <select
                        value={currentInspectionProduct.condition || ''}
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, condition: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="excellent">Xuất sắc</option>
                        <option value="good">Tốt</option>
                        <option value="fair">Khá</option>
                        <option value="poor">Kém</option>
                      </select>
                              </div>

                    {/* Price */}
                              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={currentInspectionProduct.price || ''}
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, price: parseFloat(e.target.value) || 0})}
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
                        onChange={(e) => setCurrentInspectionProduct({...currentInspectionProduct, description: e.target.value})}
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hoàn thành kiểm định
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
              Quản lý giao dịch đang trong quá trình thanh toán
            </h2>
            <p className="text-gray-600 mb-6">
              Quản lý các sản phẩm đã được đặt cọc thành công và đang chờ seller xác nhận.
            </p>
            
            {/* Transaction Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                            <div>
                    <p className="text-sm font-medium text-yellow-900">Đang trong quá trình thanh toán</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {allListings.filter(product => product.status === 'reserved').length}
                              </p>
                            </div>
                            </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-orange-600 mr-3" />
                            <div>
                    <p className="text-sm font-medium text-orange-900">Chờ admin duyệt</p>
                    <p className="text-2xl font-bold text-orange-600">0</p>
                            </div>
                          </div>
                        </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                            <div>
                    <p className="text-sm font-medium text-green-900">Đã hoàn tất</p>
                    <p className="text-2xl font-bold text-green-600">
                      {allListings.filter(product => product.status === 'sold').length}
                              </p>
                            </div>
                            </div>
                      </div>
                  </div>

            {/* Reserved and Sold Products List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quản lý giao dịch (Đang trong quá trình thanh toán & Đã hoàn tất)</h3>
              {allListings.filter(product => product.status === 'reserved' || product.status === 'sold').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allListings.filter(product => product.status === 'reserved' || product.status === 'sold').map((product) => (
                    <div key={product.id || product.productId} className={`border rounded-lg p-4 ${product.status === 'reserved' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              className="w-full h-full object-cover"
                              src={product.images[0]}
                              alt={product.title || product.name}
                              onError={(e) => {
                                console.log("Image failed to load:", product.images[0]);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-full h-full rounded-lg flex items-center justify-center ${product.status === 'reserved' ? 'bg-yellow-200' : 'bg-blue-200'} ${product.images && product.images.length > 0 ? 'hidden' : ''}`}
                            style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}
                          >
                            {product.status === 'reserved' ? <Clock className="h-6 w-6 text-yellow-600" /> : <DollarSign className="h-6 w-6 text-blue-600" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {product.title || product.name}
                          </h4>
                          <p className="text-lg font-bold text-blue-600 mt-1">
                            {formatPrice(product.price)}
                          </p>
                          <div className="flex items-center mt-2">
                            {product.status === 'reserved' ? <Clock className="h-4 w-4 text-yellow-600 mr-1" /> : <DollarSign className="h-4 w-4 text-blue-600 mr-1" />}
                            <span className={`text-sm ${product.status === 'reserved' ? 'text-yellow-600' : 'text-blue-600'}`}>
                              {product.status === 'reserved' ? 'Đang trong quá trình thanh toán' : 'Đã hoàn tất'}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Seller ID: {product.sellerId}</p>
                            <p>Ngày tạo: {formatDate(product.createdAt || product.createdDate)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        {product.status === 'reserved' && (
                          <button
                            onClick={() => handleAdminConfirm(product.id || product.productId)}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Xác nhận giao dịch thành công
                          </button>
                        )}
                        {product.status === 'reserved' && (
                          <button
                            onClick={() => handleMarkTransactionFailed(product.id || product.productId)}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Giao dịch không thành công
                          </button>
                        )}
                        {product.status === 'sold' && (
                          <button
                            onClick={() => handleViewDetails(product)}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Xem chi tiết
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chưa có sản phẩm nào đang trong quá trình thanh toán hoặc đã hoàn tất</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Management Tab */}
      {activeTab === "reports" && (
        <AdminReports />
      )}

      </div>
    </div>
  );
};