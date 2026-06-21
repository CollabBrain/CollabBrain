import { useState } from 'react';
import { Search, Plus, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { useChatStore } from '../../../store/useChatStore';
import { cn } from '../../../lib/utils';
import type { Conversation, ChatUser } from '../../../types/chat.types';
import UserSearchModal from './UserSearchModal';

// Stable empty array reference to prevent re-render loops
const EMPTY_STRINGS: string[] = [];

interface ChatSidebarProps {
  isLoading?: boolean;
  currentUserId: string;
}

// ——— helpers ———
const getOtherParticipant = (conv: Conversation, currentUserId: string): ChatUser | null => {
  if (!conv || !Array.isArray(conv.participants)) return null;
  return conv.participants.find((p) => p && p.id !== currentUserId) ?? null;
};

const formatTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// ——— Avatar ———
const ConvAvatar = ({ user, isOnline }: { user: ChatUser; isOnline: boolean }) => {
  const initials = (user.name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="relative shrink-0">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name || 'User'}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </div>
      )}
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
      )}
    </div>
  );
};

// ——— Conversation Item ———
const ConversationItem = ({
  conv,
  currentUserId,
  isActive,
  onClick,
}: {
  conv: Conversation;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const other = getOtherParticipant(conv, currentUserId);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const typingUsers = useChatStore((s) => s.typingUsers[conv.id] ?? EMPTY_STRINGS);

  if (!other) return null;

  const isOnline = onlineUsers[other.id] ?? other.isOnline ?? false;
  const isTyping = typingUsers.some((id) => id !== currentUserId);
  const lastMsg = conv.lastMessage;

  return (
    <button
      id={`conv-item-${conv.id}`}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150',
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/70 border border-transparent'
      )}
    >
      <ConvAvatar user={other} isOnline={isOnline} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn('font-semibold text-sm truncate', isActive && 'text-primary')}>
            {other.name}
          </span>
          {lastMsg && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
              {formatTime(lastMsg.createdAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {isTyping ? (
            <span className="text-xs text-primary italic animate-pulse">Đang nhập...</span>
          ) : (
            <p className="text-xs text-muted-foreground truncate">
              {lastMsg ? lastMsg.content : <span className="italic">Bắt đầu trò chuyện</span>}
            </p>
          )}
          {conv.unreadCount > 0 && (
            <span className="ml-2 shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ——— Main Sidebar ———
const ChatSidebar = ({ isLoading, currentUserId }: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const filtered = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const other = getOtherParticipant(conv, currentUserId);
    if (!other) return false;
    const q = searchQuery.toLowerCase();
    return other.name.toLowerCase().includes(q) || other.email.toLowerCase().includes(q);
  });

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <>
      <aside className="flex flex-col h-full w-full bg-card border-r border-border">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base">Tin nhắn</h2>
              {totalUnread > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <button
              id="new-chat-btn"
              onClick={() => setIsSearchModalOpen(true)}
              className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
              title="Tin nhắn mới"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Filter search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              id="conv-search-input"
              type="text"
              placeholder="Lọc cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/60 text-xs focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {/* AI Assistant Row */}
          <button
            onClick={() => setActiveConversation('ai-assistant')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 mb-1 border-0 outline-none cursor-pointer',
              activeConversationId === 'ai-assistant'
                ? 'bg-indigo-50/70 border border-indigo-100/50 text-indigo-700 shadow-sm font-bold'
                : 'hover:bg-slate-50 border border-transparent'
            )}
          >
            <div className="relative shrink-0">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn('font-bold text-sm truncate text-slate-800', activeConversationId === 'ai-assistant' && 'text-indigo-600')}>
                  AI Assistant
                </span>
                <span className="text-[10px] text-indigo-500 font-semibold shrink-0 ml-1">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold truncate">
                Ready to help you study
              </p>
            </div>
          </button>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? 'Không có kết quả' : 'Chưa có cuộc trò chuyện'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="mt-3 text-xs text-primary font-medium hover:underline"
                >
                  Bắt đầu nhắn tin mới →
                </button>
              )}
            </div>
          )}

          {filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              currentUserId={currentUserId}
              isActive={activeConversationId === conv.id}
              onClick={() => setActiveConversation(conv.id)}
            />
          ))}
        </div>
      </aside>

      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

export default ChatSidebar;
