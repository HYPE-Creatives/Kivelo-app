import { v2 as cloudinary } from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Simple memory storage as fallback
import multer from 'multer';
export const storage = multer.memoryStorage();

// Or create a custom Cloudinary storage
const customStorage = {
  _handleFile: (req, file, cb) => {
    // Implement your Cloudinary upload logic here
    cloudinary.uploader.upload_stream({
      folder: "kivelo-temp",
      resource_type: "auto"
    }, (error, result) => {
      if (error) return cb(error);
      cb(null, {
        path: result.secure_url,
        size: result.bytes,
        filename: result.public_id
      });
    }).end(file.buffer);
  },
  _removeFile: (req, file, cb) => {
    // Implement delete logic if needed
    cb(null);
  }
};

export default cloudinary;