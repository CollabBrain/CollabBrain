import axiosInstance from '../../../services/axiosInstance';
import type { GroupMessage, GroupMessagesResponse, ChatFileAttachment } from '../../../types/chat.types';

const BASE = '/chat/groups';

/**
 * Lấy lịch sử tin nhắn group (phân trang)
 * GET /chat/groups/:groupId/messages?page=&limit=
 */
export const getGroupMessagesApi = async (
  groupId: string,
  page = 1,
  limit = 30
): Promise<{ data: GroupMessagesResponse }> => {
  const res = await axiosInstance.get(`${BASE}/${groupId}/messages`, {
    params: { page, limit }
  });
  return { data: res.data.data };
};

/**
 * Lấy danh sách tin nhắn đã ghim trong group
 * GET /chat/groups/:groupId/messages/pinned
 */
export const getGroupPinnedMessagesApi = async (groupId: string): Promise<GroupMessage[]> => {
  const res = await axiosInstance.get(`${BASE}/${groupId}/messages/pinned`);
  return res.data.data || [];
};

/**
 * Toggle pin/unpin một tin nhắn (chỉ OWNER)
 * PATCH /chat/groups/:groupId/messages/:msgId/pin
 */
export const togglePinMessageApi = async (groupId: string, msgId: string): Promise<GroupMessage> => {
  const res = await axiosInstance.patch(`${BASE}/${groupId}/messages/${msgId}/pin`);
  return res.data.data;
};

/**
 * Thu hồi tin nhắn trong group
 * DELETE /chat/groups/:groupId/messages/:msgId?type=recall
 */
export const recallGroupMessageApi = async (groupId: string, msgId: string): Promise<GroupMessage> => {
  const res = await axiosInstance.delete(`${BASE}/${groupId}/messages/${msgId}?type=recall`);
  return res.data.data;
};

/**
 * Xóa tin nhắn của mình trong group (soft delete)
 * DELETE /chat/groups/:groupId/messages/:msgId?type=delete
 */
export const deleteGroupMessageApi = async (groupId: string, msgId: string): Promise<void> => {
  await axiosInstance.delete(`${BASE}/${groupId}/messages/${msgId}?type=delete`);
};

/**
 * Upload file trong group chat
 * POST /chat/groups/:groupId/upload
 * Trả về Document record + URL để gửi tin nhắn file
 */
export const uploadGroupChatFileApi = async (
  groupId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ChatFileAttachment> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axiosInstance.post(`${BASE}/${groupId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    }
  });
  return res.data.data;
};

/**
 * Helper: Format kiểu file để hiển thị icon
 */
export const getFileTypeLabel = (mimeType: string, fileName: string): string => {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  const ext = fileName.split('.').pop()?.toUpperCase() || '';
  const map: Record<string, string> = {
    PDF: 'PDF', DOCX: 'DOCX', DOC: 'DOCX',
    PPTX: 'PPTX', PPT: 'PPTX',
    XLSX: 'XLSX', XLS: 'XLSX'
  };
  return map[ext] || 'FILE';
};

/**
 * Helper: Format bytes thành KB/MB
 */
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
