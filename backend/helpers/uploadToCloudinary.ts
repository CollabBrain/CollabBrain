import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Cấu hình Cloudinary từ biến môi trường .env
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API,
  api_secret: process.env.CLOUD_SECRET,
});

/**
 * Hàm upload buffer file từ multer lên Cloudinary sử dụng stream.
 * @param file Tệp từ Multer (memoryStorage)
 * @param folder Thư mục lưu trữ trên Cloudinary
 * @returns Promise chứa url ảnh bảo mật và public_id
 */
export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder: string = "collab_brain"
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto", // tự động nhận diện ảnh/video/tài liệu
      },
      (error, result) => {
        if (error) {
          return reject(new Error("Lỗi upload Cloudinary: " + error.message));
        }
        if (!result) {
          return reject(new Error("Upload thất bại, không nhận được kết quả từ Cloudinary"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    // Ghi buffer vào stream để pipe lên Cloudinary
    Readable.from(file.buffer).pipe(uploadStream);
  });
};
