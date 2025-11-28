// Payment API client for Credit System
import { apiRequest } from "./api";

/**
 * Get available credit packages
 * @returns {Promise<Array>} Array of credit packages
 * @example
 * const packages = await getPackages();
 * // Returns: [{ packageId, credits, price, pricePerCredit, discountPercent, isPopular, description }]
 */
export async function getPackages() {
  try {
    const response = await apiRequest("/api/Payment/packages", {
      method: "GET"
    });
    console.log("✅ Packages loaded:", response);
    return response;
  } catch (error) {
    console.error("❌ Error loading packages:", error);
    throw error;
  }
}

/**
 * Create payment to buy credits
 * @param {number} postCredits - Number of credits to buy (5, 10, 20, or 50)
 * @param {number} amount - Amount in VND (from package price)
 * @returns {Promise<Object>} Payment response with paymentId and paymentUrl
 * @example
 * const result = await createPayment(10, 90000);
 * // Returns: { paymentId: 123, paymentUrl: "https://..." }
 */
export async function createPayment(postCredits, amount) {
  if (!postCredits || ![5, 10, 20, 50].includes(postCredits)) {
    throw new Error("Invalid credits amount. Must be 5, 10, 20, or 50.");
  }

  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0.");
  }

  // ✅ Match format với các payment khác
  // Gửi amount từ frontend (đã lấy từ package)
  const requestBody = {
    orderId: null,
    productId: null,
    amount: amount,  // Amount from package price
    paymentType: "PostCredit",
    postCredits: postCredits
  };

  console.log("📤 Creating payment request:", {
    endpoint: "/api/Payment",
    method: "POST",
    body: requestBody
  });

  try {
    const response = await apiRequest("/api/Payment", {
      method: "POST",
      body: requestBody
    });
    
    console.log("✅ Payment API response:", response);
    
    // Validate response
    if (!response) {
      throw new Error("No response from server");
    }
    
    if (!response.paymentUrl) {
      console.error("❌ Invalid response - missing paymentUrl:", response);
      throw new Error("Server không trả về payment URL. Vui lòng thử lại.");
    }
    
    return response;
  } catch (error) {
    console.error("❌ Payment API error:", {
      message: error.message,
      status: error.status,
      data: error.data,
      stack: error.stack
    });
    
    // Handle specific error cases
    if (error.message?.includes("Invalid package")) {
      throw new Error(`Gói ${postCredits} credits không hợp lệ. Vui lòng chọn gói khác.`);
    }
    
    if (error.message?.includes("Payment processing failed")) {
      throw new Error("Backend đang gặp sự cố xử lý thanh toán. Vui lòng kiểm tra:\n1. Database có packages chưa?\n2. VNPay config đúng chưa?\n3. Backend logs để xem lỗi chi tiết.");
    }
    
    throw error;
  }
}

/**
 * Get credit history for current user
 * @returns {Promise<Object>} Credit history with current balance and transactions
 * @example
 * const history = await getCreditHistory();
 * // Returns: { currentCredits, totalPurchased, totalUsed, history: [...] }
 */
export async function getCreditHistory() {
  try {
    const response = await apiRequest("/api/Payment/credits/history", {
      method: "GET"
    });
    console.log("✅ Credit history loaded:", response);
    return response;
  } catch (error) {
    console.error("❌ Error loading credit history:", error);
    throw error;
  }
}

/**
 * Get user credits (from User API)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User info with postCredits
 * @example
 * const user = await getUserCredits(123);
 * // Returns: { userId, email, fullName, postCredits }
 */
export async function getUserCredits(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await apiRequest(`/api/User/${userId}/listings/count`, {
      method: "GET"
    });
    console.log("✅ User credits loaded:", response);
    return response;
  } catch (error) {
    console.error("❌ Error loading user credits:", error);
    throw error;
  }
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Admin: Adjust user credits
 * @param {Object} params - Adjustment parameters
 * @param {number} params.userId - User ID to adjust
 * @param {number} params.creditsChange - Credits to add (positive) or subtract (negative)
 * @param {string} params.reason - Reason for adjustment (required, min 10 chars)
 * @param {string} params.adjustmentType - Type: "Refund", "Promotion", "Correction", "Penalty"
 * @returns {Promise<Object>} Adjustment result
 * @example
 * const result = await adminAdjustCredits({
 *   userId: 123,
 *   creditsChange: 10,
 *   reason: "Refund for payment issue",
 *   adjustmentType: "Refund"
 * });
 */
export async function adminAdjustCredits({ userId, creditsChange, reason, adjustmentType }) {
  // Validation
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!creditsChange || creditsChange === 0) {
    throw new Error("Credits change cannot be zero");
  }
  if (!reason || reason.length < 10) {
    throw new Error("Reason is required (minimum 10 characters)");
  }
  if (!adjustmentType || !["Refund", "Promotion", "Correction", "Penalty"].includes(adjustmentType)) {
    throw new Error("Invalid adjustment type. Must be: Refund, Promotion, Correction, or Penalty");
  }

  try {
    const response = await apiRequest("/api/Payment/admin/credits/adjust", {
      method: "POST",
      body: {
        userId,
        creditsChange,
        reason,
        adjustmentType
      }
    });
    console.log("✅ Credits adjusted:", response);
    return response;
  } catch (error) {
    console.error("❌ Error adjusting credits:", error);
    
    // Handle specific errors
    if (error.message?.includes("only has")) {
      throw new Error("Không thể trừ credits. User không đủ số dư.");
    }
    if (error.status === 403) {
      throw new Error("Bạn không có quyền điều chỉnh credits.");
    }
    
    throw error;
  }
}

/**
 * Admin: Get all credit history with filters
 * @param {Object} filters - Filter options
 * @param {number} [filters.userId] - Filter by user ID
 * @param {string} [filters.changeType] - Filter by type: "Purchase", "Use", "Refund", "AdminAdjust"
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=50] - Items per page (max 200)
 * @returns {Promise<Object>} Paginated credit history
 * @example
 * const history = await adminGetCreditHistory({ page: 1, pageSize: 20 });
 * // Returns: { totalRecords, page, pageSize, totalPages, history: [...] }
 */
export async function adminGetCreditHistory(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.changeType) params.append("changeType", filters.changeType);
  if (filters.page) params.append("page", filters.page);
  if (filters.pageSize) params.append("pageSize", Math.min(filters.pageSize, 200));

  try {
    const url = `/api/Payment/admin/credits/history${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiRequest(url, {
      method: "GET"
    });
    console.log("✅ Admin credit history loaded:", response);
    return response;
  } catch (error) {
    console.error("❌ Error loading admin credit history:", error);
    
    if (error.status === 403) {
      throw new Error("Bạn không có quyền xem lịch sử credits.");
    }
    
    throw error;
  }
}

// ==================== LEGACY FUNCTION (Keep for backward compatibility) ====================

/**
 * @deprecated Use createPayment() instead
 * Legacy function for backward compatibility
 */
export async function createPaymentRequest(body, token) {
  console.warn("createPaymentRequest is deprecated. Use createPayment() instead.");
  
  // If body has postCredits, use new API
  if (body.postCredits) {
    return createPayment(body.postCredits);
  }
  
  // Otherwise, use old implementation
  const { API_BASE } = await import("./apiClient");
  const url = `${API_BASE}/api/payment`;
  
  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: "omit",
    body: JSON.stringify(body)
  };

  const res = await fetch(url, config);
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  return await res.json();
}

