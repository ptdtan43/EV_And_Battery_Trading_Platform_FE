import { apiRequest } from "./api";

/**
 * Reject a product with reason
 * @param {number} productId - Product ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<Object>} API response
 */
export const rejectProduct = async (productId, rejectionReason) => {
  console.log("🚫 Rejecting product:", productId, "Reason:", rejectionReason);
  
  try {
    const response = await apiRequest(`/api/Product/reject/${productId}`, {
      method: "PUT",
      body: { rejectionReason }
    });
    
    console.log("✅ Product rejected successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error rejecting product:", error);
    throw error;
  }
};

/**
 * Resubmit a rejected product for review
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} API response
 */
export const resubmitProduct = async (productId) => {
  console.log("🔄 Resubmitting product:", productId);
  
  try {
    const response = await apiRequest(`/api/Product/resubmit/${productId}`, {
      method: "PUT"
    });
    
    console.log("✅ Product resubmitted successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error resubmitting product:", error);
    throw error;
  }
};

/**
 * Get products by status
 * @param {string} status - Product status (pending, approved, rejected)
 * @returns {Promise<Array>} Products array
 */
export const getProductsByStatus = async (status) => {
  console.log("📋 Getting products by status:", status);
  
  try {
    const response = await apiRequest(`/api/Product/status/${status}`);
    console.log("✅ Products loaded:", response);
    return response;
  } catch (error) {
    console.error("❌ Error loading products by status:", error);
    throw error;
  }
};

/**
 * Get rejected products for a specific seller
 * @param {number} sellerId - Seller ID
 * @returns {Promise<Array>} Rejected products array
 */
export const getRejectedProducts = async (sellerId) => {
  console.log("📋 Getting rejected products for seller:", sellerId);
  
  try {
    const response = await apiRequest(`/api/Product/seller/${sellerId}/rejected`);
    console.log("✅ Rejected products loaded:", response);
    return response;
  } catch (error) {
    console.error("❌ Error loading rejected products:", error);
    throw error;
  }
};

