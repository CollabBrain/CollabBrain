import { create } from 'zustand';
import type { Conversation, Message, ChatUser } from '../types/chat.types';

// Stable empty array references to prevent infinite re-renders
const EMPTY_MESSAGES: Message[] = [];
const EMPTY_STRINGS: string[] = [];

interface ChatState {
  // Danh sách cuộc trò chuyện
  conversations: Conversation[];
  // Cuộc trò chuyện đang mở
  activeConversationId: string | null;
  // Messages theo conversationId
  messagesByConversation: Record<string, Message[]>;
  // Trạng thái typing theo conversationId → userId[]
  typingUsers: Record<string, string[]>;
  // Trạng thái online của users
  onlineUsers: Record<string, boolean>;
  // Trang hiện tại khi load thêm messages
  messagePage: Record<string, number>;
  hasMoreMessages: Record<string, boolean>;

  // Pinned messages
  pinnedMessagesByConversation: Record<string, Message[]>;

  // ——— Actions ———
  setConversations: (convs: Conversation[]) => void;
  addOrUpdateConversation: (conv: Conversation) => void;
  setActiveConversation: (id: string | null) => void;

  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  markConversationRead: (conversationId: string) => void;

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  setMultipleOnlineStatus: (userIds: string[], isOnline: boolean) => void;

  setHasMore: (conversationId: string, hasMore: boolean) => void;
  incrementPage: (conversationId: string) => void;
  resetMessages: (conversationId: string) => void;

  setPinnedMessages: (conversationId: string, messages: Message[]) => void;
  togglePinnedMessage: (conversationId: string, message: Message, isPinned: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  typingUsers: {},
  onlineUsers: {},
  messagePage: {},
  hasMoreMessages: {},
  pinnedMessagesByConversation: {},

  setConversations: (convs) =>
    set((state) => {
      // Merge: giữ lại các conversation đã có trong store mà API không trả về
      // (ví dụ: conversation vừa tạo optimistic từ FriendsPage)
      const incomingIds = new Set(convs.map((c) => c.id));
      const preserved = state.conversations.filter((c) => !incomingIds.has(c.id));
      const merged = [...convs, ...preserved];

      // Sort theo updatedAt mới nhất
      merged.sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });

      // Avoid unnecessary re-renders: bail out if data hasn't changed
      if (
        merged.length === state.conversations.length &&
        merged.every((c, i) => c.id === state.conversations[i]?.id && c.updatedAt === state.conversations[i]?.updatedAt && c.unreadCount === state.conversations[i]?.unreadCount)
      ) {
        return state; // No change — don't trigger re-render
      }

      return { conversations: merged };
    }),

  addOrUpdateConversation: (conv) =>
    set((state) => {
      const exists = state.conversations.find((c) => c.id === conv.id);
      let updatedConvs = state.conversations;
      if (exists) {
        updatedConvs = state.conversations.map((c) => (c.id === conv.id ? conv : c));
      } else {
        updatedConvs = [conv, ...state.conversations];
      }
      
      const sorted = [...updatedConvs].sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        const finalB = isNaN(timeB) ? 0 : timeB;
        const finalA = isNaN(timeA) ? 0 : timeA;
        return finalB - finalA;
      });

      return { conversations: sorted };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...messages, ...existing],
        },
      };
    }),

  addMessage: (message) =>
    set((state) => {
      const { conversationId } = message;
      const existing = state.messagesByConversation[conversationId] || [];
      // Tránh duplicate
      if (existing.find((m) => m.id === message.id)) return state;
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, message],
        },
      };
    }),

  markConversationRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    })),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, userId]))
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    }),

  setOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  setMultipleOnlineStatus: (userIds, isOnline) =>
    set(() => {
      const updates: Record<string, boolean> = {};
      userIds.forEach(id => { updates[id] = isOnline; });
      // Thay thế toàn bộ map để clear các user đã offline khi reconnect
      return { onlineUsers: updates };
    }),


  setHasMore: (conversationId, hasMore) =>
    set((state) => ({
      hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: hasMore },
    })),

  incrementPage: (conversationId) =>
    set((state) => ({
      messagePage: {
        ...state.messagePage,
        [conversationId]: (state.messagePage[conversationId] || 1) + 1,
      },
    })),

  resetMessages: (conversationId) =>
    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: [] },
      messagePage: { ...state.messagePage, [conversationId]: 1 },
      hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: true },
    })),

  setPinnedMessages: (conversationId, messages) =>
    set((state) => ({
      pinnedMessagesByConversation: { ...state.pinnedMessagesByConversation, [conversationId]: messages }
    })),

  togglePinnedMessage: (conversationId, message, isPinned) =>
    set((state) => {
      const currentPins = state.pinnedMessagesByConversation[conversationId] || [];
      const currentMsgs = state.messagesByConversation[conversationId] || [];
      
      const newPins = isPinned 
        ? (currentPins.some(m => m.id === message.id) ? currentPins : [message, ...currentPins])
        : currentPins.filter(m => m.id !== message.id);
        
      const newMsgs = currentMsgs.map(m => m.id === message.id ? { ...m, isPinned } : m);

      return { 
        pinnedMessagesByConversation: { ...state.pinnedMessagesByConversation, [conversationId]: newPins },
        messagesByConversation: { ...state.messagesByConversation, [conversationId]: newMsgs }
      };
    }),
}));

// ——— Selectors ———
export const selectActiveConversation = (state: ChatState): Conversation | undefined => {
  return state.conversations.find((c) => c.id === state.activeConversationId);
};

export const selectActiveMessages = (state: ChatState): Message[] => {
  if (!state.activeConversationId) return EMPTY_MESSAGES;
  return state.messagesByConversation[state.activeConversationId] || EMPTY_MESSAGES;
};

export const selectTypingInActive = (state: ChatState): string[] => {
  if (!state.activeConversationId) return EMPTY_STRINGS;
  return state.typingUsers[state.activeConversationId] || EMPTY_STRINGS;
};
