import { DocumentType } from "@prisma/client";
import prisma from "../../config/prisma";

// ============================================================
// Interfaces
// ============================================================
export interface CreateDocumentData {
  name: string;
  type: DocumentType;
  url: string;
  size?: number;
  mimeType?: string;
  groupId?: string;
  conversationId?: string;
  uploadedBy: string;
}

export interface DocumentQueryOptions {
  search?: string;
  type?: DocumentType;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}

// Select cho uploader info
const uploaderSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

// ============================================================
// Repository Functions
// ============================================================

/**
 * Tạo record document mới
 */
export const createDocument = async (data: CreateDocumentData) => {
  return prisma.document.create({
    data: {
      name: data.name,
      type: data.type,
      url: data.url,
      size: data.size,
      mimeType: data.mimeType,
      groupId: data.groupId || null,
      conversationId: data.conversationId || null,
      uploadedBy: data.uploadedBy,
    },
    include: {
      uploader: { select: uploaderSelect },
    },
  });
};

/**
 * Tìm document theo ID (chỉ lấy chưa xóa)
 */
export const findDocumentById = async (id: string) => {
  return prisma.document.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      uploader: { select: uploaderSelect },
    },
  });
};

/**
 * Tìm document theo ID (bao gồm đã xóa - dùng cho restore)
 */
export const findDocumentByIdRaw = async (id: string) => {
  return prisma.document.findFirst({
    where: { id },
    include: {
      uploader: { select: uploaderSelect },
    },
  });
};

/**
 * Lấy danh sách tài liệu theo groupId
 */
export const findDocumentsByGroupId = async (
  groupId: string,
  options?: DocumentQueryOptions
) => {
  const { search, type, page = 1, limit = 50, sort = 'newest' } = options || {};

  const where: any = {
    groupId,
    isDeleted: false,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (type) {
    where.type = type;
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploader: { select: uploaderSelect },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  return { documents, total, page, limit };
};

/**
 * Lấy danh sách tài liệu cá nhân (bao gồm cả tài liệu upload trong group)
 */
export const findDocumentsByUserId = async (
  userId: string,
  options?: DocumentQueryOptions
) => {
  const { search, type, page = 1, limit = 50, sort = 'newest' } = options || {};

  const where: any = {
    uploadedBy: userId,
    isDeleted: false,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (type) {
    where.type = type;
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploader: { select: uploaderSelect },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  return { documents, total, page, limit };
};

/**
 * Xóa mềm document
 */
export const softDeleteDocument = async (id: string) => {
  return prisma.document.update({
    where: { id },
    data: { isDeleted: true },
  });
};

/**
 * Khôi phục document đã xóa mềm
 */
export const restoreDocument = async (id: string) => {
  return prisma.document.update({
    where: { id },
    data: { isDeleted: false },
  });
};
