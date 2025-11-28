import { useState, useEffect } from "react";
import { CheckCircle, Clock, User, Phone, Mail, DollarSign, Calendar, MessageSquare } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { formatPrice } from "../../utils/formatters";

export const AdminTransactionApproval = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    try {
      setLoading(true);
      const orders = await apiRequest("/api/Order/admin-pending");
      setPendingOrders(orders);
    } catch (error) {
      console.error("Error loading pending orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminConfirm = async (orderId) => {
    try {
      setConfirming(orderId);
      
      // Get order details to find product ID
      const order = pendingOrders.find(o => o.orderId === orderId);
      
      await apiRequest(`/api/Order/${orderId}/admin-confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminNotes: adminNotes[orderId] || "",
        }),
      });

      // ✅ Update product status to Sold if product ID is available
      if (order && order.productId) {
        try {
          await apiRequest(`/api/Product/${order.productId}/status`, {
            method: 'PUT',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: 'Sold'
            })
          });
          console.log(`✅ Product ${order.productId} status updated to Sold`);
        } catch (productError) {
          console.error('Failed to update product status:', productError);
          // Continue even if product update fails
        }
      }

      // ✅ Trigger seller profile reload via localStorage event
      localStorage.setItem('seller_profile_reload', Date.now().toString());
      
      // Reload orders
      await loadPendingOrders();
      
      // Clear notes for this order
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[orderId];
        return newNotes;
      });
      
      // Show success message
      alert("Admin đã xác nhận giao dịch thành công! Sản phẩm đã được chuyển sang trạng thái Đã bán.");
    } catch (error) {
      console.error("Error admin confirming transaction:", error);
      alert("Có lỗi xảy ra khi admin xác nhận giao dịch");
    } finally {
      setConfirming(null);
    }
  };

  const updateAdminNotes = (orderId, notes) => {
    setAdminNotes(prev => ({
      ...prev,
      [orderId]: notes,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center p-8">
        <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có giao dịch nào chờ admin duyệt
        </h3>
        <p className="text-gray-500">
          Tất cả giao dịch đã được duyệt hoặc chưa có giao dịch nào chờ duyệt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-orange-600 mr-2" />
          <h2 className="text-lg font-semibold text-orange-900">
            Giao dịch chờ admin duyệt ({pendingOrders.length})
          </h2>
        </div>
        <p className="text-orange-700 text-sm mt-1">
          Các giao dịch đã được seller xác nhận, chờ admin duyệt để hoàn tất.
        </p>
      </div>

      <div className="grid gap-6">
        {pendingOrders.map((order) => (
          <div key={order.orderId} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {order.productTitle}
                </h3>
                <p className="text-sm text-gray-500">
                  Đơn hàng #{order.orderId} • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  {formatPrice(order.depositAmount)}
                </div>
                <div className="text-sm text-gray-500">
                  Tổng: {formatPrice(order.totalAmount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Buyer Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Thông tin người mua
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{order.buyerName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{order.buyerEmail}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{order.buyerPhone || 'Chưa cung cấp'}</span>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Thông tin người bán
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{order.sellerName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{order.sellerEmail}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{order.sellerPhone || 'Chưa cung cấp'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Confirmation Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Seller đã xác nhận giao dịch
                </span>
                <span className="text-xs text-green-600">
                  ({new Date(order.sellerConfirmedDate).toLocaleString('vi-VN')})
                </span>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Ghi chú của admin (tùy chọn)
              </label>
              <textarea
                value={adminNotes[order.orderId] || ""}
                onChange={(e) => updateAdminNotes(order.orderId, e.target.value)}
                placeholder="Nhập ghi chú về giao dịch này..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <Clock className="h-4 w-4" />
                <span>Chờ admin duyệt để hoàn tất giao dịch</span>
              </div>
              <button
                onClick={() => handleAdminConfirm(order.orderId)}
                disabled={confirming === order.orderId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {confirming === order.orderId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang duyệt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Duyệt giao dịch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

