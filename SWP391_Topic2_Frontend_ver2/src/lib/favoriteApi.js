import { apiRequest } from './api';

/**
 * Add a product to favorites
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Favorite object
 */
export const addToFavorites = async (userId, productId) => {
  try {
    console.log("🔍 addToFavorites called with:", { userId, productId });
    
    const favoriteData = {
      userId: userId,
      productId: productId,
      createdDate: new Date().toISOString()
    };

    console.log("🔍 Sending favorite data:", favoriteData);

    const response = await apiRequest('/api/Favorite', {
      method: 'POST',
      body: favoriteData
    });

    console.log("🔍 addToFavorites response:", response);
    return response;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    console.error('Error details:', {
      userId,
      productId,
      status: error.status,
      message: error.message
    });
    throw error;
  }
};

/**
 * Remove a product from favorites
 * @param {number} favoriteId - Favorite ID
 * @returns {Promise<void>}
 */
export const removeFromFavorites = async (favoriteId) => {
  try {
    await apiRequest(`/api/Favorite/${favoriteId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Get user's favorite products
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of favorite objects
 */
export const getUserFavorites = async (userId) => {
  try {
    console.log("🔍 getUserFavorites called with userId:", userId);
    const response = await apiRequest(`/api/Favorite/user/${userId}`);
    console.log("🔍 getUserFavorites response:", response);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error getting user favorites:', error);
    console.error('Error details:', {
      userId,
      status: error.status,
      message: error.message
    });
    throw error;
  }
};

/**
 * Check if a product is favorited by user
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object|null>} Favorite object if exists, null otherwise
 */
export const isProductFavorited = async (userId, productId) => {
  try {
    console.log("🔍 isProductFavorited called with:", { userId, productId });
    const favorites = await getUserFavorites(userId);
    const result = favorites.find(fav => fav.productId === productId) || null;
    console.log("🔍 isProductFavorited result:", result);
    return result;
  } catch (error) {
    console.error('Error checking if product is favorited:', error);
    console.error('Error details:', {
      userId,
      productId,
      status: error.status,
      message: error.message
    });
    // Return null if API is not available or user doesn't have permission
    return null;
  }
};

/**
 * Toggle favorite status for a product
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @returns {Promise<{isFavorited: boolean, favoriteId?: number}>}
 */
export const toggleFavorite = async (userId, productId) => {
  try {
    const existingFavorite = await isProductFavorited(userId, productId);
    
    if (existingFavorite) {
      // Remove from favorites
      try {
        await removeFromFavorites(existingFavorite.favoriteId);
        return { isFavorited: false };
      } catch (removeError) {
        console.warn('Could not remove from favorites:', removeError);
        // If remove fails, assume it's still favorited
        return { isFavorited: true, favoriteId: existingFavorite.favoriteId };
      }
    } else {
      // Add to favorites
      try {
        const newFavorite = await addToFavorites(userId, productId);
        return { isFavorited: true, favoriteId: newFavorite.favoriteId };
      } catch (addError) {
        console.warn('Could not add to favorites:', addError);
        // If add fails, assume it's not favorited
        return { isFavorited: false };
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    // Return safe default state
    return { isFavorited: false };
  }
};
