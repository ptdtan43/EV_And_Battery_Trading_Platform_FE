import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { Package, AlertTriangle } from "lucide-react";
import { useToast } from "../contexts/ToastContext";

export const Trash = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Removed actionLoading state - no actions needed

  const getListingId = (l) =>
    l?.id ?? l?.productId ?? l?.Id ?? l?.listingId ?? l?.product_id ?? null;
  const norm = (v) => String(v || "").toLowerCase();
  const isDeleted = (l) => norm(l?.status || l?.Status || "") === "deleted";

  useEffect(() => {
    (async () => {
      try {
        console.log("🔄 Loading trash items from drafts endpoint...");

        // Try the drafts endpoint first
        let deletedItems = [];
        try {
          const draftsData = await apiRequest(`/api/Product/drafts`);
          console.log("📋 Drafts response:", draftsData);
          deletedItems = Array.isArray(draftsData)
            ? draftsData
            : draftsData?.items || [];
          console.log("📋 Found drafts items:", deletedItems.length);
        } catch (draftsError) {
          console.log(
            "❌ Drafts endpoint failed, trying seller endpoint:",
            draftsError.message
          );

          // Fallback to seller endpoint and filter
          const data = await apiRequest(
            `/api/Product/seller/${user?.id || user?.accountId || user?.userId}`
          );
          const list = Array.isArray(data) ? data : data?.items || [];
          deletedItems = list.filter(isDeleted);
          console.log(
            "📋 Found deleted items from seller:",
            deletedItems.length
          );
        }

        // Load images for deleted items
        const itemsWithImages = await Promise.all(
          deletedItems.map(async (l) => {
            try {
              const imagesData = await apiRequest(
                `/api/ProductImage/product/${l.id || l.productId || l.Id}`
              );
              const images = Array.isArray(imagesData)
                ? imagesData
                : imagesData?.items || [];
              return {
                ...l,
                images: images.map(
                  (img) => img.imageData || img.imageUrl || img.url
                ),
              };
            } catch {
              return { ...l, images: [] };
            }
          })
        );

        console.log("✅ Loaded trash items:", itemsWithImages.length);
        setItems(itemsWithImages);
      } catch (e) {
        console.error("❌ Error loading trash:", e);
        setError(e.message || "Không thể tải thùng rác");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Removed restore function - only display deleted items
  const _restore = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: "restore" }));
    try {
      console.log("🔄 Attempting to restore product:", id);

      // Try different approaches to restore the product
      let response;

      // Approach 1: Update status to pending
      try {
        console.log("🔄 Trying approach 1: Update status to pending");
        response = await apiRequest(`/api/Product/${id}`, {
          method: "PUT",
          body: { status: "pending" },
        });
        console.log("✅ Approach 1 success:", response);
      } catch (e1) {
        console.log("❌ Approach 1 failed:", e1.message);

        // Approach 2: Try with different field names
        try {
          console.log("🔄 Trying approach 2: Update with Status field");
          response = await apiRequest(`/api/Product/${id}`, {
            method: "PUT",
            body: { Status: "pending" },
          });
          console.log("✅ Approach 2 success:", response);
        } catch (e2) {
          console.log("❌ Approach 2 failed:", e2.message);

          // Approach 3: Try with isActive field
          try {
            console.log("🔄 Trying approach 3: Update with isActive field");
            response = await apiRequest(`/api/Product/${id}`, {
              method: "PUT",
              body: {
                status: "pending",
                isActive: true,
                IsActive: true,
              },
            });
            console.log("✅ Approach 3 success:", response);
          } catch (e3) {
            console.log("❌ Approach 3 failed:", e3.message);
            throw e1; // Throw the original error
          }
        }
      }

      setItems((prev) => prev.filter((x) => getListingId(x) !== id));
      show({
        title: "✅ Khôi phục thành công",
        description:
          "Sản phẩm đã được khôi phục và chuyển về trạng thái chờ duyệt",
        type: "success",
      });
    } catch (e) {
      console.error("❌ All restore approaches failed:", e);
      console.error("Error details:", {
        message: e.message,
        status: e.status,
        response: e.response,
      });
      show({
        title: "❌ Không thể khôi phục",
        description: e.message || "Có lỗi xảy ra khi khôi phục sản phẩm",
        type: "error",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Removed hardDelete function - only display deleted items
  const _hardDelete = async (id) => {
    if (!confirm("Xóa vĩnh viễn? Hành động này không thể hoàn tác!")) return;
    setActionLoading((prev) => ({ ...prev, [id]: "delete" }));
    try {
      console.log("🗑️ Attempting to hard delete product:", id);

      // Try different approaches for hard delete
      let response;

      // Approach 1: Standard DELETE
      try {
        console.log("🗑️ Trying approach 1: Standard DELETE");
        response = await apiRequest(`/api/Product/${id}`, {
          method: "DELETE",
        });
        console.log("✅ Approach 1 success:", response);
      } catch (e1) {
        console.log("❌ Approach 1 failed:", e1.message);

        // Approach 2: Try with force parameter
        try {
          console.log("🗑️ Trying approach 2: DELETE with force parameter");
          response = await apiRequest(`/api/Product/${id}?force=true`, {
            method: "DELETE",
          });
          console.log("✅ Approach 2 success:", response);
        } catch (e2) {
          console.log("❌ Approach 2 failed:", e2.message);

          // Approach 3: Try with hardDelete parameter
          try {
            console.log(
              "🗑️ Trying approach 3: DELETE with hardDelete parameter"
            );
            response = await apiRequest(`/api/Product/${id}?hardDelete=true`, {
              method: "DELETE",
            });
            console.log("✅ Approach 3 success:", response);
          } catch (e3) {
            console.log("❌ Approach 3 failed:", e3.message);
            throw e1; // Throw the original error
          }
        }
      }

      setItems((prev) => prev.filter((x) => getListingId(x) !== id));
      show({
        title: "🗑️ Xóa vĩnh viễn thành công",
        description: "Sản phẩm đã được xóa vĩnh viễn khỏi hệ thống",
        type: "success",
      });
    } catch (e) {
      console.error("❌ All hard delete approaches failed:", e);
      console.error("Error details:", {
        message: e.message,
        status: e.status,
        response: e.response,
      });
      show({
        title: "❌ Không thể xóa vĩnh viễn",
        description: e.message || "Có lỗi xảy ra khi xóa sản phẩm",
        type: "error",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Đang tải thùng rác...</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🗑️ Thùng rác</h1>
            <p className="text-gray-600 mt-1">Quản lý các sản phẩm đã bị xóa</p>
          </div>
          <Link
            to="/my-listings"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Quay lại danh sách
          </Link>
        </div>
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Thùng rác trống
            </h3>
            <p className="text-gray-600">
              Không có sản phẩm nào trong thùng rác
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((l) => {
              const id = getListingId(l);
              return (
                <div
                  key={id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={
                            l.images && l.images.length > 0
                              ? l.images[0]
                              : "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=100"
                          }
                          alt="thumb"
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=100";
                          }}
                        />
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Đã xóa
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {l.title}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Biển số:</span>{" "}
                            {l.licensePlate ||
                              l.license_plate ||
                              "Chưa cập nhật"}
                          </div>
                          <div>
                            <span className="font-medium">Giá:</span>{" "}
                            {l.price
                              ? new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(l.price)
                              : "Chưa cập nhật"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg inline-flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Đã xóa
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
