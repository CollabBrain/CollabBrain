import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type FormEvent,
} from 'react';
import {
  Send,
  Loader2,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  MessageSquareOff,
  ChevronDown,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useChatStore, selectActiveMessages } from '../../../store/useChatStore';
import {
  useInfiniteMessages,
  useSendMessage,
  useMarkAsRead,
  useEmitMessage,
  useEmitTyping,
  useRecallMessage,
  useDeleteMessage,
} from '../hooks/useChat';
import MessageBubble, { TypingIndicator, DateDivider } from './MessageBubble';
import { cn } from '../../../lib/utils';
import type { Conversation, ChatUser, Message } from '../../../types/chat.types';

// Stable empty array reference to prevent re-render loops
const EMPTY_STRINGS: string[] = [];

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onBackMobile?: () => void;
}

const shouldShowDate = (prevDate: string | null | undefined, currDate: string | null | undefined): boolean => {
  if (!currDate) return false;
  if (!prevDate) return true;
  const d1 = new Date(prevDate);
  const d2 = new Date(currDate);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return d1.toDateString() !== d2.toDateString();
};

const getOtherParticipant = (conv: Conversation, userId: string): ChatUser | null => {
  if (!conv || !Array.isArray(conv.participants)) return null;
  return conv.participants.find((p) => p && p.id !== userId) ?? null;
};

// ——— Message Context Menu ———
interface ContextMenu {
  x: number;
  y: number;
  messageId: string;
  isMine: boolean;
}

