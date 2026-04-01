const multer = require('multer');

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB limit for high-quality product images
    fieldSize: 25 * 1024 * 1024, // 25MB for field data 
    fields: 100, // Allow many form fields
    files: 15 // Allow up to 15 files (1 main + 14 additional)
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Upload filter - File:', file.fieldname, file.originalname, `${(file.size || 0 / 1024 / 1024).toFixed(2)}MB`);
    
    // Check if file is an image
    if (file.fieldname === 'brand_image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for brand logos'), false);
      }
    } else if (file.fieldname === 'image' || file.fieldname === 'images' || file.fieldname === 'additional_images') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Create specific upload configurations
const uploadSingle = multer({
  storage,
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB limit for single file uploads
    fieldSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Single upload filter - File:', file.fieldname, file.originalname);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadMultiple = multer({
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB per file (for video support)
    fieldSize: 25 * 1024 * 1024, // 25MB for field data
    files: 15, // Max 15 files (1 main + 14 additional)
    fields: 100, // Allow many form fields for product specifications
    parts: 200 // Allow many parts in multipart form
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multiple upload filter - File:', file.fieldname, file.originalname, file.mimetype);
    
    // Accept image files for product uploads
    if (file.fieldname === 'image' || 
        file.fieldname === 'additional_images' || 
        file.fieldname === 'images' ||
        file.fieldname === 'brand_image') {
      if (file.mimetype.startsWith('image/')) {
        // Additional size check
        console.log('✅ Image file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('❌ Invalid file type:', file.mimetype);
        cb(new Error(`Only image files are allowed for ${file.fieldname}. Got: ${file.mimetype}`), false);
      }
    } else if (file.fieldname === 'video') {
      // Accept video files
      if (file.mimetype.startsWith('video/') || 
          file.mimetype === 'application/octet-stream' ||
          file.originalname.match(/\.(mp4|webm|avi|mov|mkv)$/i)) {
        console.log('✅ Video file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('❌ Invalid video type:', file.mimetype);
        cb(new Error(`Only video files are allowed. Got: ${file.mimetype}`), false);
      }
    } else {
      // For other fields, allow all files (in case there are non-image fields)
      console.log('ℹ️ Non-image/video field accepted:', file.fieldname);
      cb(null, true);
    }
  }
});

module.exports = {
  single: uploadSingle,
  multiple: uploadMultiple,
  default: upload
};
