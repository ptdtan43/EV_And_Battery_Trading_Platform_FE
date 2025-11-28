// API Configuration
export const API_CONFIG = {
  // Production API URL
  PRODUCTION_URL: 'https://ev-and-battery-trading-platform-be.onrender.com',

  // Development API URL
  DEVELOPMENT_URL: 'http://localhost:5044',

  // Current API URL based on environment
  // Use empty string in dev to use Vite proxy, or full URL for production
  BASE_URL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://ev-and-battery-trading-platform-be.onrender.com').replace(/\/+$/, ''),

  // API Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/Auth/login',
      REGISTER: '/api/Auth/register',
      REFRESH: '/api/Auth/refresh',
      FORGOT_PASSWORD: '/api/Auth/forgot-password',
      RESET_PASSWORD: '/api/Auth/reset-password'
    },

    // Users
    USERS: {
      BASE: '/api/User',
      BY_ID: (id) => `/api/User/${id}`,
      UPDATE: (id) => `/api/User/${id}`,
      DELETE: (id) => `/api/User/${id}`,
      CREDITS: (id) => `/api/User/${id}/listings/count`
    },

    // Products
    PRODUCTS: {
      BASE: '/api/Product',
      BY_ID: (id) => `/api/Product/${id}`,
      BY_SELLER: (sellerId) => `/api/Product/seller/${sellerId}`,
      APPROVE: (id) => `/api/Product/${id}/approve`,
      REJECT: (id) => `/api/Product/${id}/reject`
    },

    // Product Images
    PRODUCT_IMAGES: {
      BASE: '/api/ProductImage',
      BY_PRODUCT: (productId) => `/api/ProductImage/product/${productId}`,
      MULTIPLE: '/api/ProductImage/multiple',
      BY_ID: (id) => `/api/ProductImage/${id}`
    },

    // Categories
    CATEGORIES: {
      BASE: '/api/Category',
      BY_ID: (id) => `/api/Category/${id}`
    },

    // Orders
    ORDERS: {
      BASE: '/api/Order',
      BY_ID: (id) => `/api/Order/${id}`,
      BY_USER: (userId) => `/api/Order/user/${userId}`,
      STATUS: (id) => `/api/Order/${id}/status`,
      CANCEL: (id) => `/api/Order/${id}/cancel`
    },

    // Payments & Credits
    PAYMENTS: {
      BASE: '/api/Payment',
      BY_ID: (id) => `/api/Payment/${id}`,
      BY_USER: (userId) => `/api/Payment/user/${userId}`,
      STATUS: (id) => `/api/Payment/${id}/status`,
      // Credit System
      PACKAGES: '/api/Payment/packages',
      CREDIT_HISTORY: '/api/Payment/credits/history',
      ADMIN_ADJUST: '/api/Payment/admin/credits/adjust',
      ADMIN_HISTORY: '/api/Payment/admin/credits/history'
    },

    // Favorites
    FAVORITES: {
      BASE: '/api/Favorite',
      BY_USER: (userId) => `/api/Favorite/user/${userId}`,
      TOGGLE: '/api/Favorite/toggle'
    },

    // Notifications
    NOTIFICATIONS: {
      BASE: '/api/Notification',
      BY_USER: (userId) => `/api/Notification/user/${userId}`,
      READ: (id) => `/api/Notification/${id}/read`,
      READ_ALL: (userId) => `/api/Notification/user/${userId}/read-all`
    },

    // Verification
    VERIFICATION: {
      BASE: '/api/Verification',
      STATUS: (id) => `/api/Verification/${id}/status`
    },

    // Chat - DEPRECATED
    // Use chatService from services/chatService.js instead
    // New endpoints: /api/Chat (rooms) and /api/Message (messages)
    CHAT: {
      // Legacy endpoints removed - use chatService
    },

    // Reviews
    REVIEWS: {
      BASE: '/api/Review',
      BY_PRODUCT: (productId) => `/api/Review/product/${productId}`,
      BY_USER: (userId) => `/api/Review/user/${userId}`,
      BY_ID: (id) => `/api/Review/${id}`
    },

    // Statistics
    STATISTICS: {
      DASHBOARD: (userId) => `/api/Statistics/dashboard/${userId}`,
      ADMIN: '/api/Statistics/admin',
      PRODUCT: (productId) => `/api/Statistics/product/${productId}`,
      SALES: (sellerId) => `/api/Statistics/sales/${sellerId}`
    },

    // Search
    SEARCH: {
      PRODUCTS: '/api/Search/products',
      USERS: '/api/Search/users'
    },

    // System
    SYSTEM: {
      HEALTH: '/api/Health',
      INFO: '/api/System/info'
    }
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if API is available
export const checkApiHealth = async () => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SYSTEM.HEALTH));
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default API_CONFIG;
