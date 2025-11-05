import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, MessageCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiRequest } from "../../lib/api";
import { validateAndShowWarning } from "../../utils/messageValidator";

export const ChatModal = ({ isOpen, onClose, seller, product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    // Validate message trước khi gửi
    if (!validateAndShowWarning(message, showToast)) {
      return; // Dừng lại nếu tin nhắn không hợp lệ
    }

    setSending(true);
    try {
      // Get IDs
      const sellerId = parseInt(seller?.userId || seller?.id);
      const currentUserId = parseInt(user?.id || user?.userId);
      
      console.log("💬 Starting chat flow");
      console.log("  Seller ID:", sellerId);
      console.log("  Current User ID:", currentUserId);
      console.log("  Message:", message);

      // Validate
      if (!sellerId || isNaN(sellerId)) {
        throw new Error("Không tìm thấy thông tin người bán");
      }
      
      if (!currentUserId || isNaN(currentUserId)) {
        throw new Error("Vui lòng đăng nhập để gửi tin nhắn");
      }

      if (sellerId === currentUserId) {
        throw new Error("Bạn không thể nhắn tin với chính mình");
      }

      // Step 1: Start/Get chat with seller
      console.log(`📨 Step 1: POST /api/Chat/start-chat/${sellerId}`);
      const chatResponse = await apiRequest(`/api/Chat/start-chat/${sellerId}`, {
        method: "POST",
      });
      
      console.log("✅ Chat response:", chatResponse);

      if (!chatResponse?.chatId) {
        throw new Error("Không thể tạo cuộc trò chuyện");
      }

      const chatId = chatResponse.chatId;

      // Step 2: Send initial message
      console.log(`📤 Step 2: POST /api/Message`);
      const messageData = {
        chatId: parseInt(chatId),
        senderId: currentUserId,
        content: message.trim()
      };
      console.log("  Message data:", messageData);

      const messageResponse = await apiRequest("/api/Message", {
        method: "POST",
        body: messageData
      });

      console.log("✅ Message sent:", messageResponse);

      // Success!
      showToast({
        title: "✅ Thành công",
        description: "Tin nhắn đã được gửi!",
        type: "success"
      });

      // Close modal and redirect
      setMessage("");
      onClose();
      
      console.log(`🔀 Redirecting to /chats?chat=${chatId}`);
      navigate(`/chats?chat=${chatId}`);
      
    } catch (error) {
      console.error("❌ Error:", error);
      
      let errorMsg = "Có lỗi xảy ra. Vui lòng thử lại.";
      if (error.message.includes("đăng nhập")) {
        errorMsg = error.message;
      } else if (error.message.includes("người bán")) {
        errorMsg = error.message;
      } else if (error.message.includes("chính mình")) {
        errorMsg = error.message;
      }
      
      showToast({
        title: "❌ Lỗi",
        description: errorMsg,
        type: "error"
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Liên hệ người bán</h3>
                <p className="text-sm text-green-100">{seller?.fullName || "Người bán"}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-green-200">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Product Info */}
        {product && (
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                {product.productType?.toLowerCase() === "battery" ? "🔋" : "🚗"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 line-clamp-1">{product.title}</p>
                <p className="text-sm text-gray-500">
                  {product.productType?.toLowerCase() === "battery" ? "Pin điện" : "Xe điện"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tin nhắn của bạn
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={sending}
              required
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={sending}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Gửi tin nhắn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
