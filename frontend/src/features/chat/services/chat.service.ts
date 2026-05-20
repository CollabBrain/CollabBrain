import axiosInstance from '../../../services/axiosInstance';
import type {
  ApiResponse,
} from '../../../types';
import type {
  Conversation,
  Message,
  MessagesResponse,
  ConversationsResponse,
  SendMessagePayload,
  CreateConversationPayload,
  SearchUsersResponse,
} from '../../../types/chat.types';

// ========== Conversation APIs ==========

/** Lấy danh sách cuộc trò chuyện của user hiện tại */
export const getConversationsApi = () =>
  axiosInstance.get<ApiResponse<ConversationsResponse>>('/chat/conversations');

/** Tạo hoặc lấy conversation 1-1 với một user */
export const createOrGetConversationApi = (data: CreateConversationPayload) =>
  axiosInstance.post<ApiResponse<Conversation>>('/chat/conversations', data);

/** Lấy thông tin 1 conversation */
export const getConversationByIdApi = (conversationId: string) =>
  axiosInstance.get<ApiResponse<Conversation>>(`/chat/conversations/${conversationId}`);

// ========== Message APIs ==========

/** Lấy messages của 1 conversation (có phân trang) */
export const getMessagesApi = (conversationId: string, page = 1, limit = 30) =>
  axiosInstance.get<ApiResponse<MessagesResponse>>(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page, limit } }
  );

/** Gửi tin nhắn (fallback REST khi socket lỗi) */
export const sendMessageApi = (data: SendMessagePayload) =>
  axiosInstance.post<ApiResponse<Message>>('/chat/messages', data);

/** Thu hồi tin nhắn (hiển thị "Tin nhắn đã được thu hồi" với tất cả thành viên) */
export const recallMessageApi = (messageId: string) =>
  axiosInstance.delete<ApiResponse<null>>(`/chat/messages/${messageId}`, {
    params: { type: 'recall' },
  });

/** Xoá tin nhắn phía mình (chỉ ẩn với người gửi, type=delete) */
export const deleteMessageApi = (messageId: string) =>
  axiosInstance.delete<ApiResponse<null>>(`/chat/messages/${messageId}`, {
    params: { type: 'delete' },
  });

/** Đánh dấu đã đọc tất cả messages trong conversation */
export const markAsReadApi = (conversationId: string) =>
  axiosInstance.patch<ApiResponse<null>>(
    `/chat/conversations/${conversationId}/read`
  );

// ========== User Search APIs ==========

/** Tìm kiếm user để bắt đầu chat */
export const searchUsersApi = (query: string) =>
  axiosInstance.get<ApiResponse<SearchUsersResponse>>('/chat/users/search', {
    params: { q: query },
  });
