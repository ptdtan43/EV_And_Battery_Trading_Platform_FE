import { useState, useEffect } from "react";
import { Star, Package, Calendar, CheckCircle, MessageSquare } from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";
import { CreateRatingModal } from "../components/common/RatingSystem";

export const MyRatings = () => {
  const [rateableOrders, setRateableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    loadRateableOrders();
  }, []);

  const loadRateableOrders = async () => {
    try {
      setLoading(true);
      const orders = await apiRequest("/api/Rating/rateable-orders");
      setRateableOrders(orders);
    } catch (error) {
      console.error("Error loading rateable orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateOrder = (order) => {
    setSelectedOrder(order);
    setShowRatingModal(true);
  };

  const handleCloseModal = () => {
    setShowRatingModal(false);
    setSelectedOrder(null);
    // Reload orders to update hasRating status
    loadRateableOrders();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đánh giá sản phẩm
          </h1>
          <p className="text-gray-600">
            Đánh giá các sản phẩm bạn đã mua để giúp người khác có thêm thông tin
          </p>
        </div>

        {rateableOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có đơn hàng nào để đánh giá
            </h3>
            <p className="text-gray-500">
              Các đơn hàng đã hoàn tất sẽ xuất hiện ở đây để bạn có thể đánh giá
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {rateableOrders.map((order) => (
              <div key={order.orderId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.productTitle}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Bán bởi {order.sellerName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Hoàn tất: {formatDate(order.completedDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Package className="h-4 w-4" />
                        <span>Đơn #{order.orderId}</span>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </div>

                    {order.hasRating ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Đã đánh giá</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <Star className="h-5 w-5" />
                        <span className="text-sm font-medium">Chưa đánh giá</span>
                      </div>
                    )}
                  </div>

                  <div className="ml-6">
                    {!order.hasRating ? (
                      <button
                        onClick={() => handleRateOrder(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Star className="h-4 w-4" />
                        <span>Đánh giá</span>
                      </button>
                    ) : (
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">Đã đánh giá</div>
                        <div className="flex items-center justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="h-4 w-4 text-yellow-400 fill-current"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        <CreateRatingModal
          isOpen={showRatingModal}
          onClose={handleCloseModal}
          order={selectedOrder}
        />
      </div>
    </div>
  );
};

