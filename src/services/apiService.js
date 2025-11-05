// Centralized API Service - EV Trading Platform
import { apiRequest } from '../lib/api';

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE || "http://localhost:5044";
  }

  // ==================== AUTHENTICATION APIs ====================

  async login(credentials) {
    return apiRequest('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return apiRequest('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async refreshToken() {
    return apiRequest('/api/Auth/refresh', {
      method: 'POST'
    });
  }

  async forgotPassword(email) {
    return apiRequest('/api/Auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, newPassword) {
    return apiRequest('/api/Auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  // ==================== USER APIs ====================

  async getUserById(userId) {
    return apiRequest(`/api/User/${userId}`);
  }

  async updateUser(userId, userData) {
    return apiRequest(`/api/User/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId) {
    return apiRequest(`/api/User/${userId}`, {
      method: 'DELETE'
    });
  }

  async getAllUsers() {
    return apiRequest('/api/User');
  }

  // ==================== PRODUCT APIs ====================

  async getAllProducts() {
    return apiRequest('/api/Product');
  }

  async getProductById(productId) {
    return apiRequest(`/api/Product/${productId}`);
  }

  async getProductsBySeller(sellerId) {
    return apiRequest(`/api/Product/seller/${sellerId}`);
  }

  async createProduct(productData) {
    return apiRequest('/api/Product', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(productId, productData) {
    return apiRequest(`/api/Product/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(productId) {
    return apiRequest(`/api/Product/${productId}`, {
      method: 'DELETE'
    });
  }

  async approveProduct(productId) {
    return apiRequest(`/api/Product/${productId}/approve`, {
      method: 'POST'
    });
  }

  async rejectProduct(productId, reason) {
    return apiRequest(`/api/Product/${productId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // ==================== PRODUCT IMAGE APIs ====================

  async getProductImages(productId) {
    return apiRequest(`/api/ProductImage/product/${productId}`);
  }

  async uploadProductImage(imageData) {
    return apiRequest('/api/ProductImage', {
      method: 'POST',
      body: imageData
    });
  }

  async uploadMultipleProductImages(imagesData) {
    return apiRequest('/api/ProductImage/multiple', {
      method: 'POST',
      body: imagesData
    });
  }

  async deleteProductImage(imageId) {
    return apiRequest(`/api/ProductImage/${imageId}`, {
      method: 'DELETE'
    });
  }

  // ==================== CATEGORY APIs ====================

  async getAllCategories() {
    return apiRequest('/api/Category');
  }

  async getCategoryById(categoryId) {
    return apiRequest(`/api/Category/${categoryId}`);
  }

  async createCategory(categoryData) {
    return apiRequest('/api/Category', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  async updateCategory(categoryId, categoryData) {
    return apiRequest(`/api/Category/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  }

  async deleteCategory(categoryId) {
    return apiRequest(`/api/Category/${categoryId}`, {
      method: 'DELETE'
    });
  }

  // ==================== ORDER APIs ====================

  async getAllOrders() {
    return apiRequest('/api/Order');
  }

  async getOrderById(orderId) {
    return apiRequest(`/api/Order/${orderId}`);
  }

  async getOrdersByUser(userId) {
    return apiRequest(`/api/Order/user/${userId}`);
  }

  async createOrder(orderData) {
    return apiRequest('/api/Order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async updateOrderStatus(orderId, status) {
    return apiRequest(`/api/Order/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async cancelOrder(orderId) {
    return apiRequest(`/api/Order/${orderId}/cancel`, {
      method: 'POST'
    });
  }

  // ==================== PAYMENT APIs ====================

  async createPayment(paymentData) {
    return apiRequest('/api/payment', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getPaymentById(paymentId) {
    return apiRequest(`/api/payment/${paymentId}`);
  }

  async getPaymentsByUser(userId) {
    return apiRequest(`/api/payment/user/${userId}`);
  }

  async updatePaymentStatus(paymentId, status) {
    return apiRequest(`/api/payment/${paymentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // ==================== FAVORITE APIs ====================

  async getFavoritesByUser(userId) {
    return apiRequest(`/api/Favorite/user/${userId}`);
  }

  async addToFavorites(userId, productId) {
    return apiRequest('/api/Favorite', {
      method: 'POST',
      body: JSON.stringify({ userId, productId })
    });
  }

  async removeFromFavorites(userId, productId) {
    return apiRequest('/api/Favorite', {
      method: 'DELETE',
      body: JSON.stringify({ userId, productId })
    });
  }

  async toggleFavorite(userId, productId) {
    return apiRequest('/api/Favorite/toggle', {
      method: 'POST',
      body: JSON.stringify({ userId, productId })
    });
  }

  // ==================== NOTIFICATION APIs ====================

  async getNotificationsByUser(userId) {
    return apiRequest(`/api/Notification/user/${userId}`);
  }

  async markNotificationAsRead(notificationId) {
    return apiRequest(`/api/Notification/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsAsRead(userId) {
    return apiRequest(`/api/Notification/user/${userId}/read-all`, {
      method: 'PUT'
    });
  }

  async createNotification(notificationData) {
    return apiRequest('/api/Notification', {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });
  }

  // ==================== VERIFICATION APIs ====================

  async getVerificationRequests() {
    return apiRequest('/api/Verification');
  }

  async createVerificationRequest(verificationData) {
    return apiRequest('/api/Verification', {
      method: 'POST',
      body: JSON.stringify(verificationData)
    });
  }

  async updateVerificationStatus(verificationId, status) {
    return apiRequest(`/api/Verification/${verificationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // ==================== CHAT APIs ====================

  // Get all chats for current user
  async getChatHistory() {
    return apiRequest('/api/Chat');
  }

  // Get specific chat by ID
  async getChatById(chatId) {
    return apiRequest(`/api/Chat/${chatId}`);
  }

  // Create new chat
  async createChat(user1Id, user2Id) {
    return apiRequest('/api/Chat', {
      method: 'POST',
      body: JSON.stringify({ user1Id, user2Id })
    });
  }

  // Start chat with another user (simpler method)
  async startChatWith(otherUserId) {
    return apiRequest(`/api/Chat/start-chat/${otherUserId}`, {
      method: 'POST'
    });
  }

  // Delete chat
  async deleteChat(chatId) {
    return apiRequest(`/api/Chat/${chatId}`, {
      method: 'DELETE'
    });
  }

  // ==================== MESSAGE APIs ====================

  // Get all messages sent by current user
  async getMyMessages() {
    return apiRequest('/api/Message');
  }

  // Get messages for a specific chat
  async getChatMessages(chatId) {
    return apiRequest(`/api/Message/chat/${chatId}`);
  }

  // Get message by ID
  async getMessageById(messageId) {
    return apiRequest(`/api/Message/${messageId}`);
  }

  // Get unread messages
  async getUnreadMessages() {
    return apiRequest('/api/Message/unread');
  }

  // Get unread message count
  async getUnreadMessageCount() {
    return apiRequest('/api/Message/unread-count');
  }

  // Send message
  async sendMessage(chatId, senderId, content) {
    return apiRequest('/api/Message', {
      method: 'POST',
      body: JSON.stringify({ chatId, senderId, content })
    });
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    return apiRequest(`/api/Message/${messageId}/read`, {
      method: 'PUT'
    });
  }

  // Mark all messages in chat as read
  async markChatMessagesAsRead(chatId) {
    return apiRequest(`/api/Message/chat/${chatId}/read-all`, {
      method: 'PUT'
    });
  }

  // Delete message
  async deleteMessage(messageId) {
    return apiRequest(`/api/Message/${messageId}`, {
      method: 'DELETE'
    });
  }

  // ==================== REVIEW APIs ====================

  async getReviewsByProduct(productId) {
    return apiRequest(`/api/Review/product/${productId}`);
  }

  async getReviewsByUser(userId) {
    return apiRequest(`/api/Review/user/${userId}`);
  }

  async createReview(reviewData) {
    return apiRequest('/api/Review', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  async updateReview(reviewId, reviewData) {
    return apiRequest(`/api/Review/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
  }

  async deleteReview(reviewId) {
    return apiRequest(`/api/Review/${reviewId}`, {
      method: 'DELETE'
    });
  }

  // ==================== STATISTICS APIs ====================

  async getDashboardStats(userId) {
    return apiRequest(`/api/Statistics/dashboard/${userId}`);
  }

  async getAdminStats() {
    return apiRequest('/api/Statistics/admin');
  }

  async getProductStats(productId) {
    return apiRequest(`/api/Statistics/product/${productId}`);
  }

  async getSalesStats(sellerId) {
    return apiRequest(`/api/Statistics/sales/${sellerId}`);
  }

  // ==================== SEARCH APIs ====================

  async searchProducts(searchParams) {
    return apiRequest('/api/Search/products', {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });
  }

  async searchUsers(searchParams) {
    return apiRequest('/api/Search/users', {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });
  }

  // ==================== UTILITY METHODS ====================

  async healthCheck() {
    return apiRequest('/api/Health');
  }

  async getSystemInfo() {
    return apiRequest('/api/System/info');
  }

  // Batch operations
  async batchRequest(requests) {
    const promises = requests.map(request =>
      apiRequest(request.path, request.options)
    );
    return Promise.allSettled(promises);
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
