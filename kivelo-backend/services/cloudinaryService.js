import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

class CloudinaryService {
  // === Upload using local file path (disk storage) ===
  static async uploadImage(filePath, folder = "avatars") {
    try {
      const fullFolder = folder.startsWith("kivelo-images/")
        ? folder
        : `kivelo-images/${folder}`;

      const result = await cloudinary.uploader.upload(filePath, {
        folder: fullFolder,
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" },
          { format: "jpg" },
        ],
      });

      console.log("✅ Upload successful:", result.public_id);
      return result;
    } catch (error) {
      console.error("❌ Cloudinary upload failed:", error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  // === Upload using memory buffer (for render/multer memory) ===
  static async uploadBuffer(buffer, folder = "avatars") {
    return new Promise((resolve, reject) => {
      const fullFolder = folder.startsWith("kivelo-images/")
        ? folder
        : `kivelo-images/${folder}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: fullFolder,
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" },
            { format: "jpg" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  // === Delete from cloudinary ===
  static async deleteImage(publicId) {
    if (!publicId) {
      console.warn("⚠️ deleteImage called with empty publicId");
      return null;
    }

    try {
      console.log("🗑 Deleting Cloudinary image:", publicId);
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });

      if (!["ok", "deleted"].includes(result.result)) {
        console.warn("⚠️ Delete result:", result.result);
      } else {
        console.log("✅ Cloudinary image deleted:", publicId);
      }

      return result;
    } catch (error) {
      console.error("❌ Cloudinary delete failed:", error);
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }
}

export default CloudinaryService;
