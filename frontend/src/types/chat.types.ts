// ========== Chat Types ==========

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  isRecalled?: boolean;
  isPinned?: boolean;
  pinnedBy?: string | null;
  pinnedAt?: string | null;
  replyToId?: string | null;
  replyTo?: ReplyPreview | null;
  createdAt: string;
  updatedAt: string;
  sender?: ChatUser;
}

export interface Conversation {
  id: string;
  participants: ChatUser[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

// ========== Payloads ==========
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  replyToId?: string;
}

export interface CreateConversationPayload {
  targetUserId: string;
}

// ========== Socket Events (1-1) ==========
export interface SocketNewMessage {
  message: Message;
  conversationId: string;
}

export interface SocketTypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface SocketOnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

// ========== API Responses (1-1) ==========
export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface SearchUsersResponse {
  users: ChatUser[];
}

// ========== GROUP CHAT Types ==========

export interface MentionedUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ReplyPreview {
  id: string;
  content: string;
  isRecalled: boolean;
  type: 'text' | 'image' | 'file' | 'TEXT' | 'IMAGE' | 'FILE';
  sender: { id: string; name: string };
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  sender: MentionedUser;
  content: string;
  type: 'text' | 'image' | 'file' | 'TEXT' | 'IMAGE' | 'FILE';
  isRead: boolean;
  isPinned: boolean;
  isRecalled: boolean;
  pinnedBy?: string | null;
  pinnedAt?: string | null;
  replyToId?: string | null;
  replyTo?: ReplyPreview | null;
  mentions?: { user: MentionedUser }[];
  createdAt: string;
  updatedAt?: string;
}

/** Payload gửi qua socket */
export interface GroupSendMessagePayload {
  groupId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  replyToId?: string;
  mentionIds?: string[];
}

/** Document đính kèm trong chat (sau khi upload) */
export interface ChatFileAttachment {
  document: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number | null;
    mimeType: string | null;
  };
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

// ========== Socket Events (Group) ==========
export interface GroupSocketNewMessage {
  groupId: string;
  message: GroupMessage;
}

export interface GroupSocketTyping {
  groupId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface GroupSocketMessagePinned {
  groupId: string;
  message: GroupMessage;
  isPinned: boolean;
}

export interface GroupSocketMessageRecalled {
  groupId: string;
  messageId: string;
  message: GroupMessage;
}

export interface GroupSocketMessageDeleted {
  groupId: string;
  messageId: string;
}

// ========== API Responses (Group) ==========
export interface GroupMessagesResponse {
  messages: GroupMessage[];
  total: number;
  page: number;
  hasMore: boolean;
}
