import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kivelo-images',
    format: 'jpeg',
    public_id: (req, file) => {
      return `${Date.now()}-${file.originalname.split('.')[0]}`;
    },
  },
});

export default cloudinary;