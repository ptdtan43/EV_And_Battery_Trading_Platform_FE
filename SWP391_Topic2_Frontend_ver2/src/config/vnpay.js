// VNPay Integration Configuration
// Copy this to your .env file or configure in your deployment

export const VNPAY_CONFIG = {
  // API Base URL - Change this to your backend URL
  API_BASE: import.meta.env.VITE_API_BASE || "http://localhost:5044",
  
  // VNPay Configuration
  VERSION: "2.1.0",
  CURRENCY: "VND",
  LOCALE: "vn",
  
  // Payment Types
  PAYMENT_TYPES: {
    DEPOSIT: "Deposit",
    FINAL_PAYMENT: "FinalPayment", 
    VERIFICATION: "Verification"
  },
  
  // Success/Error Codes
  SUCCESS_CODES: ["00", "true"],
  
  // Default timeout for API calls (ms)
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// Helper function to get API base URL
export const getApiBaseUrl = () => {
  return VNPAY_CONFIG.API_BASE.replace(/\/+$/, "");
};

// Helper function to check if running in development
export const isDevelopment = () => {
  return import.meta.env.DEV;
};

// Helper function to check if running in production
export const isProduction = () => {
  return import.meta.env.PROD;
};
