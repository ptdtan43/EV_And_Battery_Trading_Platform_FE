/**
 * Utility functions for adding watermarks to images
 */

/**
 * Add watermark to an image
 * @param {File} imageFile - The image file to watermark
 * @param {string} watermarkText - The watermark text to add
 * @param {Object} options - Watermark options
 * @returns {Promise<File>} - The watermarked image as a File
 */
export const addWatermarkToImage = (imageFile, watermarkText = "EV Trading Platform", options = {}) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Watermark settings - Make text more transparent
      const {
        fontSize = Math.max(img.width / 20, 16),
        fontFamily = 'Arial, sans-serif',
        color = 'rgba(255, 255, 255, 0.3)', // More transparent
        strokeColor = 'rgba(0, 0, 0, 0.2)', // Lighter stroke
        strokeWidth = 1, // Thinner stroke
        angle = -45,
        spacing = 150
      } = options;
      
      // Set font
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate watermark positions
      const textWidth = ctx.measureText(watermarkText).width;
      const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
      const numWatermarks = Math.ceil(diagonal / spacing) + 2;
      
      // Save current context
      ctx.save();
      
      // Rotate context for diagonal watermarks
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((angle * Math.PI) / 180);
      
      // Draw multiple watermarks
      for (let i = -numWatermarks; i <= numWatermarks; i++) {
        for (let j = -numWatermarks; j <= numWatermarks; j++) {
          const x = i * spacing;
          const y = j * spacing;
          
          // Draw stroke (outline)
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.strokeText(watermarkText, x, y);
          
          // Draw fill
          ctx.fillStyle = color;
          ctx.fillText(watermarkText, x, y);
        }
      }
      
      // Restore context
      ctx.restore();
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create new File from blob
          const watermarkedFile = new File([blob], imageFile.name, {
            type: imageFile.type,
            lastModified: Date.now()
          });
          resolve(watermarkedFile);
        } else {
          reject(new Error('Failed to create watermarked image'));
        }
      }, imageFile.type, 0.9);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Add watermark to multiple images
 * @param {File[]} imageFiles - Array of image files to watermark
 * @param {string} watermarkText - The watermark text
 * @param {Object} options - Watermark options
 * @returns {Promise<File[]>} - Array of watermarked images
 */
export const addWatermarkToImages = async (imageFiles, watermarkText = "EV Trading Platform", options = {}) => {
  try {
    const watermarkedFiles = await Promise.all(
      imageFiles.map(file => addWatermarkToImage(file, watermarkText, options))
    );
    return watermarkedFiles;
  } catch (error) {
    console.error('Error adding watermarks to images:', error);
    throw error;
  }
};

/**
 * Check if an image is a document image (for watermarking)
 * @param {string} imageType - The type/category of the image
 * @returns {boolean} - Whether the image should be watermarked
 */
export const shouldWatermarkImage = (imageType) => {
  return imageType === 'document' || imageType === 'Document' || imageType === 'DOCUMENT';
};
