import { useState, useEffect } from "react";
import { CheckCircle, Clock, User, Phone, Mail, DollarSign, Calendar } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { formatPrice } from "../../utils/formatters";

export const SellerTransactionConfirmation = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    try {
      setLoading(true);
      const orders = await apiRequest("/api/Order/seller-pending");
      setPendingOrders(orders);
    } catch (error) {
      console.error("Error loading pending orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransaction = async (orderId) => {
    try {
      setConfirming(orderId);
      await apiRequest(`/api/Order/${orderId}/seller-confirm`, {
        method: "POST",
      });

      // Reload orders
      await loadPendingOrders();
      
      // Show success message
      alert("Xác nhận giao dịch thành công! Chờ admin duyệt để hoàn tất.");
    } catch (error) {
      console.error("Error confirming transaction:", error);
      alert("Có lỗi xảy ra khi xác nhận giao dịch");
    } finally {
      setConfirming(null);
    }
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
          Không có giao dịch nào chờ xác nhận
        </h3>
        <p className="text-gray-500">
          Tất cả giao dịch đã được xác nhận hoặc chưa có giao dịch nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-blue-900">
            Giao dịch chờ xác nhận ({pendingOrders.length})
          </h2>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Xác nhận các giao dịch đã hoàn tất để admin có thể duyệt và hoàn tất quy trình.
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.buyerName}</p>
                  <p className="text-sm text-gray-500">Người mua</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.buyerEmail}</p>
                  <p className="text-sm text-gray-500">Email</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.buyerPhone || 'Chưa cung cấp'}</p>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Chờ bạn xác nhận giao dịch</span>
              </div>
              <button
                onClick={() => handleConfirmTransaction(order.orderId)}
                disabled={confirming === order.orderId}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {confirming === order.orderId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xác nhận...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Xác nhận giao dịch</span>
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

