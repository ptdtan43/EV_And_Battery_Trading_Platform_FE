// Payment Service
import apiService from './apiService';

class PaymentService {
  // Create payment
  async createPayment(paymentData) {
    try {
      return await apiService.createPayment(paymentData);
    } catch (error) {
      console.error('Failed to create payment:', error);
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      return await apiService.getPaymentById(paymentId);
    } catch (error) {
      console.error(`Failed to get payment ${paymentId}:`, error);
      throw error;
    }
  }

  // Get payments by user
  async getPaymentsByUser(userId) {
    try {
      return await apiService.getPaymentsByUser(userId);
    } catch (error) {
      console.error(`Failed to get payments for user ${userId}:`, error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(paymentId, status) {
    try {
      return await apiService.updatePaymentStatus(paymentId, status);
    } catch (error) {
      console.error(`Failed to update payment ${paymentId} status:`, error);
      throw error;
    }
  }

  // Process VNPay payment
  async processVNPayPayment(paymentData) {
    try {
      const response = await this.createPayment({
        ...paymentData,
        paymentMethod: 'VNPay'
      });
      
      if (response.paymentUrl) {
        // Redirect to VNPay
        window.location.href = response.paymentUrl;
      }
      
      return response;
    } catch (error) {
      console.error('Failed to process VNPay payment:', error);
      throw error;
    }
  }

  // Handle payment callback
  async handlePaymentCallback(callbackData) {
    try {
      return await apiService.createPayment({
        ...callbackData,
        action: 'callback'
      });
    } catch (error) {
      console.error('Failed to handle payment callback:', error);
      throw error;
    }
  }
}

export default new PaymentService();
