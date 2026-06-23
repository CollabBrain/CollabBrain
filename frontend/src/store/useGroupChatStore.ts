import { create } from 'zustand';
import type { GroupMessage } from '../types/chat.types';

// ——— Stable empty refs ———
const EMPTY_MESSAGES: GroupMessage[] = [];
const EMPTY_STRINGS: string[] = [];

interface GroupChatState {
  // Messages theo groupId
  messagesByGroup: Record<string, GroupMessage[]>;
  // Pinned messages theo groupId
  pinnedMessages: Record<string, GroupMessage[]>;
  // Typing users theo groupId → userId[]
  typingUsers: Record<string, string[]>;
  // Typing user names (cho hiển thị "Nguyễn A đang nhập...")
  typingUserNames: Record<string, Record<string, string>>; // groupId → userId → name
  // Phân trang
  messagePage: Record<string, number>;
  hasMoreMessages: Record<string, boolean>;
  // Loading state
  loadingMessages: Record<string, boolean>;

  // ——— Actions ———
  setMessages: (groupId: string, messages: GroupMessage[]) => void;
  prependMessages: (groupId: string, messages: GroupMessage[]) => void;
  addMessage: (message: GroupMessage) => void;
  updateMessage: (message: GroupMessage) => void;
  removeMessage: (groupId: string, messageId: string) => void;

  setPinnedMessages: (groupId: string, messages: GroupMessage[]) => void;
  addOrUpdatePinned: (message: GroupMessage) => void;
  removePinned: (groupId: string, messageId: string) => void;

  setTyping: (groupId: string, userId: string, userName: string, isTyping: boolean) => void;

  setHasMore: (groupId: string, hasMore: boolean) => void;
  incrementPage: (groupId: string) => void;
  resetMessages: (groupId: string) => void;
  setLoading: (groupId: string, loading: boolean) => void;
}

export const useGroupChatStore = create<GroupChatState>((set) => ({
  messagesByGroup: {},
  pinnedMessages: {},
  typingUsers: {},
  typingUserNames: {},
  messagePage: {},
  hasMoreMessages: {},
  loadingMessages: {},

  setMessages: (groupId, messages) =>
    set((state) => ({
      messagesByGroup: { ...state.messagesByGroup, [groupId]: messages },
    })),

  prependMessages: (groupId, messages) =>
    set((state) => {
      const existing = state.messagesByGroup[groupId] || [];
      return {
        messagesByGroup: {
          ...state.messagesByGroup,
          [groupId]: [...messages, ...existing],
        },
      };
    }),

  addMessage: (message) =>
    set((state) => {
      const existing = state.messagesByGroup[message.groupId] || [];
      // Tránh duplicate
      if (existing.find((m) => m.id === message.id)) return state;
      return {
        messagesByGroup: {
          ...state.messagesByGroup,
          [message.groupId]: [...existing, message],
        },
      };
    }),

  updateMessage: (message) =>
    set((state) => {
      const existing = state.messagesByGroup[message.groupId] || [];
      return {
        messagesByGroup: {
          ...state.messagesByGroup,
          [message.groupId]: existing.map((m) => (m.id === message.id ? message : m)),
        },
        // Cũng update trong pinned nếu có
        pinnedMessages: {
          ...state.pinnedMessages,
          [message.groupId]: (state.pinnedMessages[message.groupId] || []).map((m) =>
            m.id === message.id ? message : m
          ),
        },
      };
    }),

  removeMessage: (groupId, messageId) =>
    set((state) => ({
      messagesByGroup: {
        ...state.messagesByGroup,
        [groupId]: (state.messagesByGroup[groupId] || []).filter((m) => m.id !== messageId),
      },
    })),

  setPinnedMessages: (groupId, messages) =>
    set((state) => ({
      pinnedMessages: { ...state.pinnedMessages, [groupId]: messages },
    })),

  addOrUpdatePinned: (message) =>
    set((state) => {
      const existing = state.pinnedMessages[message.groupId] || [];
      const idx = existing.findIndex((m) => m.id === message.id);
      let updated: GroupMessage[];
      if (idx >= 0) {
        updated = existing.map((m) => (m.id === message.id ? message : m));
      } else {
        updated = [message, ...existing];
      }
      return { pinnedMessages: { ...state.pinnedMessages, [message.groupId]: updated } };
    }),

  removePinned: (groupId, messageId) =>
    set((state) => ({
      pinnedMessages: {
        ...state.pinnedMessages,
        [groupId]: (state.pinnedMessages[groupId] || []).filter((m) => m.id !== messageId),
      },
    })),

  setTyping: (groupId, userId, userName, isTyping) =>
    set((state) => {
      const currentIds = state.typingUsers[groupId] || [];
      const updatedIds = isTyping
        ? Array.from(new Set([...currentIds, userId]))
        : currentIds.filter((id) => id !== userId);

      const currentNames = state.typingUserNames[groupId] || {};
      const updatedNames = { ...currentNames };
      if (isTyping) updatedNames[userId] = userName;
      else delete updatedNames[userId];

      return {
        typingUsers: { ...state.typingUsers, [groupId]: updatedIds },
        typingUserNames: { ...state.typingUserNames, [groupId]: updatedNames },
      };
    }),

  setHasMore: (groupId, hasMore) =>
    set((state) => ({
      hasMoreMessages: { ...state.hasMoreMessages, [groupId]: hasMore },
    })),

  incrementPage: (groupId) =>
    set((state) => ({
      messagePage: {
        ...state.messagePage,
        [groupId]: (state.messagePage[groupId] || 1) + 1,
      },
    })),

  resetMessages: (groupId) =>
    set((state) => ({
      messagesByGroup: { ...state.messagesByGroup, [groupId]: [] },
      messagePage: { ...state.messagePage, [groupId]: 1 },
      hasMoreMessages: { ...state.hasMoreMessages, [groupId]: true },
    })),

  setLoading: (groupId, loading) =>
    set((state) => ({
      loadingMessages: { ...state.loadingMessages, [groupId]: loading },
    })),
}));

// ——— Selectors ———
export const selectGroupMessages = (groupId: string) => (state: GroupChatState): GroupMessage[] =>
  state.messagesByGroup[groupId] || EMPTY_MESSAGES;

export const selectGroupPinnedMessages = (groupId: string) => (state: GroupChatState): GroupMessage[] =>
  state.pinnedMessages[groupId] || EMPTY_MESSAGES;

export const selectGroupTypingUserNames = (groupId: string) => (state: GroupChatState): string[] => {
  const names = state.typingUserNames[groupId] || {};
  return Object.values(names);
};

export const selectGroupHasMore = (groupId: string) => (state: GroupChatState): boolean =>
  state.hasMoreMessages[groupId] ?? true;

export const selectGroupPage = (groupId: string) => (state: GroupChatState): number =>
  state.messagePage[groupId] || 1;
