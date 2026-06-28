import { Request, Response } from "express";
import * as docRepo from "../../repositories/admin/document.repo";
import { ingestDocumentService } from "../../services/client/rag.service";
import prisma from "../../config/prisma";
import { DocumentType } from "@prisma/client";

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 10))));
    const search = req.query.search as string;
    const isEmbeddedStr = req.query.isEmbedded as string;
    const type = req.query.type as DocumentType;
    const uploadedBy = req.query.uploadedBy as string;
    const groupId = req.query.groupId as string;

    let isEmbedded: boolean | undefined = undefined;
    if (isEmbeddedStr === "true") isEmbedded = true;
    if (isEmbeddedStr === "false") isEmbedded = false;

    const result = await docRepo.findDocumentsAdmin(page, limit, {
      search: search?.trim() || undefined,
      isEmbedded,
      type,
      uploadedBy: uploadedBy?.trim() || undefined,
      groupId: groupId?.trim() || undefined,
    });

    res.status(200).json({
      success: true,
      data: result.documents,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách tài liệu",
    });
  }
};

export const reIngestDocument = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Reset status to false
    await prisma.document.update({
      where: { id },
      data: { isEmbedded: false }
    });

    // Start background re-ingestion
    ingestDocumentService(id).catch((err) => {
      console.error(`[Admin Re-ingest] Re-ingestion failed for doc ${id}:`, err);
    });

    res.status(200).json({
      success: true,
      message: "Đã kích hoạt nhúng lại tài liệu thành công. Vui lòng chờ vài giây.",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi nhúng lại tài liệu",
    });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await docRepo.deleteDocumentAdmin(id);

    res.status(200).json({
      success: true,
      message: "Xóa tài liệu khỏi hệ thống thành công",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi xóa tài liệu",
    });
  }
};
