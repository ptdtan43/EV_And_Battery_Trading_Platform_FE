// Notification Service
import apiService from './apiService';

class NotificationService {
  // Get notifications by user
  async getNotificationsByUser(userId) {
    try {
      return await apiService.getNotificationsByUser(userId);
    } catch (error) {
      console.error(`Failed to get notifications for user ${userId}:`, error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      return await apiService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      return await apiService.markAllNotificationsAsRead(userId);
    } catch (error) {
      console.error(`Failed to mark all notifications as read for user ${userId}:`, error);
      throw error;
    }
  }

  // Create notification
  async createNotification(notificationData) {
    try {
      return await apiService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Send notification to user
  async sendNotificationToUser(userId, title, message, type = 'info') {
    try {
      return await this.createNotification({
        userId,
        title,
        message,
        type,
        isRead: false
      });
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  // Send product approval notification
  async sendProductApprovalNotification(userId, productTitle, approved = true) {
    const title = approved ? 'Sản phẩm đã được duyệt' : 'Sản phẩm bị từ chối';
    const message = approved 
      ? `Sản phẩm "${productTitle}" đã được duyệt và hiển thị trên trang web.`
      : `Sản phẩm "${productTitle}" đã bị từ chối. Vui lòng kiểm tra và chỉnh sửa.`;
    
    return this.sendNotificationToUser(userId, title, message, approved ? 'success' : 'error');
  }

  // Send order notification
  async sendOrderNotification(userId, orderId, status) {
    const statusMessages = {
      'pending': 'Đơn hàng đang chờ xử lý',
      'confirmed': 'Đơn hàng đã được xác nhận',
      'shipped': 'Đơn hàng đã được giao',
      'delivered': 'Đơn hàng đã được giao thành công',
      'cancelled': 'Đơn hàng đã bị hủy'
    };

    const title = 'Cập nhật đơn hàng';
    const message = `Đơn hàng #${orderId}: ${statusMessages[status] || 'Trạng thái đã được cập nhật'}`;
    
    return this.sendNotificationToUser(userId, title, message, 'info');
  }
}

export default new NotificationService();
