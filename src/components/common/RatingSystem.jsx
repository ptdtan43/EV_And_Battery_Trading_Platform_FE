import { useState, useEffect } from "react";
import { Star, MessageSquare, User, Calendar, Package } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { formatPrice, formatDate } from "../../utils/formatters";

export const RatingSystem = ({ productId, sellerId }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sellerId) {
      loadSellerRatings();
    }
  }, [sellerId]);

  const loadSellerRatings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/Review/reviewee/${sellerId}`);
      
      // API trả về array trực tiếp, không phải object với ratings property
      const ratingsArray = Array.isArray(response) ? response : (response.ratings || []);
      
      // ✅ Sort reviews by date (newest first)
      const sortedRatings = ratingsArray.sort((a, b) => {
        const dateA = new Date(a.createdDate || a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdDate || b.createdAt || b.created_at || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setRatings(sortedRatings);
      
      // Tính toán average rating và total ratings
      const totalRatings = sortedRatings.length;
      const averageRating = totalRatings > 0 
        ? sortedRatings.reduce((sum, rating) => sum + (rating.rating || rating.ratingValue || 0), 0) / totalRatings
        : 0;
      
      setAverageRating(averageRating);
      setTotalRatings(totalRatings);
    } catch (error) {
      console.error("Error loading ratings:", error);
      setRatings([]);
      setAverageRating(0);
      setTotalRatings(0);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Đánh giá từ khách hàng
        </h3>
        
        <div className="flex items-center space-x-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-sm text-gray-500">
              {totalRatings} đánh giá
            </div>
          </div>
          
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratings.filter(r => (r.rating || r.ratingValue) === star).length;
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center space-x-2 mb-1">
                  <span className="text-sm text-gray-600 w-2">{star}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Individual Ratings */}
      {ratings.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">
            Đánh giá chi tiết ({ratings.length})
          </h4>
          {ratings.map((rating) => (
            <div key={rating.ratingId} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {rating.reviewerName || rating.buyerName || rating.userName || 'Người dùng'}
                    </span>
                    <div className="flex items-center">
                      {renderStars(rating.rating || rating.ratingValue)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(rating.createdDate || rating.createdAt)}
                    </span>
                  </div>
                  
                    {rating.content && (
                      <p className="text-gray-700 text-sm mb-2">
                        {rating.content}
                      </p>
                    )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Package className="h-3 w-3" />
                      <span>{rating.productTitle || rating.productName || 'Sản phẩm'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Đơn #{rating.orderId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Chưa có đánh giá nào</p>
          <p className="text-sm text-gray-500 mt-2">
            Hãy là người đầu tiên đánh giá sản phẩm này
          </p>
        </div>
      )}
    </div>
  );
};

export const CreateRatingModal = ({ isOpen, onClose, order }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá");
      return;
    }

    try {
      setSubmitting(true);
        await apiRequest("/api/Review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            OrderId: order.orderId,
            RevieweeId: order.sellerId || order.seller?.id || 1,
            Rating: rating,
            Content: comment.trim() || "",
          },
        });image.png

      alert("Đánh giá đã được gửi thành công!");
      onClose();
      // Refresh the page or call a callback to update ratings
      window.location.reload();
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Đánh giá sản phẩm
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            {order?.productTitle}
          </p>
          <p className="text-sm text-gray-500">
            Đơn hàng #{order?.orderId} • {formatPrice(order?.totalAmount)}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đánh giá của bạn
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 1 && "Rất không hài lòng"}
              {rating === 2 && "Không hài lòng"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Hài lòng"}
              {rating === 5 && "Rất hài lòng"}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét (tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 ký tự
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang gửi...
                </>
              ) : (
                "Gửi đánh giá"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

