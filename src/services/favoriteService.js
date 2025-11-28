// Favorite Service
import apiService from './apiService';

class FavoriteService {
  // Get favorites by user
  async getFavoritesByUser(userId) {
    try {
      return await apiService.getFavoritesByUser(userId);
    } catch (error) {
      console.error(`Failed to get favorites for user ${userId}:`, error);
      throw error;
    }
  }

  // Add to favorites
  async addToFavorites(userId, productId) {
    try {
      return await apiService.addToFavorites(userId, productId);
    } catch (error) {
      console.error(`Failed to add product ${productId} to favorites:`, error);
      throw error;
    }
  }

  // Remove from favorites
  async removeFromFavorites(userId, productId) {
    try {
      return await apiService.removeFromFavorites(userId, productId);
    } catch (error) {
      console.error(`Failed to remove product ${productId} from favorites:`, error);
      throw error;
    }
  }

  // Toggle favorite
  async toggleFavorite(userId, productId) {
    try {
      return await apiService.toggleFavorite(userId, productId);
    } catch (error) {
      console.error(`Failed to toggle favorite for product ${productId}:`, error);
      throw error;
    }
  }

  // Check if product is favorited
  async isProductFavorited(userId, productId) {
    try {
      const favorites = await this.getFavoritesByUser(userId);
      return favorites.some(fav => fav.productId === productId);
    } catch (error) {
      console.error(`Failed to check if product ${productId} is favorited:`, error);
      return false;
    }
  }
}

export default new FavoriteService();
