const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Upload image or video buffer to Cloudinary
 * @param {Buffer} buffer - Image/Video buffer
 * @param {string} folder - Cloudinary folder name
 * @param {string} filename - Original filename
 * @param {Object} options - Additional options (resource_type, format, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'ecommerce-brands', filename = '', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: options.resource_type || 'image',
      ...options
    };

    // Add transformations for images only
    if ((options.resource_type || 'image') === 'image') {
      uploadOptions.transformation = [
        { width: 500, height: 500, crop: 'limit', quality: 'auto' }
      ];
    }

    // Add public_id if filename is provided
    if (filename) {
      const nameWithoutExt = filename.split('.')[0]; // Remove extension
      uploadOptions.public_id = `${folder}/${nameWithoutExt}-${Date.now()}`;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
const extractPublicId = (url) => {
  if (!url) return null;
  
  // Extract public ID from Cloudinary URL
  const matches = url.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : null;
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of file objects with buffer and originalname
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} Array of Cloudinary upload results
 */
const uploadMultipleToCloudinary = async (files, folder = 'ecommerce-products') => {
  const uploadPromises = files.map((file, index) => {
    const filename = file.originalname || `image_${index}_${Date.now()}`;
    return uploadToCloudinary(file.buffer, folder, filename);
  });
  
  return Promise.all(uploadPromises);
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>} Array of deletion results
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  const deletePromises = publicIds.map(publicId => deleteFromCloudinary(publicId));
  return Promise.all(deletePromises);
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  uploadMultipleToCloudinary,
  deleteMultipleFromCloudinary
};
