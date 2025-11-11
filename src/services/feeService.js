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
   * @param {boolean} isAdmin - Whether the user is an admin (uses admin endpoint if true)
   * @returns {Promise<Array>} Array of fee settings
   */
  async fetchFeeSettings(isAdmin = false) {
    try {
      // ✅ FIX: Use public endpoint for regular users, admin endpoint for admins
      const endpoint = isAdmin ? '/api/FeeSetting' : '/api/FeeSetting/active';
      const response = await apiRequest(endpoint, {
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
   * @param {boolean} forceRefresh - Force refresh even if cache is valid
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {Promise<Object>} Object with fee settings
   */
  async getFeeSettings(forceRefresh = false, isAdmin = false) {
    const now = Date.now();
    
    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && this.cache && this.cacheTime && (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.cache;
    }

    // Fetch fresh data (use public endpoint for regular users)
    const settings = await this.fetchFeeSettings(isAdmin);
    
    // Transform array to object for easier access
    // ✅ FIX: Get the most recent active fee for each type (handle duplicates)
    const feeSettings = {};
    const feeMap = new Map(); // Track best fee for each type
    
    settings.forEach(setting => {
      const feeType = setting.feeType || setting.FeeType;
      const isActive = setting.isActive !== undefined ? setting.isActive : (setting.IsActive !== undefined ? setting.IsActive : false);
      const feeValue = setting.feeValue || setting.FeeValue;
      const createdDate = setting.createdDate || setting.CreatedDate;
      
      if (!feeType) return;
      
      const existing = feeMap.get(feeType);
      
      if (!existing) {
        feeMap.set(feeType, { isActive, feeValue, createdDate });
      } else {
        // Priority: active > inactive, then newest date
        if (isActive && !existing.isActive) {
          feeMap.set(feeType, { isActive, feeValue, createdDate });
        } else if (isActive === existing.isActive) {
          if (createdDate && existing.createdDate) {
            const feeDate = new Date(createdDate);
            const existingDate = new Date(existing.createdDate);
            if (feeDate > existingDate) {
              feeMap.set(feeType, { isActive, feeValue, createdDate });
            }
          } else if (createdDate && !existing.createdDate) {
            feeMap.set(feeType, { isActive, feeValue, createdDate });
          }
        }
      }
    });
    
    // Only use active fees
    feeMap.forEach((value, feeType) => {
      if (value.isActive) {
        feeSettings[feeType] = value.feeValue;
      }
    });

    // Cache the result
    this.cache = feeSettings;
    this.cacheTime = now;

    return feeSettings;
  }

  /**
   * Get deposit percentage (default: 0.1 = 10%)
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {Promise<number>} Deposit percentage as decimal
   */
  async getDepositPercentage(isAdmin = false) {
    const settings = await this.getFeeSettings(false, isAdmin);
    return settings.DepositPercentage || 0.1; // Default 10%
  }

  /**
   * Get verification fee (default: 50000 VND)
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {Promise<number>} Verification fee in VND
   */
  async getVerificationFee(isAdmin = false) {
    const settings = await this.getFeeSettings(false, isAdmin);
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

    // For vehicles, use percentage from settings (use public endpoint for regular users)
    const depositPercentage = await this.getDepositPercentage(false);
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

