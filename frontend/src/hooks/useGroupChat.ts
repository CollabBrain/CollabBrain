import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../socket/socket';
import { useGroupChatStore } from '../store/useGroupChatStore';
import {
  getGroupMessagesApi,
  getGroupPinnedMessagesApi,
  togglePinMessageApi,
  recallGroupMessageApi,
  deleteGroupMessageApi,
  uploadGroupChatFileApi
} from '../features/group/services/groupChat.service';
import type {
  GroupMessage,
  GroupSendMessagePayload,
  GroupSocketNewMessage,
  GroupSocketTyping,
  GroupSocketMessagePinned,
  GroupSocketMessageRecalled,
  GroupSocketMessageDeleted,
  ChatFileAttachment,
} from '../types/chat.types';

interface UseGroupChatOptions {
  groupId: string;
  myUserId: string;
  groupName?: string;
  /** Nếu tab chat đang được hiển thị, set true để bỏ qua toast notification */
  isVisible?: boolean;
}

interface ToastOptions {
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
}

/** Hiển thị toast nhẹ trong ứng dụng (không cần thư viện) */
const showInAppToast = ({ message, type = 'info', duration = 4000 }: ToastOptions) => {
  const existing = document.getElementById('group-chat-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'group-chat-toast';
  const bgColor = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1';
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${bgColor}; color: white;
    padding: 12px 18px; border-radius: 12px;
    font-size: 14px; font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    max-width: 320px; word-break: break-word;
    animation: slideInRight 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  // Inject animation nếu chưa có
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
};

export const useGroupChat = ({
  groupId,
  myUserId,
  groupName = 'Nhóm',
  isVisible = true,
}: UseGroupChatOptions) => {
  const typingTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isInitializedRef = useRef(false);

  // ================================================================
  // ——— Load initial data ———
  // ================================================================

  const loadMessages = useCallback(async (page = 1) => {
    try {
      useGroupChatStore.getState().setLoading(groupId, true);
      const result = await getGroupMessagesApi(groupId, page);
      if (page === 1) {
        useGroupChatStore.getState().setMessages(groupId, result.data.messages);
      } else {
        useGroupChatStore.getState().prependMessages(groupId, result.data.messages);
      }
      useGroupChatStore.getState().setHasMore(groupId, result.data.hasMore);
    } catch (err) {
      console.error('[GroupChat] Lỗi load messages:', err);
    } finally {
      useGroupChatStore.getState().setLoading(groupId, false);
    }
  }, [groupId]);

  const loadMoreMessages = useCallback(async () => {
    const currentPage = useGroupChatStore.getState().messagePage[groupId] || 1;
    const hasMore = useGroupChatStore.getState().hasMoreMessages[groupId] ?? true;
    if (!hasMore) return;
    const nextPage = currentPage + 1;
    useGroupChatStore.getState().incrementPage(groupId);
    await loadMessages(nextPage);
  }, [groupId, loadMessages]);

  const loadPinnedMessages = useCallback(async () => {
    try {
      const pinned = await getGroupPinnedMessagesApi(groupId);
      useGroupChatStore.getState().setPinnedMessages(groupId, pinned);
    } catch (err) {
      console.error('[GroupChat] Lỗi load pinned messages:', err);
    }
  }, [groupId]);

  // ================================================================
  // ——— Socket setup ———
  // ================================================================

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Load data lần đầu
    loadMessages(1);
    loadPinnedMessages();

    const socket = getSocket();
    if (!socket) return;

    // ——— group:new_message ———
    const onNewMessage = ({ groupId: gId, message }: GroupSocketNewMessage) => {
      if (gId !== groupId) return;
      useGroupChatStore.getState().addMessage(message);

      // Hiển thị toast nếu tab chat không đang được xem
      if (!isVisible && message.senderId !== myUserId) {
        const senderName = message.sender?.name || 'Ai đó';
        const preview = message.isRecalled
          ? '🚫 Tin nhắn đã được thu hồi'
          : message.content.length > 60
            ? message.content.slice(0, 60) + '...'
            : message.content;
        showInAppToast({
          message: `💬 ${senderName} trong ${groupName}: ${preview}`,
          type: 'info',
          duration: 5000
        });
      }
    };

    // ——— group:typing ———
    const onTyping = ({ groupId: gId, userId, userName, isTyping }: GroupSocketTyping) => {
      if (gId !== groupId) return;
      useGroupChatStore.getState().setTyping(groupId, userId, userName, isTyping);

      // Auto-clear typing sau 4s nếu không có event stop
      if (isTyping) {
        if (typingTimerRef.current[userId]) clearTimeout(typingTimerRef.current[userId]);
        typingTimerRef.current[userId] = setTimeout(() => {
          useGroupChatStore.getState().setTyping(groupId, userId, userName, false);
        }, 4000);
      }
    };

    // ——— group:message_pinned ———
    const onMessagePinned = ({ groupId: gId, message, isPinned }: GroupSocketMessagePinned) => {
      if (gId !== groupId) return;
      useGroupChatStore.getState().updateMessage(message);
      if (isPinned) {
        useGroupChatStore.getState().addOrUpdatePinned(message);
      } else {
        useGroupChatStore.getState().removePinned(groupId, message.id);
      }
    };

    // ——— group:message_recalled ———
    const onMessageRecalled = ({ groupId: gId, message }: GroupSocketMessageRecalled) => {
      if (gId !== groupId) return;
      useGroupChatStore.getState().updateMessage(message);
    };

    // ——— group:message_deleted ———
    const onMessageDeleted = ({ groupId: gId, messageId }: GroupSocketMessageDeleted) => {
      if (gId !== groupId) return;
      useGroupChatStore.getState().removeMessage(groupId, messageId);
    };

    socket.on('group:new_message', onNewMessage);
    socket.on('group:typing', onTyping);
    socket.on('group:message_pinned', onMessagePinned);
    socket.on('group:message_recalled', onMessageRecalled);
    socket.on('group:message_deleted', onMessageDeleted);

    return () => {
      socket.off('group:new_message', onNewMessage);
      socket.off('group:typing', onTyping);
      socket.off('group:message_pinned', onMessagePinned);
      socket.off('group:message_recalled', onMessageRecalled);
      socket.off('group:message_deleted', onMessageDeleted);

      // Clear all typing timers
      Object.values(typingTimerRef.current).forEach(clearTimeout);
      isInitializedRef.current = false;
    };
  }, [groupId]);

  // ================================================================
  // ——— Actions ———
  // ================================================================

  /** Gửi tin nhắn văn bản qua socket */
  const sendMessage = useCallback((
    content: string,
    options?: { replyToId?: string; mentionIds?: string[] }
  ) => {
    const socket = getSocket();
    if (!socket || !content.trim()) return;

    const payload: GroupSendMessagePayload = {
      groupId,
      content: content.trim(),
      type: 'text',
      ...options
    };
    socket.emit('group:send_message', payload);
  }, [groupId]);

  /** Gửi typing indicator */
  const sendTyping = useCallback((isTyping: boolean) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('group:typing', { groupId, isTyping });
  }, [groupId]);

  /** Toggle pin tin nhắn (chỉ OWNER) */
  const pinMessage = useCallback(async (msgId: string) => {
    try {
      // Gọi REST API — server sẽ emit socket event cho tất cả members
      await togglePinMessageApi(groupId, msgId);
      // Store sẽ được cập nhật qua socket event group:message_pinned
    } catch (err: any) {
      showInAppToast({ message: err?.response?.data?.message || 'Pin thất bại', type: 'error' });
    }
  }, [groupId]);

  /** Thu hồi tin nhắn qua socket (realtime) */
  const recallMessage = useCallback((msgId: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('group:recall_message', { groupId, messageId: msgId });
  }, [groupId]);

  /** Xóa tin nhắn (chỉ khỏi view của người gửi) */
  const deleteMessage = useCallback(async (msgId: string) => {
    try {
      await deleteGroupMessageApi(groupId, msgId);
      useGroupChatStore.getState().removeMessage(groupId, msgId);
    } catch (err: any) {
      showInAppToast({ message: err?.response?.data?.message || 'Xóa thất bại', type: 'error' });
    }
  }, [groupId]);

  /**
   * Upload file vào chat:
   * 1. Upload lên Supabase
   * 2. File tự động thêm vào Tài liệu nhóm + My Documents (server side)
   * 3. Gửi tin nhắn file qua socket
   */
  const uploadFile = useCallback(async (
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<ChatFileAttachment | null> => {
    try {
      const result = await uploadGroupChatFileApi(groupId, file, onProgress);
      // Gửi tin nhắn type=file với content là URL
      const socket = getSocket();
      if (socket) {
        socket.emit('group:send_message', {
          groupId,
          content: result.url,
          type: 'file',
        });
      }
      return result;
    } catch (err: any) {
      showInAppToast({ message: err?.response?.data?.message || 'Upload thất bại', type: 'error' });
      return null;
    }
  }, [groupId]);

  // ——— Selectors ———
  // Dùng equality function shallow để tránh infinite loop khi trả về mảng mới
  const messages = useGroupChatStore((s) => s.messagesByGroup[groupId]);
  const pinnedMessages = useGroupChatStore((s) => s.pinnedMessages[groupId]);
  const typingUserNames = useGroupChatStore((s) => s.typingUserNames[groupId]);
  const hasMore = useGroupChatStore((s) => s.hasMoreMessages[groupId] ?? true);
  const isLoading = useGroupChatStore((s) => s.loadingMessages[groupId] || false);

  // Fallbacks ổn định
  const safeMessages = messages || [];
  const safePinnedMessages = pinnedMessages || [];
  const safeTypingUserNames = typingUserNames ? Object.values(typingUserNames).filter(Boolean) : [];

  return {
    messages: safeMessages,
    pinnedMessages: safePinnedMessages,
    typingUserNames: safeTypingUserNames,
    hasMore,
    isLoading,
    sendMessage,
    sendTyping,
    pinMessage,
    recallMessage,
    deleteMessage,
    uploadFile,
    loadMoreMessages,
    loadPinnedMessages,
  };
};
