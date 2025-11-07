import { apiRequest } from '../lib/api';

// ✅ Image cache để tránh fetch lại nhiều lần
const imageCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

// ✅ Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 500; // 500ms giữa mỗi lần retry
const REQUEST_TIMEOUT = 8000; // 8 giây timeout

/**
 * Fetch product images với retry, cache và timeout
 * @param {number} productId - Product ID
 * @param {number} retryCount - Số lần đã retry
 * @returns {Promise<Array>} Array of images
 */
export const fetchProductImages = async (productId, retryCount = 0) => {
  if (!productId) {
    return [];
  }

  // ✅ Check cache first
  const cacheKey = `product_images_${productId}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Using cached images for product ${productId}`);
    return cached.images;
  }

  try {
    // ✅ Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Image request timeout')), REQUEST_TIMEOUT)
    );

    // ✅ Create image request promise
    const imagePromise = apiRequest(`/api/ProductImage/product/${productId}`, 'GET');

    // ✅ Race between timeout and request
    const imageResponse = await Promise.race([imagePromise, timeoutPromise]);

    // ✅ Parse response
    const images = Array.isArray(imageResponse) 
      ? imageResponse 
      : (imageResponse?.items || []);

    // ✅ Cache successful result
    imageCache.set(cacheKey, {
      images,
      timestamp: Date.now()
    });

    console.log(`✅ Successfully loaded ${images.length} images for product ${productId}`);
    return images;

  } catch (error) {
    console.log(`⚠️ Attempt ${retryCount + 1}/${MAX_RETRIES} failed for product ${productId}:`, error.message);

    // ✅ Retry logic
    if (retryCount < MAX_RETRIES - 1) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return fetchProductImages(productId, retryCount + 1);
    }

    // ✅ If all retries failed, check cache for stale data
    if (cached) {
      console.log(`⚠️ Using stale cache for product ${productId} after ${MAX_RETRIES} retries failed`);
      return cached.images;
    }

    console.error(`❌ Failed to load images for product ${productId} after ${MAX_RETRIES} attempts`);
    return [];
  }
};

/**
 * Batch fetch images for multiple products
 * @param {Array<number>} productIds - Array of product IDs
 * @param {number} batchSize - Number of products to process in parallel (default: 5)
 * @returns {Promise<Map<number, Array>>} Map of productId -> images
 */
export const batchFetchProductImages = async (productIds, batchSize = 5) => {
  const results = new Map();
  
  // ✅ Process in batches to avoid overwhelming the server
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);
    
    // ✅ Process batch in parallel
    const batchPromises = batch.map(async (productId) => {
      const images = await fetchProductImages(productId);
      return { productId, images };
    });

    try {
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ productId, images }) => {
        results.set(productId, images);
      });
    } catch (error) {
      console.error(`❌ Error processing batch ${i / batchSize + 1}:`, error);
      // Continue with next batch even if this one fails
    }

    // ✅ Small delay between batches to avoid overwhelming
    if (i + batchSize < productIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
};

/**
 * Preload image để đảm bảo nó đã được load trước khi hiển thị
 * @param {string} imageUrl - Image URL
 * @returns {Promise<boolean>} True if image loaded successfully
 */
export const preloadImage = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
};

/**
 * Clear image cache (useful for refresh)
 */
export const clearImageCache = () => {
  imageCache.clear();
  console.log('✅ Image cache cleared');
};

/**
 * Get cache stats (for debugging)
 */
export const getCacheStats = () => {
  return {
    size: imageCache.size,
    keys: Array.from(imageCache.keys())
  };
};

