// Utility functions for formatting price input

/**
 * Format number with commas for display
 * @param {string|number} value - The value to format
 * @returns {string} - Formatted string with commas
 */
export const formatPriceDisplay = (value) => {
  if (!value) return "";
  
  // Remove all non-numeric characters
  const numericValue = String(value).replace(/[^\d]/g, "");
  
  // Add commas every 3 digits from the right
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Parse formatted price back to numeric value
 * @param {string} formattedValue - The formatted value with commas
 * @returns {string} - Numeric string without formatting
 */
export const parsePriceValue = (formattedValue) => {
  if (!formattedValue) return "";
  
  // Remove all non-numeric characters
  return String(formattedValue).replace(/[^\d]/g, "");
};

/**
 * Format price for Vietnamese currency display
 * @param {string|number} value - The value to format
 * @returns {string} - Formatted string with spaces (Vietnamese style)
 */
export const formatVietnamesePrice = (value) => {
  if (!value) return "";
  
  // Remove all non-numeric characters
  const numericValue = String(value).replace(/[^\d]/g, "");
  
  // Add spaces every 3 digits from the right (Vietnamese style)
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};