// ——— Header ———
const ChatHeader = ({
  other,
  isOnline,
  onBack,
}: {
  other: ChatUser;
  isOnline: boolean;
  onBack?: () => void;
}) => {
  const initials = (other.name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="mr-1 h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors md:hidden"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      <div className="relative shrink-0">
        {other.avatarUrl ? (
          <img src={other.avatarUrl} alt={other.name || 'User'} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-xs">
            {initials}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{other.name || 'User'}</p>
        <p className="text-xs text-muted-foreground">
          {isOnline
            ? <span className="text-emerald-600 font-medium">Đang hoạt động</span>
            : 'Offline'}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Gọi thoại">
          <Phone className="h-4 w-4" />
        </button>
        <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Gọi video">
          <Video className="h-4 w-4" />
        </button>
        <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Thêm tùy chọn">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ——— Scroll To Bottom Button ———
const ScrollToBottomBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="absolute bottom-20 right-6 h-9 w-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-all hover:scale-105 z-10"
    aria-label="Cuộn xuống dưới"
  >
    <ChevronDown className="h-4 w-4" />
  </button>
);

// ——— Main ChatWindow ———
const ChatWindow = ({ conversation, currentUserId, onBackMobile }: ChatWindowProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isTypingLocally, setIsTypingLocally] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Sentinel cho infinite scroll — khi hiện trong viewport → load thêm
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);

  // Store
  const messages = useChatStore(selectActiveMessages);
  const typingUserIds = useChatStore((s) => s.typingUsers[conversation.id] ?? EMPTY_STRINGS);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const hasMore = useChatStore((s) => s.hasMoreMessages[conversation.id] ?? true);

  // Hooks
  const { isLoading: isLoadingMsgs, fetchNextPage, isFetchingNextPage } = useInfiniteMessages(conversation.id);
  const sendMsgMutation = useSendMessage();
  const markRead = useMarkAsRead();
  const emitMessage = useEmitMessage();
  const emitTyping = useEmitTyping();
  const recallMutation = useRecallMessage();
  const deleteMutation = useDeleteMessage();

  const other = getOtherParticipant(conversation, currentUserId);
  const isOtherOnline = other ? (onlineUsers[other.id] ?? other.isOnline ?? false) : false;
  const isOtherTyping = typingUserIds.some((id) => id !== currentUserId);

  // ——— Scroll helpers ———
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Đánh dấu đã đọc khi mở
  const markedRef = useRef<string>('');
  useEffect(() => {
    if (conversation.id === markedRef.current) return;
    markedRef.current = conversation.id;
    if (conversation.unreadCount > 0) {
      markRead.mutate(conversation.id);
    }
    scrollToBottom('instant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Scroll to bottom khi có tin mới (chỉ nếu đang gần cuối)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Giữ scroll position khi prepend (load thêm trang cũ)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFetchingNextPage) return;
    // Sau khi prepend, restore lại vị trí scroll
    const delta = container.scrollHeight - prevScrollHeightRef.current;
    if (delta > 0) {
      container.scrollTop += delta;
    }
  }, [messages.length, isFetchingNextPage]);

  // IntersectionObserver cho infinite scroll
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetchingNextPage) {
          // Lưu scrollHeight trước khi prepend
          prevScrollHeightRef.current = containerRef.current?.scrollHeight ?? 0;
          fetchNextPage();
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  // Hiện nút scroll to bottom
  const handleScroll = () => {
    const c = containerRef.current;
    if (!c) return;
    const distFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
    setShowScrollBtn(distFromBottom > 300);
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [inputValue]);

  // Typing
  const handleTypingStart = useCallback(() => {
    if (!isTypingLocally) {
      setIsTypingLocally(true);
      emitTyping(conversation.id, true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTypingLocally(false);
      emitTyping(conversation.id, false);
    }, 2000);
  }, [isTypingLocally, emitTyping, conversation.id]);

  // Send
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return;

    setInputValue('');
    if (isTypingLocally) {
      setIsTypingLocally(false);
      emitTyping(conversation.id, false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    const payload = { conversationId: conversation.id, content, type: 'text' as const };
    const sentViaSocket = emitMessage(payload, currentUserId);

    if (!sentViaSocket) {
      try {
        await sendMsgMutation.mutateAsync(payload);
      } catch (err) {
        console.error('[ChatWindow] sendMessage error:', err);
      }
    }
    scrollToBottom();
  }, [
    inputValue, isTypingLocally, emitTyping, conversation.id,
    emitMessage, currentUserId, sendMsgMutation, scrollToBottom,
  ]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Context menu
  const handleContextMenu = (e: React.MouseEvent, msg: Message, isMine: boolean) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id, isMine });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleRecall = () => {
    if (!contextMenu) return;
    recallMutation.mutate(contextMenu.messageId);
    closeContextMenu();
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    deleteMutation.mutate(contextMenu.messageId);
    closeContextMenu();
  };

  if (!other) return null;

  return (
    <div className="flex flex-col h-full bg-background relative" onClick={closeContextMenu}>
      <ChatHeader other={other} isOnline={isOtherOnline} onBack={onBackMobile} />

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative"
        onScroll={handleScroll}
      >
        {/* Sentinel top — trigger load more */}
        <div ref={topSentinelRef} className="h-1 w-full" />

        {/* Load more spinner */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Hint hết trang */}
        {!hasMore && messages.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground/50 py-2">
            Đây là đầu cuộc trò chuyện
          </p>
        )}

        {isLoadingMsgs && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoadingMsgs && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquareOff className="h-8 w-8 text-primary/50" />
            </div>
            <p className="font-medium text-muted-foreground">Chưa có tin nhắn nào</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Hãy gửi tin nhắn đầu tiên cho {other.name}!
            </p>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, idx) => {
          const isMine = msg.senderId === currentUserId;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;

          const showDate = shouldShowDate(prevMsg?.createdAt ?? null, msg.createdAt);
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

          return (
            <div
              key={msg.id}
              onContextMenu={(e) => handleContextMenu(e, msg, isMine)}
            >
              {showDate && <DateDivider dateStr={msg.createdAt} />}
              <div className={cn(isFirstInGroup && !showDate ? 'mt-2' : 'mt-0.5')}>
                <MessageBubble
                  message={msg}
                  isMine={isMine}
                  sender={isMine ? null : other}
                  showAvatar={!isMine}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                />
              </div>
            </div>
          );
        })}

        {isOtherTyping && (
          <div className="mt-2">
            <TypingIndicator senderName={other.name} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && <ScrollToBottomBtn onClick={() => scrollToBottom()} />}

      {/* Input */}
      <form
        onSubmit={(e: FormEvent) => { e.preventDefault(); handleSend(); }}
        className="px-4 py-3 border-t border-border bg-card flex items-end gap-3 shrink-0"
      >
        <div className="flex-1 relative">
          <textarea
            id="message-input"
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleTypingStart();
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Nhắn tin cho ${other.name}...`}
            className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 placeholder:text-muted-foreground transition-all max-h-[120px] leading-relaxed"
          />
        </div>

        <button
          id="send-message-btn"
          type="submit"
          disabled={!inputValue.trim() || sendMsgMutation.isPending}
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 shrink-0',
            inputValue.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg scale-100 hover:scale-105'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {sendMsgMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </form>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px] animate-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.isMine && (
              <button
                onClick={handleRecall}
                disabled={recallMutation.isPending}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4 text-amber-500" />
                Thu hồi tin nhắn
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Xoá phía tôi
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
