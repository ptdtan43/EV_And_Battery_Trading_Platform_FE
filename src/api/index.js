/**
 * API Module - Main Export
 * Export all API functions for easy access
 */

// Export everything from apiManager
export * from './apiManager';

// Export default API object
export { default } from './apiManager';

// You can now use APIs in two ways:
// 1. Import default object: import api from '@/api'
//    Usage: api.product.getAll()
//
// 2. Import specific modules: import { productAPI, authAPI } from '@/api'
//    Usage: productAPI.getAll()

