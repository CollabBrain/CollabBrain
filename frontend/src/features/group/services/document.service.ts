import axiosInstance from '../../../services/axiosInstance';
import type { ApiResponse } from '../../../types';

// ============================================================
// Types
// ============================================================
export type DocumentType = 'PDF' | 'DOCX' | 'PPTX' | 'XLSX' | 'LINK' | 'IMAGE';

export interface DocumentData {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  size: number | null;
  mimeType: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  groupId: string | null;
  uploadedBy: string;
  uploader: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  canDelete?: boolean;
}

export interface DocumentListResponse {
  data: DocumentData[];
  total: number;
  page?: number;
  limit?: number;
}

// ============================================================
// Group Documents
// ============================================================

/** POST /groups/:groupId/documents/upload — Upload tài liệu vào group */
export const uploadGroupDocumentApi = (
  groupId: string,
  file: File,
  onProgress?: (percent: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosInstance.post<ApiResponse<DocumentData>>(
    `/groups/${groupId}/documents/upload`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );
};

/** GET /groups/:groupId/documents — Danh sách tài liệu group */
export const getGroupDocumentsApi = (
  groupId: string,
  params?: { search?: string; type?: string }
) =>
  axiosInstance.get<ApiResponse<DocumentData[]>>(`/groups/${groupId}/documents`, {
    params,
  });

// ============================================================
// Personal Documents
// ============================================================

/** POST /documents/upload — Upload tài liệu cá nhân */
export const uploadPersonalDocumentApi = (
  file: File,
  onProgress?: (percent: number) => void,
  conversationId?: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  if (conversationId) {
    formData.append('conversationId', conversationId);
  }
  return axiosInstance.post<ApiResponse<DocumentData>>(
    '/documents/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );
};

/** GET /documents/my — Danh sách tài liệu cá nhân */
export const getPersonalDocumentsApi = (params?: {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}) =>
  axiosInstance.get<ApiResponse<DocumentListResponse>>('/documents/my', { params });

// ============================================================
// Document Operations
// ============================================================

/** GET /documents/:documentId — Chi tiết tài liệu */
export const getDocumentDetailApi = (documentId: string) =>
  axiosInstance.get<ApiResponse<DocumentData>>(`/documents/${documentId}`);

/** PATCH /documents/:documentId/soft-delete — Xóa mềm */
export const softDeleteDocumentApi = (documentId: string) =>
  axiosInstance.patch<ApiResponse<null>>(`/documents/${documentId}/soft-delete`);

/** PATCH /documents/:documentId/restore — Khôi phục */
export const restoreDocumentApi = (documentId: string) =>
  axiosInstance.patch<ApiResponse<DocumentData>>(`/documents/${documentId}/restore`);

export const downloadDocumentApi = (documentId: string) =>
  axiosInstance.get(`/documents/${documentId}/download`, {
    responseType: 'blob', // Quan trọng: Yêu cầu trả về dạng blob (file)
  });
