import { apiRequest } from './api';

/**
 * Request vehicle verification for a product
 * @param {number} productId - The ID of the product to verify
 * @returns {Promise<Object>} API response
 */
export async function requestVerification(productId) {
  try {
    console.log(`🔍 Requesting verification for product ${productId}...`);
    
    // Try using verificationStatus first, fallback to inspectionRequested
    try {
      const response = await apiRequest(`/api/Product/${productId}`, {
        method: 'PUT',
        body: {
          verificationStatus: 'Requested'
        }
      });
      
      console.log('✅ Verification request sent successfully (verificationStatus):', response);
      return response;
    } catch (verificationError) {
      console.warn('⚠️ verificationStatus field not supported, trying inspectionRequested...');
      
      // Fallback to inspectionRequested field
      const response = await apiRequest(`/api/Product/${productId}`, {
        method: 'PUT',
        body: {
          inspectionRequested: true
        }
      });
      
      console.log('✅ Verification request sent successfully (inspectionRequested):', response);
      return response;
    }
  } catch (error) {
    console.error('❌ Failed to request verification:', error);
    throw error;
  }
}

/**
 * Update verification status for a product (admin only)
 * @param {number} productId - The ID of the product
 * @param {string} status - New verification status (Requested, InProgress, Completed, Rejected)
 * @param {string} notes - Optional notes from admin
 * @returns {Promise<Object>} API response
 */
export async function updateVerificationStatus(productId, status, notes = '') {
  try {
    console.log(`🔍 Updating verification status for product ${productId} to ${status}...`);
    
    // First, get the current product data to include required fields
    const currentProduct = await apiRequest(`/api/Product/${productId}`);
    console.log('📋 Current product data:', currentProduct);
    
    // Prepare update data with all required fields
    const updateData = {
      // Required fields from current product
      title: currentProduct.title || currentProduct.Title || '',
      brand: currentProduct.brand || currentProduct.Brand || '',
      productType: currentProduct.productType || currentProduct.ProductType || 'Vehicle',
      // Optional fields (preserve existing values)
      description: currentProduct.description || currentProduct.Description || '',
      price: currentProduct.price || currentProduct.Price || 0,
      condition: currentProduct.condition || currentProduct.Condition || 'excellent',
      // Verification fields to update
      verificationStatus: status,
      verificationNotes: notes || null
    };
    
    // Include vehicle-specific fields if it's a vehicle
    if (updateData.productType === 'Vehicle' || updateData.productType === 'vehicle') {
      updateData.vehicleType = currentProduct.vehicleType || currentProduct.VehicleType || null;
      updateData.manufactureYear = currentProduct.manufactureYear || currentProduct.ManufactureYear || currentProduct.year || currentProduct.Year || null;
      updateData.mileage = currentProduct.mileage || currentProduct.Mileage || null;
      updateData.licensePlate = currentProduct.licensePlate || currentProduct.LicensePlate || currentProduct.license_plate || null;
    }
    
    // Include battery-specific fields if it's a battery
    if (updateData.productType === 'Battery' || updateData.productType === 'battery') {
      updateData.batteryType = currentProduct.batteryType || currentProduct.BatteryType || null;
      updateData.batteryHealth = currentProduct.batteryHealth || currentProduct.BatteryHealth || null;
      updateData.capacity = currentProduct.capacity || currentProduct.Capacity || null;
      updateData.voltage = currentProduct.voltage || currentProduct.Voltage || null;
      updateData.bms = currentProduct.bms || currentProduct.Bms || null;
      updateData.cellType = currentProduct.cellType || currentProduct.CellType || null;
      updateData.cycleCount = currentProduct.cycleCount || currentProduct.CycleCount || null;
    }
    
    try {
      const response = await apiRequest(`/api/Product/${productId}`, {
        method: 'PUT',
        body: updateData
      });
      
      console.log('✅ Verification status updated successfully:', response);
      return response;
    } catch (verificationError) {
      console.warn('⚠️ Standard update failed, trying admin update endpoint...', verificationError);
      
      // Try admin update endpoint as fallback
      try {
        const response = await apiRequest(`/api/Product/admin/update/${productId}`, {
          method: 'PUT',
          body: updateData
        });
        
        console.log('✅ Verification status updated via admin endpoint:', response);
        return response;
      } catch (adminError) {
        console.error('❌ Admin update endpoint also failed:', adminError);
        throw verificationError; // Throw original error
      }
    }
  } catch (error) {
    console.error('❌ Failed to update verification status:', error);
    throw error;
  }
}

/**
 * Get verification requests for admin
 * @returns {Promise<Array>} List of products with verification requests
 */
export async function getVerificationRequests() {
  try {
    console.log('🔍 Fetching verification requests...');
    
    // Use the existing Product endpoint and filter on frontend
    const response = await apiRequest('/api/Product', {
      method: 'GET'
    });
    
    const allProducts = Array.isArray(response) ? response : response?.items || [];
    
    // Filter products with verification requests on frontend
    const verificationRequests = allProducts.filter(product => 
      product.productType === "Vehicle" && 
      (
        // New field
        (product.verificationStatus === "Requested" || product.verificationStatus === "InProgress") ||
        // Fallback to old field
        product.inspectionRequested === true
      )
    );
    
    console.log('✅ Verification requests fetched successfully:', verificationRequests);
    return verificationRequests;
  } catch (error) {
    console.error('❌ Failed to fetch verification requests:', error);
    throw error;
  }
}
