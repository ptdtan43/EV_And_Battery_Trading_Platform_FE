import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";
import { useToast } from "../contexts/ToastContext";
import { RejectedProducts } from "../components/user/RejectedProducts";
import { RejectionReasonModal } from "../components/common/RejectionReasonModal";
import { VerificationButton } from "../components/common/VerificationButton";
import "../styles/mylistings.css";

export const MyListings = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all"); // all, vehicle, battery
  const [activeTab, setActiveTab] = useState("listings"); // listings, rejected
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRejection, setSelectedRejection] = useState(null);
  const [sellerOrders, setSellerOrders] = useState([]); // Store seller's orders for cancellation info

  useEffect(() => {
    console.log("🔍 MyListings useEffect triggered:", {
      user,
      hasUser: !!user,
    });
    if (user) {
      loadListings();
      loadSellerOrders(); // Load orders to check for cancellation reasons
    }
  }, [user]);

  const getListingId = (l) =>
    l?.id ?? l?.productId ?? l?.Id ?? l?.listingId ?? l?.product_id ?? null;
  const norm = (val) => String(val || "").toLowerCase();
  const getStatus = (l) => {
    const raw = norm(l?.status ?? l?.Status ?? l?.state);
    if (raw.includes("draft") || raw.includes("pending") || raw.includes("chờ"))
      return "pending";
    if (
      raw.includes("resubmit") ||
      raw.includes("gửi lại") ||
      raw.includes("cần duyệt lại")
    )
      return "resubmit";
    if (
      raw.includes("active") ||
      raw.includes("approve") ||
      raw.includes("duyệt")
    )
      return "approved";
    if (raw.includes("reject") || raw.includes("từ chối")) return "rejected";
    if (raw.includes("reserved") || raw.includes("thanh toán")) return "reserved";
    if (raw.includes("sold") || raw.includes("đã bán")) return "sold";
    return raw || "pending";
  };

  const loadListings = async () => {
    console.log("🔍 MyListings loadListings started");
    try {
      // Load vehicles and batteries separately for the seller
      const sellerId = user?.id || user?.accountId || user?.userId || 1;
      console.log("🔍 MyListings sellerId:", sellerId);
      console.log("🔍 MyListings loading for sellerId:", sellerId);

      // Use seller-specific API (now has productType field)
      console.log("🔄 Using seller-specific API (has productType)");
      const sellerData = await apiRequest(`/api/Product/seller/${sellerId}`);
      const sellerItems = Array.isArray(sellerData)
        ? sellerData
        : sellerData?.items || [];
      console.log("✅ Seller API successful:", sellerItems.length, "items");

      // Fallback: if seller endpoint returns empty, fetch all and filter by sellerId
      let sourceItems = sellerItems;
      if (sellerId && sellerItems.length === 0) {
        try {
          console.log("🛠️ Fallback: fetching all products and filtering by sellerId", sellerId);
          const allResponse = await apiRequest(`/api/Product`);
          const allItems = Array.isArray(allResponse) ? allResponse : allResponse?.items || [];
          sourceItems = allItems.filter(
            (p) => (p.sellerId || p.SellerId || p.ownerId || p.createdBy) == sellerId
          );
          console.log("✅ Fallback filtered items:", sourceItems.length);
        } catch (fallbackErr) {
          console.warn("⚠️ Fallback fetch failed:", fallbackErr);
        }
      }

      console.log("🔍 Seller data loaded:", sourceItems.length, "items");

      // Classify products - use single pass to avoid duplicates
      const vehiclesData = [];
      const batteriesData = [];

      sourceItems.forEach((item) => {
        // PRIORITY 1: Check productType field first (most reliable)
        if (item.productType === "vehicle" || item.productType === "Vehicle") {
          console.log(
            `✅ Product ${item.productId} → VEHICLE (productType field)`
          );
          vehiclesData.push(item);
          return;
        }

        if (item.productType === "battery" || item.productType === "Battery") {
          console.log(
            `✅ Product ${item.productId} → BATTERY (productType field)`
          );
          batteriesData.push(item);
          return;
        }

        // If no productType, default to vehicle
        console.log(
          `✅ Product ${item.productId} → VEHICLE (default - no productType)`
        );
        vehiclesData.push(item);
      });

      // Remove duplicates from vehicles and batteries
      const uniqueVehicles = vehiclesData.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.productId === item.productId)
      );
      const uniqueBatteries = batteriesData.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.productId === item.productId)
      );

      // Remove products that appear in both categories
      const vehicleIds = new Set(uniqueVehicles.map((v) => v.productId));
      const finalBatteries = uniqueBatteries.filter(
        (b) => !vehicleIds.has(b.productId)
      );

      console.log(
        "🔍 After removing cross-category duplicates - Vehicles:",
        uniqueVehicles.length,
        "Batteries:",
        finalBatteries.length
      );

      console.log(
        "🔍 After deduplication - Vehicles:",
        uniqueVehicles.length,
        "Batteries:",
        uniqueBatteries.length
      );

      // Debug: Log final classification results
      console.log("🔍 FINAL CLASSIFICATION RESULTS:");
      console.log(
        "🚗 VEHICLES:",
        uniqueVehicles.map((v) => ({
          id: v.productId,
          title: v.title,
          productType: v.productType,
        }))
      );
      console.log(
        "🔋 BATTERIES:",
        finalBatteries.map((b) => ({
          id: b.productId,
          title: b.title,
          productType: b.productType,
        }))
      );

      // Data is already separated by API endpoints
      // No need for complex classification logic

      // Debug: Show classification details
      if (vehiclesData.length > 0) {
        console.log(
          "🚗 Vehicle products:",
          vehiclesData.map((item) => ({
            id: item.productId || item.id,
            title: item.title,
            brand: item.brand,
            classification: "vehicle",
          }))
        );
      }

      if (batteriesData.length > 0) {
        console.log(
          "🔋 Battery products:",
          batteriesData.map((item) => ({
            id: item.productId || item.id,
            title: item.title,
            brand: item.brand,
            classification: "battery",
          }))
        );
      }

      // Keep original productType from database, only add if missing
      const vehicles = uniqueVehicles.map((x) => ({
        ...x,
        productType: x.productType || "vehicle", // Keep original productType from DB
      }));
      const batteries = finalBatteries.map((x) => ({
        ...x,
        productType: x.productType || "battery", // Keep original productType from DB
      }));

      // Combine all data
      const data = [...vehicles, ...batteries];

      const items = data;

      const filtered = items
        .filter((l) => {
          const s = norm(l?.status || l?.Status || "");
          return s !== "deleted" && s !== "inactive";
        })
        .map(async (l, index) => {
          let images = [];
          let rejectionReason = l.rejectionReason || l.RejectionReason;

          // ALWAYS fetch fresh rejection reason for rejected products to ensure we have the latest data
          // This prevents stale data from causing "Bị báo cáo" to change to "Từ chối"
          const status = getStatus(l);
          if (status === "rejected") {
            try {
              console.log(`🔄 Fetching fresh rejection reason for product ${l.id || l.productId}`);
              const detailedProduct = await apiRequest(
                `/api/Product/${l.id || l.productId || l.Id}`
              );
              rejectionReason = 
                detailedProduct?.rejectionReason || 
                detailedProduct?.RejectionReason || 
                detailedProduct?.rejection_reason;
              
              console.log(`✅ Fresh rejection reason for ${l.id || l.productId}:`, {
                reason: rejectionReason,
                hasPrefix: rejectionReason?.startsWith("[BÁO CÁO]")
              });
            } catch (error) {
              console.warn(`⚠️ Failed to fetch rejection reason for product ${l.id || l.productId}:`, error);
              // Fallback to existing value if fetch fails
              rejectionReason = l.rejectionReason || l.RejectionReason;
            }
          }

          // Check if images are stored directly in the product object first
          if (l.images && Array.isArray(l.images)) {
            images = l.images;
          } else {
            // Check other possible image fields
            const possibleImageFields = [
              "image",
              "photo",
              "thumbnail",
              "picture",
              "img",
              "Image",
              "Photo",
              "Thumbnail",
              "Picture",
              "Img",
              "primaryImage",
              "mainImage",
              "coverImage",
            ];

            for (const field of possibleImageFields) {
              if (l[field]) {
                if (Array.isArray(l[field])) {
                  images = l[field];
                } else if (typeof l[field] === "string") {
                  images = [l[field]];
                }
                break;
              }
            }
          }

          // Only try the API endpoint if no images found in product object
          if (images.length === 0) {
            try {
              // Add delay between API calls to prevent DbContext conflicts
              if (index > 0) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * index)
                );
              }

              const imagesData = await apiRequest(
                `/api/ProductImage/product/${l.id || l.productId || l.Id}`
              );

              const imagesArray = Array.isArray(imagesData)
                ? imagesData
                : imagesData?.items || [];

              images = imagesArray.map(
                (img) =>
                  img.imageData ||
                  img.imageUrl ||
                  img.url ||
                  img.ImageData ||
                  img.ImageUrl ||
                  img.Url
              );
            } catch (error) {
              // Use fallback placeholder images based on product type
              const isVehicle =
                l.productType === "vehicle" ||
                (l.title && l.title.toLowerCase().includes("xe")) ||
                (l.brand &&
                  ["toyota", "honda", "ford", "bmw", "mercedes"].some((b) =>
                    l.brand.toLowerCase().includes(b)
                  ));

              images = isVehicle
                ? [
                    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&auto=format",
                    "https://images.unsplash.com/photo-1549317336-206569e8475c?w=400&h=300&fit=crop&auto=format",
                  ]
                : [
                    "https://images.unsplash.com/photo-1609592807902-4a3a4a4a4a4a?w=400&h=300&fit=crop&auto=format",
                    "https://images.unsplash.com/photo-1609592807902-4a3a4a4a4a4b?w=400&h=300&fit=crop&auto=format",
                  ];
            }
          }

          return {
            ...l,
            status: status,
            images: images,
            rejectionReason: rejectionReason,
          };
        });

      // Wait for all image loading to complete
      const listingsWithImages = await Promise.all(filtered);

      // Sort listings to show newest first (by createdDate or createdAt)
      const sortedListings = listingsWithImages.sort((a, b) => {
        const dateA = new Date(
          a.createdDate || a.createdAt || a.created_date || 0
        );
        const dateB = new Date(
          b.createdDate || b.createdAt || b.created_date || 0
        );
        return dateB - dateA; // Newest first
      });

      setListings(sortedListings);
    } catch (error) {
      console.error("Error loading listings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load seller's orders to check for cancellation reasons
  // Use GET /api/Order (same as MyPurchases.jsx) to get cancellationReason
  const loadSellerOrders = async () => {
    try {
      const sellerId = user?.id || user?.accountId || user?.userId;
      if (!sellerId) {
        console.warn('⚠️ No sellerId found, cannot load orders');
        return;
      }

      console.log('🔍 Loading seller orders for sellerId:', sellerId);
      
      // Use GET /api/Order (same endpoint as MyPurchases.jsx uses)
      // This endpoint returns cancellationReason properly
      const allOrders = await apiRequest(`/api/Order`);
      console.log('✅ All orders loaded from /api/Order:', allOrders);
      
      // Filter orders by sellerId
      const orders = Array.isArray(allOrders) ? allOrders : [];
      const sellerOrdersFiltered = orders.filter(order => {
        const orderSellerId = order.sellerId || order.SellerId || order.seller?.id || order.seller?.userId;
        return orderSellerId == sellerId || orderSellerId === sellerId;
      });
      
      console.log(`✅ Filtered ${sellerOrdersFiltered.length} orders for seller ${sellerId} out of ${orders.length} total orders`);
      
      // Store ALL orders (not just cancelled) so we can match by productId
      // We'll filter cancelled ones when displaying
      setSellerOrders(sellerOrdersFiltered);
      
      // Log cancelled orders for debugging
      const cancelledOrders = sellerOrdersFiltered.filter(order => {
        const status = (order.status || order.orderStatus || order.Status || order.OrderStatus || '').toLowerCase();
        const hasReason = order.cancellationReason || order.CancellationReason;
        return status === 'cancelled' && hasReason;
      });
      
      console.log('🔍 All seller orders:', sellerOrdersFiltered.length);
      console.log('🔍 Cancelled orders with reason:', cancelledOrders.length);
      cancelledOrders.forEach(order => {
        console.log(`📦 Order ${order.orderId || order.OrderId}:`, {
          productId: order.productId || order.ProductId || order.product?.productId || order.product?.id,
          status: order.status || order.orderStatus || order.Status || order.OrderStatus,
          cancellationReason: order.cancellationReason || order.CancellationReason,
          sellerId: order.sellerId || order.SellerId
        });
      });
    } catch (error) {
      console.error("❌ Error loading seller orders:", error);
    }
  };

  // Get cancellation reason for a product
  // Same logic as MyPurchases.jsx - get cancellationReason directly from order
  const getCancellationReasonForProduct = (productId) => {
    if (!productId || sellerOrders.length === 0) {
      console.log(`⚠️ No cancellation reason for product ${productId}:`, {
        hasProductId: !!productId,
        sellerOrdersCount: sellerOrders.length
      });
      return null;
    }
    
    // Try multiple ways to match productId (same as MyPurchases.jsx)
    const productIdNum = parseInt(productId);
    
    const order = sellerOrders.find(o => {
      // Match productId from various possible fields (same as MyPurchases.jsx)
      const orderProductId = o.productId || o.ProductId || o.product?.productId || o.product?.id;
      const orderProductIdNum = orderProductId ? parseInt(orderProductId) : null;
      
      // Match by productId
      const matchesId = orderProductId == productId || 
                        orderProductId === productId ||
                        orderProductIdNum === productIdNum;
      
      // Check if order is cancelled and has reason
      const status = (o.status || o.orderStatus || o.Status || o.OrderStatus || '').toLowerCase();
      const isCancelled = status === 'cancelled';
      const hasReason = o.cancellationReason || o.CancellationReason;
      
      if (matchesId) {
        console.log(`🔍 Order ${o.orderId} matches product ${productId}:`, {
          matchesId,
          isCancelled,
          hasReason,
          status,
          cancellationReason: o.cancellationReason || o.CancellationReason
        });
      }
      
      return matchesId && isCancelled && hasReason;
    });
    
    if (order) {
      // Get cancellationReason same way as MyPurchases.jsx does
      const reason = order.cancellationReason || order.CancellationReason || null;
      console.log(`✅ Found cancellation reason for product ${productId}:`, reason);
      return reason;
    }
    
    console.log(`⚠️ No cancellation reason found for product ${productId}`);
    return null;
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;

    try {
      console.log("Deleting listing with ID:", listingId);
      console.log("Type of listingId:", typeof listingId);

      if (!listingId || listingId === "undefined" || listingId === undefined) {
        alert("Không thể xóa: ID bài đăng không hợp lệ");
        return;
      }

      try {
        await apiRequest(`/api/Product/${listingId}`, {
          method: "PUT",
          body: { status: "deleted" },
        });
      } catch {
        await apiRequest(`/api/Product/${listingId}`, { method: "DELETE" });
      }
      setListings((prev) => prev.filter((l) => getListingId(l) !== listingId));
      show({
        title: "Đã chuyển vào thùng rác",
        description: "Bạn có thể khôi phục trong Thùng rác",
        type: "success",
      });
      loadListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      console.error("Error details:", error.data);
      alert(
        "Có lỗi xảy ra khi xóa bài đăng: " + (error.message || "Unknown error")
      );
    }
  };

  const handleShowRejectionReason = async (listing) => {
    console.log("🔍 Debug rejection reason:", {
      id: getListingId(listing),
      title: listing.title,
      status: listing.status,
      rejectionReason: listing.rejectionReason,
      allKeys: Object.keys(listing),
      fullListing: listing,
    });

    // Try to fetch detailed product info to get rejectionReason
    let rejectionReason = listing.rejectionReason;

    if (!rejectionReason) {
      try {
        console.log(
          "🔍 Fetching detailed product info for rejection reason..."
        );
        const detailedProduct = await apiRequest(
          `/api/Product/${getListingId(listing)}`
        );
        console.log("🔍 Detailed product response:", detailedProduct);
        rejectionReason =
          detailedProduct?.rejectionReason || detailedProduct?.rejection_reason;
      } catch (error) {
        console.warn("⚠️ Failed to fetch detailed product info:", error);
      }
    }

    setSelectedRejection({
      rejectionReason: rejectionReason || "Không có lý do cụ thể được cung cấp",
      rejectedAt: listing.rejectedAt || listing.updatedAt || listing.updated_at,
      rejectedBy: listing.rejectedBy || "Admin",
    });
    setShowRejectionModal(true);
  };


  const getStatusBadge = (status, rejectionReason = null) => {
    const s = status ? status : "pending";
    
    // Check if this is a reported product (rejected due to report)
    const isReported = s === "rejected" && rejectionReason && rejectionReason.startsWith("[BÁO CÁO]");
    
    const statusConfig = {
      pending: {
        className: "mylistings-status-badge mylistings-status-pending",
        label: "Chờ duyệt",
      },
      resubmit: {
        className: "mylistings-status-badge mylistings-status-resubmit",
        label: "Cần duyệt lại",
      },
      approved: {
        className: "mylistings-status-badge mylistings-status-approved",
        label: "Đã duyệt",
      },
      rejected: {
        className: isReported ? "mylistings-status-badge mylistings-status-rejected" : "mylistings-status-badge mylistings-status-rejected",
        label: isReported ? "Bị báo cáo" : "Từ chối",
      },
      reserved: {
        className: "mylistings-status-badge mylistings-status-reserved",
        label: "Đang trong quá trình thanh toán",
      },
      sold: {
        className: "mylistings-status-badge mylistings-status-sold",
        label: "Đã bán",
      },
    };
    const config = statusConfig[s] || statusConfig.pending;
    return <span className={config.className}>{config.label}</span>;
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      (listing.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.model || "").toLowerCase().includes(searchTerm.toLowerCase());
    const s = getStatus(listing);
    const matchesStatus = statusFilter === "all" || s === statusFilter;
    const matchesProductType =
      productTypeFilter === "all" ||
      (listing.productType &&
        listing.productType.toLowerCase() === productTypeFilter.toLowerCase());

    // Debug: Log filtering details
    if (productTypeFilter !== "all") {
      console.log(
        `🔍 Filtering product ${listing.productId} (${listing.title}):`,
        {
          productType: listing.productType,
          filter: productTypeFilter,
          matches: matchesProductType,
        }
      );
    }

    return matchesSearch && matchesStatus && matchesProductType;
  });

  console.log("🔍 MyListings render state:", {
    loading,
    listingsCount: listings.length,
    user: !!user,
    activeTab,
  });

  if (loading) {
    console.log("🔍 MyListings showing loading state");
    return (
      <div className="mylistings-loading">
        <div className="mylistings-loading-content">
          <div className="mylistings-spinner"></div>
          <p className="mylistings-loading-text">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mylistings-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mylistings-header">
          <div className="mylistings-header-content">
            <div className="mylistings-title-section">
              <h1 className="mylistings-title">Quản lý tin đăng</h1>
              <p className="mylistings-subtitle">
                Quản lý và theo dõi các bài đăng của bạn
              </p>
            </div>
            <div className="mylistings-actions">
              <Link to="/trash" className="mylistings-trash-button">
                Thùng rác
              </Link>
              <Link to="/create-listing" className="mylistings-create-button">
                <Plus className="mylistings-create-icon" />
                Đăng tin mới
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mylistings-tabs">
          <button
            onClick={() => setActiveTab("listings")}
            className={`mylistings-tab ${
              activeTab === "listings" ? "mylistings-tab-active" : ""
            }`}
          >
            <Package className="h-4 w-4 mr-2" />
            Tất cả tin đăng
          </button>
        </div>

        {/* Content */}
        <>
          {/* Filters */}
          <div className="mylistings-filters">
            <div className="mylistings-filters-grid">
              <div className="mylistings-search-container">
                <Search className="mylistings-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề, hãng xe, model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mylistings-search-input"
                />
              </div>
              <div className="mylistings-filter-container">
                <Filter className="mylistings-filter-icon" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mylistings-filter-select"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="reserved">Đang thanh toán</option>
                  <option value="rejected">Từ chối</option>
                  <option value="sold">Đã bán</option>
                </select>
              </div>
              <div className="mylistings-filter-container">
                <Package className="mylistings-filter-icon" />
                <select
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                  className="mylistings-filter-select"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="vehicle">🚗 Xe điện</option>
                  <option value="battery">🔋 Pin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <div className="mylistings-empty-state">
              <div className="mylistings-empty-icon-container">
                <Eye className="mylistings-empty-icon" />
              </div>
              <h3 className="mylistings-empty-title">
                {listings.length === 0
                  ? "Chưa có tin đăng nào"
                  : "Không tìm thấy tin đăng phù hợp"}
              </h3>
              <p className="mylistings-empty-description">
                {listings.length === 0
                  ? "Hãy tạo bài đăng đầu tiên của bạn"
                  : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"}
              </p>
              {listings.length === 0 && (
                <Link to="/create-listing" className="mylistings-empty-button">
                  <Plus className="mylistings-empty-button-icon" />
                  Tạo tin đăng đầu tiên
                </Link>
              )}
            </div>
          ) : (
            <div className="mylistings-grid">
              {filteredListings.map((listing) => {
                const idVal = getListingId(listing);
                return (
                  <div key={idVal} className="mylistings-card">
                    <div className="mylistings-image-container">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="mylistings-image"
                          onError={(e) => {
                            e.target.style.display = "none";
                            // Show fallback icon when image fails to load
                            const fallback = e.target.nextElementSibling;
                            if (fallback) {
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`mylistings-image-placeholder ${
                          listing.images && listing.images.length > 0
                            ? "mylistings-image-placeholder-hidden"
                            : ""
                        }`}
                      >
                        <Package className="mylistings-image-placeholder-icon" />
                      </div>
                      <div className="mylistings-status-badge-container">
                        {getStatusBadge(getStatus(listing), listing.rejectionReason)}
                      </div>

                      {/* Rejection reason button on image - LEFT SIDE */}
                      {getStatus(listing) === "rejected" && (
                        <button
                          onClick={() => handleShowRejectionReason(listing)}
                          className="mylistings-rejection-overlay-button"
                          title={listing.rejectionReason && listing.rejectionReason.startsWith("[BÁO CÁO]") ? "Xem lý do báo cáo" : "Xem lý do từ chối"}
                        >
                          <AlertTriangle className="mylistings-rejection-overlay-icon" />
                          <span className="mylistings-rejection-overlay-text">
                            {listing.rejectionReason && listing.rejectionReason.startsWith("[BÁO CÁO]") ? "Lý do báo cáo" : "Lý do từ chối"}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="mylistings-card-content">
                      <h3 className="mylistings-card-title">{listing.title}</h3>
                      <p className="mylistings-card-subtitle">
                        {listing.licensePlate || listing.license_plate || ""}
                      </p>
                      <p className="mylistings-card-price">
                        {formatPrice(listing.price)}
                      </p>

                      <div className="mylistings-card-meta">
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

                      {/* Show cancellation reason if product has cancelled order and status is Active/Approved */}
                      {(() => {
                        const listingId = getListingId(listing);
                        const listingStatus = getStatus(listing);
                        const cancellationReason = getCancellationReasonForProduct(listingId);
                        
                        // Debug log for approved/active products
                        if (listingStatus === "approved" || listingStatus === "active") {
                          console.log(`🔍 Product ${listingId} (${listing.title}):`, {
                            status: listingStatus,
                            hasCancellationReason: !!cancellationReason,
                            cancellationReason: cancellationReason,
                            sellerOrdersCount: sellerOrders.length
                          });
                        }
                        
                        // Show if product is approved/active AND has cancellation reason
                        if ((listingStatus === "approved" || listingStatus === "active") && cancellationReason) {
                          return (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-orange-900 mb-1">
                                    ⚠️ Đơn hàng đã bị admin hủy
                                  </p>
                                  <p className="text-xs text-orange-800">
                                    <span className="font-medium">Lý do:</span> {cancellationReason}
                                  </p>
                                  <p className="text-xs text-orange-600 mt-1">
                                    Sản phẩm đã được trả về trang chủ để bạn có thể bán lại.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="mylistings-card-actions">
                        <Link
                          to={`/product/${getListingId(listing)}`}
                          className="mylistings-view-button"
                        >
                          <Eye className="mylistings-view-icon" />
                          Xem
                        </Link>
                        
                        {/* Show different buttons based on status */}
                        {getStatus(listing) === "reserved" ? (
                          <div className="mylistings-status-info">
                            <span className="mylistings-waiting-text">
                              Đang chờ Admin xác nhận
                            </span>
                          </div>
                        ) : (
                          <Link
                            to={`/listing/${getListingId(listing)}/edit`}
                            className="mylistings-edit-button"
                          >
                            <Edit className="mylistings-edit-icon" />
                            Chỉnh sửa
                          </Link>
                        )}
                        
                        {/* Verification Button - Only show for vehicle owners with NotRequested status */}
                        {(listing.productType === "vehicle" || listing.productType === "Vehicle") && 
                         (listing.verificationStatus === "NotRequested" || 
                          listing.verificationStatus === null || 
                          listing.verificationStatus === undefined ||
                          !listing.verificationStatus ||
                          listing.verificationStatus === "") && 
                         // Don't show if already verified or in progress
                         listing.verificationStatus !== "Verified" &&
                         listing.verificationStatus !== "Requested" &&
                         listing.verificationStatus !== "InProgress" &&
                         // Additional security check: ensure current user is the owner
                         (listing.sellerId === (user?.id || user?.userId || user?.accountId) ||
                          listing.seller_id === (user?.id || user?.userId || user?.accountId)) && (
                          <VerificationButton
                            productId={getListingId(listing)}
                            currentStatus={listing.verificationStatus || "NotRequested"}
                            isOwner={true}
                          />
                        )}
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            // Try different ID field names
                            const listingId = getListingId(listing);
                            console.log("Trying to delete with ID:", listingId);
                            handleDelete(listingId);
                          }}
                          className="mylistings-delete-button"
                        >
                          <Trash2 className="mylistings-delete-icon" />
                        </button>
                      </div>
                      
                      {/* Verification Status Badge - Bottom Right */}
                      {listing.verificationStatus === 'Verified' && (
                        <div className="absolute bottom-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã kiểm định
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          {listings.length > 0 && (
            <div className="mylistings-stats">
              <h3 className="mylistings-stats-title">Thống kê</h3>
              <div className="mylistings-stats-grid">
                <div className="mylistings-stat-item">
                  <p className="mylistings-stat-value">{listings.length}</p>
                  <p className="mylistings-stat-label">Tổng tin đăng</p>
                </div>
                <div className="mylistings-stat-item">
                  <p className="mylistings-stat-value mylistings-stat-value-green">
                    {listings.filter((l) => getStatus(l) === "approved").length}
                  </p>
                  <p className="mylistings-stat-label">Đã duyệt</p>
                </div>
                <div className="mylistings-stat-item">
                  <p className="mylistings-stat-value mylistings-stat-value-yellow">
                    {listings.filter((l) => getStatus(l) === "pending").length}
                  </p>
                  <p className="mylistings-stat-label">Chờ duyệt</p>
                </div>
                <div className="mylistings-stat-item">
                  <p className="mylistings-stat-value" style={{color: '#ea580c'}}>
                    {listings.filter((l) => getStatus(l) === "reserved").length}
                  </p>
                  <p className="mylistings-stat-label">Đang thanh toán</p>
                </div>
                <div className="mylistings-stat-item">
                  <p className="mylistings-stat-value mylistings-stat-value-gray">
                    {listings.filter((l) => getStatus(l) === "sold").length}
                  </p>
                  <p className="mylistings-stat-label">Đã bán</p>
                </div>
              </div>
            </div>
          )}
        </>
      </div>

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        rejectionReason={selectedRejection?.rejectionReason}
        rejectedAt={selectedRejection?.rejectedAt}
        rejectedBy={selectedRejection?.rejectedBy}
      />
    </div>
  );
};
