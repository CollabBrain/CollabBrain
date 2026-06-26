import {
  useQuery,
  useMutation,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { getSocket } from '../../../socket/socket';
import { useChatStore } from '../../../store/useChatStore';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  getConversationsApi,
  getMessagesApi,
  sendMessageApi,
  createOrGetConversationApi,
  markAsReadApi,
  searchUsersApi,
  getPinnedMessagesApi,
  togglePinMessageApi,
  uploadFileApi,
} from '../services/chat.service';
import type {
  SendMessagePayload,
  CreateConversationPayload,
  SocketNewMessage,
  SocketTypingEvent,
  SocketOnlineStatus,
  Message,
} from '../../../types/chat.types';

// ========== Query Keys ==========
export const CHAT_KEYS = {
  conversations: ['chat', 'conversations'] as const,
  messages: (convId: string) => ['chat', 'messages', convId] as const,
  searchUsers: (q: string) => ['chat', 'searchUsers', q] as const,
};

// ========== Conversations ==========

/** Load danh sách conversations & đồng bộ vào store */
export const useConversations = () => {
  const setConversations = useChatStore((s) => s.setConversations);

  return useQuery({
    queryKey: CHAT_KEYS.conversations,
    queryFn: async () => {
      try {
        const res = await getConversationsApi();
        const convs = res.data.data?.conversations ?? [];
        setConversations(convs);
        return convs;
      } catch (err) {
        // Don't wipe the store on network/rate-limit errors
        console.warn('[useConversations] fetch failed, keeping existing store:', err);
        return [];
      }
    },
    staleTime: 30_000,
    retry: false,
  });
};

/** Tạo hoặc lấy conversation 1-1 */
export const useCreateConversation = () => {
  const addOrUpdate = useChatStore((s) => s.addOrUpdateConversation);
  const setActive = useChatStore((s) => s.setActiveConversation);

  return useMutation({
    mutationFn: (data: CreateConversationPayload) => createOrGetConversationApi(data),
    onSuccess: ({ data }) => {
      const conv = data.data!;
      addOrUpdate(conv);
      setActive(conv.id);
      // Note: Do NOT invalidateQueries here — addOrUpdate already updates the store.
      // Invalidation causes a refetch loop when navigating to ChatPage.
    },
  });
};

// ========== Messages với Infinite Scroll ==========

const MESSAGE_PAGE_SIZE = 30;

/**
 * Load messages với infinite scroll (dùng useInfiniteQuery).
 * - Trang 1 = messages mới nhất
 * - Load thêm = prepend messages cũ hơn
 */
export const useInfiniteMessages = (conversationId: string | null) => {
  const prependMessages = useChatStore((s) => s.prependMessages);
  const setMessages = useChatStore((s) => s.setMessages);
  const setHasMore = useChatStore((s) => s.setHasMore);

  return useInfiniteQuery({
    queryKey: CHAT_KEYS.messages(conversationId ?? ''),
    enabled: !!conversationId,
    initialPageParam: 1,
    getNextPageParam: (lastPage: { page: number; hasMore: boolean }) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    queryFn: async ({ pageParam }) => {
      if (!conversationId) return { messages: [], page: 1, hasMore: false, total: 0 };
      const res = await getMessagesApi(conversationId, pageParam as number, MESSAGE_PAGE_SIZE);
      const result = res.data?.data ?? { messages: [], page: 1, hasMore: false, total: 0 };

      const msgs = result.messages ?? [];
      const hasMore = !!result.hasMore;

      if (pageParam === 1) {
        // Lần đầu: set toàn bộ (messages server trả về đã sort cũ→mới)
        setMessages(conversationId, msgs);
      } else {
        // Load thêm: prepend vào đầu danh sách (messages cũ hơn)
        prependMessages(conversationId, msgs);
      }
      setHasMore(conversationId, hasMore);
      return { ...result, messages: msgs, hasMore };
    },
    staleTime: 0,
  });
};

// ========== Send Message với Optimistic Update ==========

