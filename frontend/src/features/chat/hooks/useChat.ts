import {
  useQuery,
  useMutation,
  useQueryClient,
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
      const res = await getConversationsApi();
      const convs = res.data.data?.conversations ?? [];
      setConversations(convs);
      return convs;
    },
    staleTime: 30_000,
  });
};

/** Tạo hoặc lấy conversation 1-1 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const addOrUpdate = useChatStore((s) => s.addOrUpdateConversation);
  const setActive = useChatStore((s) => s.setActiveConversation);

  return useMutation({
    mutationFn: (data: CreateConversationPayload) => createOrGetConversationApi(data),
    onSuccess: ({ data }) => {
      const conv = data.data!;
      addOrUpdate(conv);
      setActive(conv.id);
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
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
      const result = res.data.data!;

      if (pageParam === 1) {
        // Lần đầu: set toàn bộ (messages server trả về đã sort cũ→mới)
        setMessages(conversationId, result.messages);
      } else {
        // Load thêm: prepend vào đầu danh sách (messages cũ hơn)
        prependMessages(conversationId, result.messages);
      }
      setHasMore(conversationId, result.hasMore);
      return result;
    },
    staleTime: 0,
  });
};

// ========== Send Message với Optimistic Update ==========

export const useSendMessage = () => {
  const addMessage = useChatStore((s) => s.addMessage);
  const addOrUpdate = useChatStore((s) => s.addOrUpdateConversation);
  const conversations = useChatStore((s) => s.conversations);

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
      // Cập nhật lastMessage cho conversation
      const conv = conversations.find((c) => c.id === realMsg.conversationId);
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
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(state.messagesByConversation)) {
          updated[convId] = msgs.map((m) =>
            m.id === messageId
              ? { ...m, content: '🚫 Tin nhắn đã được thu hồi', type: 'text' as const }
              : m
          );
        }
        return { messagesByConversation: updated };
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
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(state.messagesByConversation)) {
          updated[convId] = msgs.filter((m) => m.id !== messageId);
        }
        return { messagesByConversation: updated };
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
        addOrUpdate({
          ...conv,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: conv.unreadCount + 1,
        });
      }
    },
    [addMessage, addOrUpdate]
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

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('user:online_status', handleOnlineStatus);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('user:online_status', handleOnlineStatus);
    };
  }, [accessToken, handleNewMessage, handleTyping, handleOnlineStatus]);
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
  const addMessage = useChatStore((s) => s.addMessage);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useCallback(
    (payload: SendMessagePayload, currentUserId: string): boolean => {
      if (!accessToken) return false;
      const socket = getSocket();
      if (!socket?.connected) return false;

      // Optimistic add
      const optimisticMsg: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId: payload.conversationId,
        senderId: currentUserId,
        content: payload.content,
        type: payload.type ?? 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addMessage(optimisticMsg);

      socket.emit('chat:send_message', payload);
      return true;
    },
    [accessToken, addMessage]
  );
};
