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
}

export interface CreateConversationPayload {
  targetUserId: string;
}

// ========== Socket Events ==========
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

// ========== API Responses ==========
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