export const useSendMessage = () => {
  const addMessage = useChatStore((s) => s.addMessage);
  const addOrUpdate = useChatStore((s) => s.addOrUpdateConversation);

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendMessageApi(payload),

    // Optimistic: thêm tin vào store ngay lập tức với id tạm
    onMutate: (payload) => {
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: Message = {
        id: optimisticId,
        conversationId: payload.conversationId,
        senderId: 'me', // sẽ bị replace khi server confirm
        content: payload.content,
        type: payload.type ?? 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addMessage(optimisticMsg);
      return { optimisticId };
    },

    onSuccess: ({ data }, _, context) => {
      const realMsg = data.data!;
      // Xoá optimistic message khỏi store, thêm real message
      useChatStore.setState((state) => {
        const convId = realMsg.conversationId;
        const msgs = state.messagesByConversation[convId] ?? [];
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [convId]: msgs
              .filter((m) => m.id !== context?.optimisticId)
              .concat(realMsg),
          },
        };
      });
      // Cập nhật lastMessage cho conversation (use getState to avoid subscription)
      const conv = useChatStore.getState().conversations.find((c) => c.id === realMsg.conversationId);
      if (conv) addOrUpdate({ ...conv, lastMessage: realMsg, updatedAt: realMsg.createdAt });
    },

    onError: (_, __, context) => {
      if (!context?.optimisticId) return;
      // Rollback: xoá optimistic message
      useChatStore.setState((state) => {
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(state.messagesByConversation)) {
          updated[convId] = msgs.filter((m) => m.id !== context.optimisticId);
        }
        return { messagesByConversation: updated };
      });
    },
  });
};


// ========== Mark As Read ==========

export const useMarkAsRead = () => {
  const markRead = useChatStore((s) => s.markConversationRead);
  return useMutation({
    mutationFn: (conversationId: string) => markAsReadApi(conversationId),
    onSuccess: (_, conversationId) => markRead(conversationId),
  });
};

// ========== Recall / Delete Message ==========

import { recallMessageApi, deleteMessageApi } from '../services/chat.service';

/** Thu hồi tin nhắn (hiển thị "Tin nhắn đã được thu hồi") */
export const useRecallMessage = () => {
  return useMutation({
    mutationFn: (messageId: string) => recallMessageApi(messageId),
    onSuccess: (_, messageId) => {
      useChatStore.setState((state) => {
        const updatedMsgs: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(state.messagesByConversation)) {
          updatedMsgs[convId] = msgs.map((m) =>
            m.id === messageId
              ? { ...m, content: '🚫 Tin nhắn đã được thu hồi', type: 'text' as const }
              : m
          );
        }

        const updatedConvs = state.conversations.map((c) => {
          if (c.lastMessage?.id === messageId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                content: '🚫 Tin nhắn đã được thu hồi',
                type: 'text' as const,
              },
            };
          }
          return c;
        });

        return {
          messagesByConversation: updatedMsgs,
          conversations: updatedConvs,
        };
      });
    },
  });
};

/** Xoá tin nhắn phía mình (chỉ ẩn với người gửi) */
export const useDeleteMessage = () => {
  return useMutation({
    mutationFn: (messageId: string) => deleteMessageApi(messageId),
    onSuccess: (_, messageId) => {
      useChatStore.setState((state) => {
        const updatedMsgs: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(state.messagesByConversation)) {
          updatedMsgs[convId] = msgs.filter((m) => m.id !== messageId);
        }

        const updatedConvs = state.conversations.map((c) => {
          if (c.lastMessage?.id === messageId) {
            const convMsgs = updatedMsgs[c.id] || [];
            const newLastMsg = convMsgs.length > 0 ? convMsgs[convMsgs.length - 1] : null;
            return {
              ...c,
              lastMessage: newLastMsg,
            };
          }
          return c;
        });

        return {
          messagesByConversation: updatedMsgs,
          conversations: updatedConvs,
        };
      });
    },
  });
};

// ========== User Search ==========

export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: CHAT_KEYS.searchUsers(query),
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const res = await searchUsersApi(query);
      return res.data.data?.users ?? [];
    },
    staleTime: 10_000,
  });
};

// ========== Pinned Messages & File Upload ==========

export const usePinnedMessages = (conversationId: string | null) => {
  const setPinnedMessages = useChatStore((s) => s.setPinnedMessages);

  return useQuery({
    queryKey: ['chat', 'pinned', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await getPinnedMessagesApi(conversationId);
      const msgs = res.data.data ?? [];
      setPinnedMessages(conversationId, msgs);
      return msgs;
    },
    staleTime: 30_000,
  });
};

export const useTogglePinMessage = () => {
  const togglePinnedMessage = useChatStore((s) => s.togglePinnedMessage);

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; conversationId: string }) => togglePinMessageApi(messageId),
    onSuccess: ({ data }, variables) => {
      const msg = data.data!;
      togglePinnedMessage(variables.conversationId, msg, msg.isPinned!);
    },
  });
};

export const useUploadChatFile = () => {
  return useMutation({
    mutationFn: (file: File) => uploadFileApi(file),
  });
};

// ========== Socket Integration ==========

/**
 * Hook đăng ký socket events cho chat.
 * Gọi 1 lần tại ChatPage.
 */
