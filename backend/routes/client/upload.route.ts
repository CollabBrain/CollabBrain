import { Router, Request, Response } from "express";
import { upload } from "../../helpers/storageMulter";
import { authMiddleware } from "../../middlewares/client/auth.middleware";
import { uploadToCloudinary } from "../../helpers/uploadToCloudinary";

const router = Router();

// Endpoint: POST /upload/image
// Bảo vệ bởi authMiddleware, nhận 1 tệp ảnh qua trường "image"
router.post(
  "/image",
  authMiddleware,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: "Không tìm thấy file ảnh để upload",
        });
      }

      // Đẩy ảnh lên thư mục 'uploads' trên Cloudinary
      const result = await uploadToCloudinary(req.file, "uploads");

      // Trả về cả 'url' và 'location' để tương thích tốt với TinyMCE và Avatar component
      return res.status(200).json({
        code: 200,
        url: result.url,
        location: result.url,
        publicId: result.publicId,
        message: "Tải ảnh lên thành công",
      });
    } catch (error: any) {
      return res.status(400).json({
        code: 400,
        message: error.message || "Đã xảy ra lỗi khi tải ảnh lên",
      });
    }
  }
);

export const uploadRoutes = router;
