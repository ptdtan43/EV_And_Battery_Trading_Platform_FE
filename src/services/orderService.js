// Order Service
import apiService from './apiService';

class OrderService {
  // Get all orders
  async getAllOrders() {
    try {
      return await apiService.getAllOrders();
    } catch (error) {
      console.error('Failed to get all orders:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(orderId) {
    try {
      return await apiService.getOrderById(orderId);
    } catch (error) {
      console.error(`Failed to get order ${orderId}:`, error);
      throw error;
    }
  }

  // Get orders by user
  async getOrdersByUser(userId) {
    try {
      return await apiService.getOrdersByUser(userId);
    } catch (error) {
      console.error(`Failed to get orders for user ${userId}:`, error);
      throw error;
    }
  }

  // Create new order
  async createOrder(orderData) {
    try {
      return await apiService.createOrder(orderData);
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      return await apiService.updateOrderStatus(orderId, status);
    } catch (error) {
      console.error(`Failed to update order ${orderId} status:`, error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      return await apiService.cancelOrder(orderId);
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  }

  // Get order statistics
  async getOrderStats(userId) {
    try {
      return await apiService.getSalesStats(userId);
    } catch (error) {
      console.error(`Failed to get order stats for user ${userId}:`, error);
      throw error;
    }
  }
}

export default new OrderService();
