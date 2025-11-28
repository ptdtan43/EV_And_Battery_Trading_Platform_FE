import { apiRequest } from "./api";

/**
 * AI Chat API Service
 * Tích hợp với API AI thực tế của bạn
 */
export class AIChatService {
  /**
   * Gửi tin nhắn đến AI API
   * @param {string} message - Tin nhắn của người dùng
   * @param {string} userId - ID người dùng (optional)
   * @param {Array} conversationHistory - Lịch sử cuộc trò chuyện (optional)
   * @returns {Promise<string>} - Phản hồi từ AI
   */
  static async sendMessage(message, userId = null, conversationHistory = []) {
    try {
      // Tạo danh sách messages theo format của backend
      const messages = [
        // System message để định hướng AI
        {
          role: "system",
          content: `Bạn là AI Assistant của nền tảng EV Market - hệ thống mua bán xe điện và pin tại Việt Nam. 
          
Nhiệm vụ của bạn:
- Chỉ trả lời các câu hỏi liên quan đến hệ thống EV Market
- Hỗ trợ người dùng về các tính năng: đăng tin, kiểm duyệt, thanh toán, quản lý tài khoản
- Cung cấp thông tin về xe điện và pin
- Hướng dẫn sử dụng hệ thống
- Từ chối lịch sự các câu hỏi không liên quan đến hệ thống

Nếu người dùng hỏi về vấn đề không liên quan đến hệ thống, hãy trả lời: "Xin lỗi, tôi chỉ có thể cung cấp thông tin liên quan đến nền tảng Mua bán Xe Điện và Pin."

Trả lời bằng tiếng Việt, ngắn gọn và hữu ích.`
        },
        // Thêm lịch sử cuộc trò chuyện
        ...conversationHistory,
        // Tin nhắn hiện tại
        {
          role: "user",
          content: message
        }
      ];

      const response = await apiRequest('/api/AI/chat', {
        method: 'POST',
        body: {
          messages: messages,
          userId: userId,
          timestamp: new Date().toISOString()
        }
      });

      return response.content || response.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
    } catch (error) {
      console.error('AI Chat API Error:', error);
      
      // Fallback response khi API lỗi
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Gửi tin nhắn với streaming (nếu backend hỗ trợ)
   * @param {string} message - Tin nhắn của người dùng
   * @param {string} userId - ID người dùng (optional)
   * @param {Array} conversationHistory - Lịch sử cuộc trò chuyện (optional)
   * @param {Function} onChunk - Callback khi nhận được chunk
   * @returns {Promise<string>} - Phản hồi đầy đủ từ AI
   */
  static async sendMessageStream(message, userId = null, conversationHistory = [], onChunk = null) {
    try {
      const messages = [
        {
          role: "system",
          content: `Bạn là AI Assistant của nền tảng EV Market - hệ thống mua bán xe điện và pin tại Việt Nam. 
          
Nhiệm vụ của bạn:
- Chỉ trả lời các câu hỏi liên quan đến hệ thống EV Market
- Hỗ trợ người dùng về các tính năng: đăng tin, kiểm duyệt, thanh toán, quản lý tài khoản
- Cung cấp thông tin về xe điện và pin
- Hướng dẫn sử dụng hệ thống
- Từ chối lịch sự các câu hỏi không liên quan đến hệ thống

Nếu người dùng hỏi về vấn đề không liên quan đến hệ thống, hãy trả lời: "Xin lỗi, tôi chỉ có thể cung cấp thông tin liên quan đến nền tảng Mua bán Xe Điện và Pin."

Trả lời bằng tiếng Việt, ngắn gọn và hữu ích.`
        },
        ...conversationHistory,
        {
          role: "user",
          content: message
        }
      ];

      // Sử dụng streaming endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5044'}/api/AI/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('evtb_auth') ? JSON.parse(localStorage.getItem('evtb_auth')).token : ''}`
        },
        body: JSON.stringify({
          messages: messages,
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullResponse += data.content;
                  if (onChunk) {
                    onChunk(data.content);
                  }
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullResponse;
    } catch (error) {
      console.error('AI Chat Stream Error:', error);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Lấy phản hồi dự phòng khi API lỗi
   * @param {string} message - Tin nhắn của người dùng
   * @returns {string} - Phản hồi dự phòng
   */
  static getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("đăng tin") || lowerMessage.includes("tạo tin")) {
      return "Để đăng tin bán xe điện hoặc pin, bạn có thể:\n\n1. Vào trang Dashboard\n2. Nhấn nút 'Đăng tin mới'\n3. Điền đầy đủ thông tin sản phẩm\n4. Upload hình ảnh\n5. Nhấn 'Đăng tin'\n\nTin đăng sẽ được admin kiểm duyệt trước khi hiển thị công khai.";
    }
    
    if (lowerMessage.includes("duyệt") || lowerMessage.includes("kiểm duyệt")) {
      return "Quy trình kiểm duyệt tin đăng:\n\n1. Tin đăng được gửi với trạng thái 'Chờ duyệt'\n2. Admin sẽ xem xét thông tin và hình ảnh\n3. Tin đăng được 'Duyệt' hoặc 'Từ chối'\n4. Bạn sẽ nhận thông báo về kết quả\n\nThời gian duyệt thường từ 1-3 ngày làm việc.";
    }
    
    if (lowerMessage.includes("giá") || lowerMessage.includes("price")) {
      return "Hệ thống hỗ trợ các phương thức thanh toán:\n\n• Chuyển khoản ngân hàng\n• Thanh toán qua VnPay\n• Thanh toán khi nhận hàng (COD)\n\nGiá sản phẩm được hiển thị bằng VNĐ và có thể thương lượng với người bán.";
    }
    
    if (lowerMessage.includes("xe điện") || lowerMessage.includes("vehicle")) {
      return "Các loại xe điện được hỗ trợ:\n\n• Xe máy điện\n• Xe đạp điện\n• Ô tô điện\n• Xe tay ga điện\n\nBạn có thể lọc theo thương hiệu, năm sản xuất, và giá cả.";
    }
    
    if (lowerMessage.includes("pin") || lowerMessage.includes("battery")) {
      return "Các loại pin xe điện:\n\n• Pin Lithium-ion\n• Pin Lithium Polymer\n• Pin Lead-acid\n• Pin Gel\n\nThông tin pin bao gồm: dung lượng, điện áp, số chu kỳ sạc.";
    }
    
    if (lowerMessage.includes("tài khoản") || lowerMessage.includes("profile")) {
      return "Để quản lý tài khoản:\n\n1. Vào trang Profile\n2. Cập nhật thông tin cá nhân\n3. Thay đổi mật khẩu\n4. Xem lịch sử giao dịch\n\nThông tin sẽ được cập nhật ngay lập tức.";
    }
    
    if (lowerMessage.includes("admin") || lowerMessage.includes("quản trị")) {
      return "Tính năng Admin:\n\n• Dashboard tổng quan\n• Quản lý người dùng\n• Kiểm duyệt tin đăng\n• Theo dõi giao dịch\n• Xem báo cáo doanh thu\n\nChỉ tài khoản Admin mới có quyền truy cập.";
    }
    
    if (lowerMessage.includes("yêu thích") || lowerMessage.includes("favorite")) {
      return "Tính năng yêu thích:\n\n• Nhấn biểu tượng tim trên sản phẩm\n• Xem danh sách yêu thích trong Profile\n• Nhận thông báo khi giá thay đổi\n• Dễ dàng so sánh sản phẩm";
    }
    
    if (lowerMessage.includes("tìm kiếm") || lowerMessage.includes("search")) {
      return "Cách tìm kiếm hiệu quả:\n\n• Sử dụng từ khóa cụ thể\n• Lọc theo giá, thương hiệu, năm\n• Chọn vị trí gần bạn\n• Sắp xếp theo giá hoặc ngày đăng";
    }
    
    if (lowerMessage.includes("báo cáo") || lowerMessage.includes("report")) {
      return "Để báo cáo vấn đề:\n\n• Tin đăng gian lận\n• Người dùng vi phạm\n• Sản phẩm không đúng mô tả\n• Vấn đề kỹ thuật\n\nLiên hệ admin qua email hoặc hotline để được hỗ trợ.";
    }
    
    // Câu trả lời mặc định
    return "Tôi có thể giúp bạn với các vấn đề về:\n\n• Cách đăng tin bán xe điện/pin\n• Quy trình kiểm duyệt\n• Phương thức thanh toán\n• Quản lý tài khoản\n• Tìm kiếm sản phẩm\n• Báo cáo vấn đề\n\nHãy cho tôi biết bạn cần hỗ trợ gì cụ thể!";
  }

  /**
   * Lấy lịch sử cuộc trò chuyện
   * @param {string} userId - ID người dùng
   * @param {string} conversationId - ID cuộc trò chuyện (optional)
   * @returns {Promise<Array>} - Lịch sử cuộc trò chuyện
   */
  static async getChatHistory(userId, conversationId = null) {
    try {
      const response = await apiRequest('/api/ai/chat/history', {
        method: 'GET',
        params: {
          userId: userId,
          conversationId: conversationId
        }
      });

      return response.history || [];
    } catch (error) {
      console.error('Get Chat History Error:', error);
      return [];
    }
  }

  /**
   * Tạo cuộc trò chuyện mới
   * @param {string} userId - ID người dùng
   * @returns {Promise<string>} - ID cuộc trò chuyện mới
   */
  static async createConversation(userId) {
    try {
      const response = await apiRequest('/api/ai/chat/conversation', {
        method: 'POST',
        body: {
          userId: userId,
          createdAt: new Date().toISOString()
        }
      });

      return response.conversationId || response.id;
    } catch (error) {
      console.error('Create Conversation Error:', error);
      return null;
    }
  }

  /**
   * Xóa cuộc trò chuyện
   * @param {string} conversationId - ID cuộc trò chuyện
   * @returns {Promise<boolean>} - Kết quả xóa
   */
  static async deleteConversation(conversationId) {
    try {
      await apiRequest(`/api/ai/chat/conversation/${conversationId}`, {
        method: 'DELETE'
      });

      return true;
    } catch (error) {
      console.error('Delete Conversation Error:', error);
      return false;
    }
  }
}

export default AIChatService;
