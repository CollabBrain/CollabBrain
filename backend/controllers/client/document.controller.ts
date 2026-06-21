import { Request, Response } from "express";
import axios from "axios";
import {
  uploadPersonalDocumentService,
  uploadGroupDocumentService,
  getPersonalDocumentsService,
  getGroupDocumentsService,
  getDocumentDetailService,
  softDeleteDocumentService,
  restoreDocumentService,
} from "../../services/client/document.service";
import { findDocumentByIdRaw } from "../../repositories/client/document.repo";

// [POST] /documents/upload
export const uploadPersonalDocumentPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        code: 400,
        message: "Không tìm thấy file để upload",
      });
    }
    const result = await uploadPersonalDocumentService(file, userId);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`,
    });
  }
};

// [POST] /groups/:groupId/documents/upload
export const uploadGroupDocumentPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const groupId = req.params.groupId as string;
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        code: 400,
        message: "Không tìm thấy file để upload",
      });
    }
    const result = await uploadGroupDocumentService(file, groupId, userId);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`,
    });
  }
};

// [GET] /documents/my
export const getPersonalDocumentsGet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;
    const sort = (req.query.sort as string === 'oldest') ? 'oldest' : 'newest';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const result = await getPersonalDocumentsService(userId, search, type, page, limit, sort);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      }
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`,
    });
  }
};

// [GET] /groups/:groupId/documents
export const getGroupDocumentsGet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const groupId = req.params.groupId as string;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;
    const result = await getGroupDocumentsService(groupId, userId, search, type);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data,
      total: result.total,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`,
    });
  }
};

// [GET] /documents/:documentId
export const getDocumentDetailGet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const documentId = req.params.documentId as string;
    const result = await getDocumentDetailService(documentId, userId);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`,
    });
  }
};

// [PATCH] /documents/:documentId/soft-delete
export const softDeleteDocumentPatch = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const documentId = req.params.documentId as string;
    const result = await softDeleteDocumentService(documentId, userId);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`,
    });
  }
};

// [PATCH] /documents/:documentId/restore
export const restoreDocumentPatch = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const documentId = req.params.documentId as string;
    const result = await restoreDocumentService(documentId, userId);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`,
    });
  }
};

export const downloadDocumentGet = async (req: Request, res: Response) => {
  try {
    const documentId = req.params.documentId as string;
    const document = await findDocumentByIdRaw(documentId);
    
    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    const response = await axios({
      url: document.url,
      method: 'GET',
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.name)}"`);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');

    response.data.pipe(res);
  } catch (error: any) {
    console.error("Lỗi khi tải file từ Cloudinary:", error?.message || error);
    res.status(500).json({ message: "Lỗi khi tải file từ Cloudinary" });
  }
};
