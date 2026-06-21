import { Router } from "express";
import { authMiddleware } from "../../middlewares/client/auth.middleware";
import { authIpLimiter } from "../../middlewares/client/rateLimit.middleware";
import { upload } from "../../helpers/storageMulter";
import { validateDocumentUpload } from "../../validates/client/document.validate";
import * as controller from "../../controllers/client/document.controller";

const router = Router();

// ============================================================
// Tài liệu cá nhân
// ============================================================

// [POST] /documents/upload — Upload tài liệu cá nhân
router.post(
  "/upload",
  authIpLimiter,
  authMiddleware,
  upload.single("file"),
  validateDocumentUpload,
  controller.uploadPersonalDocumentPost
);

// [GET] /documents/my — Danh sách tài liệu cá nhân
router.get("/my", authIpLimiter, authMiddleware, controller.getPersonalDocumentsGet);

// ============================================================
// Chi tiết / Xóa mềm / Khôi phục
// ============================================================

// [GET] /documents/:documentId — Chi tiết 1 tài liệu
router.get("/:documentId", authIpLimiter, authMiddleware, controller.getDocumentDetailGet);

// [PATCH] /documents/:documentId/soft-delete — Xóa mềm
router.patch("/:documentId/soft-delete", authIpLimiter, authMiddleware, controller.softDeleteDocumentPatch);

// [PATCH] /documents/:documentId/restore — Khôi phục
router.patch("/:documentId/restore", authIpLimiter, authMiddleware, controller.restoreDocumentPatch);

// [GET] /documents/:documentId/download — Tải xuống qua proxy
router.get("/:documentId/download", authIpLimiter, authMiddleware, controller.downloadDocumentGet);

export const documentRoutes = router;
