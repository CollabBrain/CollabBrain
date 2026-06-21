import { DocumentType } from "@prisma/client";
import {
  createDocument,
  findDocumentById,
  findDocumentByIdRaw,
  findDocumentsByGroupId,
  findDocumentsByUserId,
  softDeleteDocument,
  restoreDocument,
} from "../../repositories/client/document.repo";
import { findGroupById, findGroupMember } from "../../repositories/client/group.repo";
import { uploadToCloudinary } from "../../helpers/uploadToCloudinary";

// ============================================================
// Helpers
// ============================================================

/**
 * Xác định DocumentType từ MIME type
 */
const getDocumentTypeFromMime = (mimeType: string): DocumentType => {
  if (mimeType === "application/pdf") return "PDF";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) return "DOCX";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint"
  ) return "PPTX";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) return "XLSX";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "PDF"; // fallback
};

// ============================================================
// Services
// ============================================================

/**
 * Upload tài liệu cá nhân
 */
export const uploadPersonalDocumentService = async (
  file: Express.Multer.File,
  userId: string
) => {
  if (!file) throw new Error("Không tìm thấy file để upload");

  const docType = getDocumentTypeFromMime(file.mimetype);

  // Upload lên Cloudinary
  const result = await uploadToCloudinary(file, `documents/personal/${userId}`);

  // Lưu record vào DB
  const document = await createDocument({
    name: file.originalname,
    type: docType,
    url: result.url,
    size: file.size,
    mimeType: file.mimetype,
    groupId: undefined, // tài liệu cá nhân
    uploadedBy: userId,
  });

  return {
    data: document,
    message: "Upload tài liệu cá nhân thành công",
  };
};

/**
 * Upload tài liệu vào group
 */
export const uploadGroupDocumentService = async (
  file: Express.Multer.File,
  groupId: string,
  userId: string
) => {
  if (!file) throw new Error("Không tìm thấy file để upload");

  // Kiểm tra group tồn tại
  const group = await findGroupById(groupId);
  if (!group) throw new Error("Nhóm không tồn tại");

  // Kiểm tra user là thành viên
  const member = await findGroupMember(groupId, userId);
  if (!member) throw new Error("Bạn không phải thành viên nhóm");

  // VIEWER không được upload
  if (member.role === "VIEWER") {
    throw new Error("Bạn không có quyền upload tài liệu vào nhóm này");
  }

  const docType = getDocumentTypeFromMime(file.mimetype);

  // Upload lên Cloudinary
  const result = await uploadToCloudinary(file, `documents/groups/${groupId}`);

  // Lưu record vào DB
  const document = await createDocument({
    name: file.originalname,
    type: docType,
    url: result.url,
    size: file.size,
    mimeType: file.mimetype,
    groupId,
    uploadedBy: userId,
  });

  return {
    data: document,
    message: "Upload tài liệu vào nhóm thành công",
  };
};

/**
 * Lấy danh sách tài liệu cá nhân
 */
export const getPersonalDocumentsService = async (
  userId: string,
  search?: string,
  type?: string,
  page: number = 1,
  limit: number = 50,
  sort: 'newest' | 'oldest' = 'newest'
) => {
  const docType = type && type !== "all" ? (type as DocumentType) : undefined;
  const result = await findDocumentsByUserId(userId, { search, type: docType, page, limit, sort });

  return {
    data: result.documents,
    total: result.total,
    page: result.page,
    limit: result.limit,
    message: "Lấy danh sách tài liệu cá nhân thành công",
  };
};

/**
 * Lấy danh sách tài liệu trong group
 */
export const getGroupDocumentsService = async (
  groupId: string,
  userId: string,
  search?: string,
  type?: string
) => {
  // Kiểm tra group tồn tại
  const group = await findGroupById(groupId);
  if (!group) throw new Error("Nhóm không tồn tại");

  // Kiểm tra user là thành viên (OWNER/MEMBER/VIEWER đều được xem)
  const member = await findGroupMember(groupId, userId);
  if (!member) throw new Error("Bạn không phải thành viên nhóm, không thể xem tài liệu");

  const docType = type && type !== "all" ? (type as DocumentType) : undefined;
  const result = await findDocumentsByGroupId(groupId, { search, type: docType });

  // Thêm field canDelete cho mỗi document
  const documentsWithPermission = result.documents.map((doc: any) => ({
    ...doc,
    canDelete: doc.uploadedBy === userId || member.role === "OWNER",
  }));

  return {
    data: documentsWithPermission,
    total: result.total,
    message: "Lấy danh sách tài liệu nhóm thành công",
  };
};

/**
 * Lấy chi tiết 1 tài liệu
 */
export const getDocumentDetailService = async (
  documentId: string,
  userId: string
) => {
  const document = await findDocumentById(documentId);
  if (!document) throw new Error("Tài liệu không tồn tại");

  // Kiểm tra quyền xem
  if (document.groupId) {
    // Tài liệu group → user phải là member
    const member = await findGroupMember(document.groupId, userId);
    if (!member) throw new Error("Bạn không có quyền xem tài liệu này");
  } else {
    // Tài liệu cá nhân → chỉ người upload
    if (document.uploadedBy !== userId) {
      throw new Error("Bạn không có quyền xem tài liệu này");
    }
  }

  return {
    data: document,
    message: "Lấy chi tiết tài liệu thành công",
  };
};

/**
 * Xóa mềm tài liệu
 */
export const softDeleteDocumentService = async (
  documentId: string,
  userId: string
) => {
  const document = await findDocumentById(documentId);
  if (!document) throw new Error("Tài liệu không tồn tại");

  // Kiểm tra quyền xóa
  let canDelete = document.uploadedBy === userId; // Người upload

  if (!canDelete && document.groupId) {
    // Hoặc OWNER của group
    const member = await findGroupMember(document.groupId, userId);
    if (member && member.role === "OWNER") {
      canDelete = true;
    }
  }

  if (!canDelete) {
    throw new Error("Bạn không có quyền xóa tài liệu này");
  }

  const result = await softDeleteDocument(documentId);
  return {
    data: result,
    message: "Xóa tài liệu thành công",
  };
};

/**
 * Khôi phục tài liệu đã xóa
 */
export const restoreDocumentService = async (
  documentId: string,
  userId: string
) => {
  const document = await findDocumentByIdRaw(documentId);
  if (!document) throw new Error("Tài liệu không tồn tại");
  if (!document.isDeleted) throw new Error("Tài liệu chưa bị xóa");

  // Kiểm tra quyền restore (tương tự quyền xóa)
  let canRestore = document.uploadedBy === userId;

  if (!canRestore && document.groupId) {
    const member = await findGroupMember(document.groupId, userId);
    if (member && member.role === "OWNER") {
      canRestore = true;
    }
  }

  if (!canRestore) {
    throw new Error("Bạn không có quyền khôi phục tài liệu này");
  }

  const result = await restoreDocument(documentId);
  return {
    data: result,
    message: "Khôi phục tài liệu thành công",
  };
};
