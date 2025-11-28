// Product Service
import apiService from './apiService';

class ProductService {
  // Get all products
  async getAllProducts() {
    try {
      return await apiService.getAllProducts();
    } catch (error) {
      console.error('Failed to get all products:', error);
      throw error;
    }
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      return await apiService.getProductById(productId);
    } catch (error) {
      console.error(`Failed to get product ${productId}:`, error);
      throw error;
    }
  }

  // Get products by seller
  async getProductsBySeller(sellerId) {
    try {
      return await apiService.getProductsBySeller(sellerId);
    } catch (error) {
      console.error(`Failed to get products for seller ${sellerId}:`, error);
      throw error;
    }
  }

  // Create new product
  async createProduct(productData) {
    try {
      return await apiService.createProduct(productData);
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  }

  // Update product
  async updateProduct(productId, productData) {
    try {
      return await apiService.updateProduct(productId, productData);
    } catch (error) {
      console.error(`Failed to update product ${productId}:`, error);
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      return await apiService.deleteProduct(productId);
    } catch (error) {
      console.error(`Failed to delete product ${productId}:`, error);
      throw error;
    }
  }

  // Approve product (Admin)
  async approveProduct(productId) {
    try {
      return await apiService.approveProduct(productId);
    } catch (error) {
      console.error(`Failed to approve product ${productId}:`, error);
      throw error;
    }
  }

  // Reject product (Admin)
  async rejectProduct(productId, reason) {
    try {
      return await apiService.rejectProduct(productId, reason);
    } catch (error) {
      console.error(`Failed to reject product ${productId}:`, error);
      throw error;
    }
  }

  // Get product images
  async getProductImages(productId) {
    try {
      return await apiService.getProductImages(productId);
    } catch (error) {
      console.error(`Failed to get images for product ${productId}:`, error);
      throw error;
    }
  }

  // Upload product image
  async uploadProductImage(imageData) {
    try {
      return await apiService.uploadProductImage(imageData);
    } catch (error) {
      console.error('Failed to upload product image:', error);
      throw error;
    }
  }

  // Upload multiple product images
  async uploadMultipleProductImages(imagesData) {
    try {
      return await apiService.uploadMultipleProductImages(imagesData);
    } catch (error) {
      console.error('Failed to upload multiple product images:', error);
      throw error;
    }
  }

  // Delete product image
  async deleteProductImage(imageId) {
    try {
      return await apiService.deleteProductImage(imageId);
    } catch (error) {
      console.error(`Failed to delete image ${imageId}:`, error);
      throw error;
    }
  }

  // Search products
  async searchProducts(searchParams) {
    try {
      return await apiService.searchProducts(searchParams);
    } catch (error) {
      console.error('Failed to search products:', error);
      throw error;
    }
  }

  // Get product statistics
  async getProductStats(productId) {
    try {
      return await apiService.getProductStats(productId);
    } catch (error) {
      console.error(`Failed to get stats for product ${productId}:`, error);
      throw error;
    }
  }
}

export default new ProductService();
