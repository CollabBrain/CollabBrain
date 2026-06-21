import { Request, Response, NextFunction } from "express";

// MIME types cho phép
const ALLOWED_MIME_TYPES = [
  // PDF
  "application/pdf",
  // Word
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  // PowerPoint
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  // Excel
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Map MIME type → tên loại file thân thiện
const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word (DOCX)",
  "application/msword": "Word (DOC)",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint (PPTX)",
  "application/vnd.ms-powerpoint": "PowerPoint (PPT)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel (XLSX)",
  "application/vnd.ms-excel": "Excel (XLS)",
  "image/jpeg": "Ảnh JPEG",
  "image/png": "Ảnh PNG",
  "image/webp": "Ảnh WebP",
  "image/gif": "Ảnh GIF",
};

/**
 * Middleware validate file upload cho tài liệu
 */
export const validateDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      code: 400,
      message: "Vui lòng chọn file để tải lên",
    });
  }

  // Kiểm tra MIME type
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    const allowedLabels = [...new Set(Object.values(MIME_LABELS))].join(", ");
    return res.status(400).json({
      code: 400,
      message: `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedLabels}`,
    });
  }

  // Kiểm tra tên file không chứa ký tự đặc biệt nguy hiểm
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(req.file.originalname)) {
    return res.status(400).json({
      code: 400,
      message: "Tên file chứa ký tự không hợp lệ",
    });
  }

  next();
};