export const useChatSocket = () => {
  const addMessage = useChatStore((s) => s.addMessage);
  const addOrUpdate = useChatStore((s) => s.addOrUpdateConversation);
  const setTyping = useChatStore((s) => s.setTyping);
  const setOnlineStatus = useChatStore((s) => s.setOnlineStatus);
  const accessToken = useAuthStore((s) => s.accessToken);

  const conversationsRef = useRef(useChatStore.getState().conversations);
  useEffect(() => {
    return useChatStore.subscribe(
      (state) => { conversationsRef.current = state.conversations; }
    );
  }, []);

  const handleNewMessage = useCallback(
    ({ message }: SocketNewMessage) => {
      addMessage(message);
      const conv = conversationsRef.current.find((c) => c.id === message.conversationId);
      if (conv) {
        let myId = '';
        if (accessToken) {
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            myId = payload.id ?? payload.sub ?? payload.userId ?? '';
          } catch {}
        }
        const isFromMe = message.senderId === myId;
        addOrUpdate({
          ...conv,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: isFromMe ? conv.unreadCount : conv.unreadCount + 1,
        });
      }
    },
    [addMessage, addOrUpdate, accessToken]
  );

  const handleTyping = useCallback(
    ({ conversationId, userId, isTyping }: SocketTypingEvent) => {
      setTyping(conversationId, userId, isTyping);
    },
    [setTyping]
  );

  const handleOnlineStatus = useCallback(
    ({ userId, isOnline }: SocketOnlineStatus) => {
      setOnlineStatus(userId, isOnline);
    },
    [setOnlineStatus]
  );

  const handleInitialOnline = useCallback(
    ({ onlineUserIds }: { onlineUserIds: string[] }) => {
      // Bulk-set tất cả users hiện đang online khi mới kết nối
      useChatStore.getState().setMultipleOnlineStatus(onlineUserIds, true);
    },
    []
  );

  const handleMessageRecalled = useCallback(
    ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      useChatStore.setState((state) => {
        const msgs = state.messagesByConversation[conversationId] ?? [];
        const updated = msgs.map((m) =>
          m.id === messageId
            ? { ...m, content: '🚫 Tin nhắn đã được thu hồi', type: 'text' as const }
            : m
        );
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: updated,
          },
        };
      });

      const convs = useChatStore.getState().conversations;
      const conv = convs.find((c) => c.id === conversationId);
      if (conv && conv.lastMessage?.id === messageId) {
        addOrUpdate({
          ...conv,
          lastMessage: {
            ...conv.lastMessage,
            content: '🚫 Tin nhắn đã được thu hồi',
            type: 'text' as const,
          },
        });
      }
    },
    [addOrUpdate]
  );

  const handleMessageDeleted = useCallback(
    ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      useChatStore.setState((state) => {
        const msgs = state.messagesByConversation[conversationId] ?? [];
        const updated = msgs.filter((m) => m.id !== messageId);
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: updated,
          },
        };
      });
    },
    []
  );

  const handleMessagePinned = useCallback(
    ({ messageId, message, isPinned, conversationId }: any) => {
      useChatStore.getState().togglePinnedMessage(conversationId, message, isPinned);
    },
    []
  );

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('user:online_status', handleOnlineStatus);
    socket.on('user:initial_online', handleInitialOnline);
    socket.on('chat:message_recalled', handleMessageRecalled);
    socket.on('chat:message_deleted', handleMessageDeleted);
    socket.on('chat:message_pinned', handleMessagePinned);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('user:online_status', handleOnlineStatus);
      socket.off('user:initial_online', handleInitialOnline);
      socket.off('chat:message_recalled', handleMessageRecalled);
      socket.off('chat:message_deleted', handleMessageDeleted);
      socket.off('chat:message_pinned', handleMessagePinned);
    };
  }, [accessToken, handleNewMessage, handleTyping, handleOnlineStatus, handleInitialOnline, handleMessageRecalled, handleMessageDeleted]);
};

// ========== Emit helpers ==========

export const useEmitTyping = () => {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!accessToken) return;
      const socket = getSocket();
      if (!socket?.connected) return;
      socket.emit('chat:typing', { conversationId, isTyping });
    },
    [accessToken]
  );
};

export const useEmitMessage = () => {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useCallback(
    (payload: SendMessagePayload, _currentUserId: string): boolean => {
      if (!accessToken) return false;
      const socket = getSocket();
      if (!socket?.connected) return false;

      // Just emit — server will broadcast chat:new_message back to sender,
      // which will be handled by the socket handler in ChatPage.
      // No optimistic add here to avoid duplicate messages.
      socket.emit('chat:send_message', payload);
      return true;
    },
    [accessToken]
  );
};
