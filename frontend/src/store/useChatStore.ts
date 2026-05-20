import { create } from 'zustand';
import type { Conversation, Message, ChatUser } from '../types/chat.types';

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

  setHasMore: (conversationId: string, hasMore: boolean) => void;
  incrementPage: (conversationId: string) => void;
  resetMessages: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  typingUsers: {},
  onlineUsers: {},
  messagePage: {},
  hasMoreMessages: {},

  setConversations: (convs) => set({ conversations: convs }),

  addOrUpdateConversation: (conv) =>
    set((state) => {
      const exists = state.conversations.find((c) => c.id === conv.id);
      if (exists) {
        return {
          conversations: state.conversations
            .map((c) => (c.id === conv.id ? conv : c))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        };
      }
      return {
        conversations: [conv, ...state.conversations],
      };
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
}));

// ——— Selectors ———
export const selectActiveConversation = (state: ChatState): Conversation | undefined => {
  return state.conversations.find((c) => c.id === state.activeConversationId);
};

export const selectActiveMessages = (state: ChatState): Message[] => {
  if (!state.activeConversationId) return [];
  return state.messagesByConversation[state.activeConversationId] || [];
};

export const selectTypingInActive = (state: ChatState): string[] => {
  if (!state.activeConversationId) return [];
  return state.typingUsers[state.activeConversationId] || [];
};
