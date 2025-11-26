import { apiRequest } from "./api";

/**
 * Create a new product (costs 1 credit immediately, refunded if rejected)
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product with remainingPostCredits
 * @throws {Error} If user doesn't have enough credits
 * @example
 * const product = await createProduct({
 *   productType: "Vehicle",
 *   title: "Tesla Model 3",
 *   description: "2020 Tesla Model 3",
 *   price: 500000000,
 *   brand: "Tesla",
 *   model: "Model 3",
 *   condition: "Used"
 * });
 * // Returns: { productId, title, status: "Draft", remainingPostCredits: 14, message: "1 credit deducted. Will be refunded if rejected." }
 * // Note: Credit is deducted immediately but refunded if admin rejects
 */
export const createProduct = async (productData) => {
  console.log("Creating product:", productData);
  
  try {
    const response = await apiRequest("/api/Product", {
      method: "POST",
      body: productData
    });
    
    console.log("✅ Product created successfully:", response);
    console.log(`💎 Remaining credits: ${response.remainingPostCredits}`);
    
    return response;
  } catch (error) {
    console.error("❌ Error creating product:", error);
    
    // Handle specific error: not enough credits
    if (error.message?.includes("not have enough post credits")) {
      throw new Error("Bạn không đủ credits để đăng tin. Đăng tin sẽ trừ 1 credit ngay (hoàn lại nếu bị từ chối). Vui lòng mua thêm credits.");
    }
    
    throw error;
  }
};

/**
 * Approve a product
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} API response
 */
export const approveProduct = async (productId) => {
  console.log("Approving product:", productId);
  
  try {
    const response = await apiRequest(`/api/Product/approve/${productId}`, {
      method: "PUT"
    });
    
    console.log("Product approved successfully:", response);
    return response;
  } catch (error) {
    console.error("Error approving product:", error);
    throw error;
  }
};

/**
 * Reject a product with reason
 * @param {number} productId - Product ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<Object>} API response
 */
export const rejectProduct = async (productId, rejectionReason) => {
  console.log("Rejecting product:", productId, "Reason:", rejectionReason);
  
  // Validate productId
  if (!productId || productId === 'undefined') {
    throw new Error("Product ID is required");
  }
  
  try {
    const response = await apiRequest(`/api/Product/reject/${productId}`, {
      method: "PUT",
      body: { RejectionReason: rejectionReason }
    });
    
    console.log("Product rejected successfully:", response);
    return response;
  } catch (error) {
    console.error("Error rejecting product:", error);
    throw error;
  }
};

/**
 * Resubmit a rejected product for review
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} API response
 */
export const resubmitProduct = async (productId) => {
  console.log("Resubmitting product:", productId);
  
  try {
    const response = await apiRequest(`/api/Product/resubmit/${productId}`, {
      method: "PUT"
    });
    
    console.log("Product resubmitted successfully:", response);
    return response;
  } catch (error) {
    console.error("Error resubmitting product:", error);
    throw error;
  }
};

/**
 * Get products by status
 * @param {string} status - Product status (pending, approved, rejected)
 * @returns {Promise<Array>} Products array
 */
export const getProductsByStatus = async (status) => {
  console.log("Getting products by status:", status);
  
  try {
    const response = await apiRequest(`/api/Product/status/${status}`);
    console.log("Products loaded:", response);
    return response;
  } catch (error) {
    console.error("Error loading products by status:", error);
    throw error;
  }
};

/**
 * Get rejected products for a specific seller
 * @param {number} sellerId - Seller ID
 * @returns {Promise<Array>} Rejected products array
 */
export const getRejectedProducts = async (sellerId) => {
  console.log("Getting rejected products for seller:", sellerId);
  
  try {
    const response = await apiRequest(`/api/Product/seller/${sellerId}/rejected`);
    console.log("Rejected products loaded:", response);
    return response;
  } catch (error) {
    console.error("Error loading rejected products:", error);
    throw error;
  }
};

/**
 * Search products by license plate
 * @param {string} licensePlate - License plate number
 * @returns {Promise<Array>} Products array matching the license plate
 */
export const searchProductsByLicensePlate = async (licensePlate) => {
  console.log("Searching products by license plate:", licensePlate);
  
  if (!licensePlate || licensePlate.trim() === '') {
    throw new Error("License plate is required");
  }
  
  try {
    const response = await apiRequest(`/api/Product/search/license-plate/${encodeURIComponent(licensePlate.trim())}`);
    console.log("Products found by license plate:", response);
    return response;
  } catch (error) {
    console.error("Error searching products by license plate:", error);
    throw error;
  }
};

/**
 * Search products by brand, model, or license plate from existing products
 * @param {string} searchQuery - Search query (brand, model, or license plate)
 * @param {Array} allProducts - Array of all products to search from
 * @returns {Array} Products array matching the search query
 */
export const searchProducts = (searchQuery, allProducts = []) => {
  console.log("Searching products by query:", searchQuery);
  
  if (!searchQuery || searchQuery.trim() === '') {
    return [];
  }
  
  const query = searchQuery.trim().toLowerCase();
  console.log("Search query normalized:", query);
  
  // Filter products that match the search query
  const matchingProducts = allProducts.filter(product => {
    const brand = (product.brand || product.Brand || '').toLowerCase();
    const model = (product.model || product.Model || '').toLowerCase();
    const licensePlate = (product.licensePlate || product.LicensePlate || '').toLowerCase();
    const title = (product.title || product.Title || '').toLowerCase();
    const description = (product.description || product.Description || '').toLowerCase();
    
    // Check if query matches any of these fields
    const matchesBrand = brand.includes(query);
    const matchesModel = model.includes(query);
    const matchesLicensePlate = licensePlate.includes(query);
    const matchesTitle = title.includes(query);
    const matchesDescription = description.includes(query);
    
    const isMatch = matchesBrand || matchesModel || matchesLicensePlate || matchesTitle || matchesDescription;
    
    if (isMatch) {
      console.log(`Product ${product.productId || product.ProductId} matches:`, {
        brand: brand,
        model: model,
        licensePlate: licensePlate,
        title: title,
        matchesBrand,
        matchesModel,
        matchesLicensePlate,
        matchesTitle,
        matchesDescription
      });
    }
    
    return isMatch;
  });
  
  console.log(`Found ${matchingProducts.length} products matching "${searchQuery}"`);
  return matchingProducts;
};

