import { apiRequest } from '../lib/api';

/**
 * Service to fetch and manage fee settings from backend
 */
class FeeService {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Fetch fee settings from API
   * @returns {Promise<Array>} Array of fee settings
   */
  async fetchFeeSettings() {
    try {
      const response = await apiRequest('/api/FeeSetting', {
        method: 'GET',
      });
      return response || [];
    } catch (error) {
      console.error('❌ Failed to fetch fee settings:', error);
      // Return default values if API fails
      return [
        { feeType: 'DepositPercentage', feeValue: 0.1, isActive: true },
        { feeType: 'VerificationFee', feeValue: 50000, isActive: true },
      ];
    }
  }

  /**
   * Get fee settings with caching
   * @returns {Promise<Object>} Object with fee settings
   */
  async getFeeSettings() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && this.cacheTime && (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.cache;
    }

    // Fetch fresh data
    const settings = await this.fetchFeeSettings();
    
    // Transform array to object for easier access
    const feeSettings = {};
    settings.forEach(setting => {
      if (setting.isActive) {
        feeSettings[setting.feeType] = setting.feeValue;
      }
    });

    // Cache the result
    this.cache = feeSettings;
    this.cacheTime = now;

    return feeSettings;
  }

  /**
   * Get deposit percentage (default: 0.1 = 10%)
   * @returns {Promise<number>} Deposit percentage as decimal
   */
  async getDepositPercentage() {
    const settings = await this.getFeeSettings();
    return settings.DepositPercentage || 0.1; // Default 10%
  }

  /**
   * Get verification fee (default: 50000 VND)
   * @returns {Promise<number>} Verification fee in VND
   */
  async getVerificationFee() {
    const settings = await this.getFeeSettings();
    return settings.VerificationFee || 50000; // Default 50k VND
  }

  /**
   * Calculate deposit amount based on product price and percentage
   * @param {number} price - Product price
   * @param {string} productType - Product type (Vehicle, Battery, etc.)
   * @returns {Promise<number>} Deposit amount in VND
   */
  async calculateDepositAmount(price, productType = 'Vehicle') {
    const type = (productType || '').toLowerCase();
    
    // Fixed lower deposit for batteries
    if (type === 'battery') {
      return 500000; // 500,000 VND for battery deposits
    }

    // For vehicles, use percentage from settings
    const depositPercentage = await this.getDepositPercentage();
    let depositAmount = Math.round(price * depositPercentage);
    
    // VNPay validation: Amount must be between 5,000 and 999,999,999 VND
    const VNPAY_MIN_AMOUNT = 5000;
    const VNPAY_MAX_AMOUNT = 999999999; // Under 1 billion
    
    // Ensure minimum amount
    if (depositAmount < VNPAY_MIN_AMOUNT) {
      depositAmount = VNPAY_MIN_AMOUNT;
    }
    
    // Cap at maximum allowed by VNPay
    if (depositAmount > VNPAY_MAX_AMOUNT) {
      depositAmount = VNPAY_MAX_AMOUNT;
      console.warn(`⚠️ Deposit amount (${depositAmount}) exceeds VNPay limit. Capped at ${VNPAY_MAX_AMOUNT} VND`);
    }
    
    return depositAmount;
  }

  /**
   * Clear cache (useful for testing or when settings are updated)
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
  }
}

// Export singleton instance
export const feeService = new FeeService();
export default feeService;

