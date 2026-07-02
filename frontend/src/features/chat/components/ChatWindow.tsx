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
  Pin,
  X,
  Paperclip,
  CornerUpLeft,
  FileText,
  Image as ImageIcon,
  ChevronUp,
  Ban
} from 'lucide-react';
import { useChatStore, selectActiveMessages } from '../../../store/useChatStore';
import { useCallStore } from '../../../store/useCallStore';
import { useProfile } from '../../profile/hooks/useProfile';
import { getSocket } from '../../../socket/socket';
import {
  useInfiniteMessages,
  useSendMessage,
  useMarkAsRead,
  useEmitMessage,
  useEmitTyping,
  useRecallMessage,
  useDeleteMessage,
  usePinnedMessages,
  useTogglePinMessage,
  useUploadChatFile
} from '../hooks/useChat';
import MessageBubble, { TypingIndicator, DateDivider } from './MessageBubble';
import { cn } from '../../../lib/utils';
import type { Conversation, ChatUser, Message } from '../../../types/chat.types';
import { EmojiButton } from '../../../components/common/EmojiPicker';

// Stable empty array reference to prevent re-render loops
const EMPTY_STRINGS: string[] = [];
const EMPTY_MESSAGES: Message[] = [];

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
  onCall,
  callDisabled,
}: {
  other: ChatUser;
  isOnline: boolean;
  onBack?: () => void;
  onCall: (type: 'audio' | 'video') => void;
  callDisabled?: boolean;
}) => {
  const initials = (other.name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  let statusText = '';
  if (other.status) {
    if (other.statusExpiresAt) {
      if (new Date(other.statusExpiresAt) > new Date()) {
        statusText = other.status;
      }
    } else {
      statusText = other.status;
    }
  }

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
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{other.name || 'User'}</p>
          {statusText && (
            <span className="text-xs border border-indigo-100 bg-indigo-50 text-indigo-600 px-1.5 py-px rounded-md truncate max-w-[150px]" title={statusText}>
              {statusText}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isOnline
            ? <span className="text-emerald-600 font-medium">Đang hoạt động</span>
            : 'Offline'}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
            callDisabled
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:text-indigo-600'
          )}
          title={callDisabled ? 'Người dùng offline hoặc đang bận' : 'Gọi thoại'}
          onClick={() => !callDisabled && onCall('audio')}
          disabled={callDisabled}
          id="btn-voice-call"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
            callDisabled
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:text-indigo-600'
          )}
          title={callDisabled ? 'Người dùng offline hoặc đang bận' : 'Gọi video'}
          onClick={() => !callDisabled && onCall('video')}
          disabled={callDisabled}
          id="btn-video-call"
        >
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ file: File; type: 'image' | 'file'; previewUrl?: string } | null>(null);
  const [expandedPins, setExpandedPins] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const pinMutation = useTogglePinMessage();
  const uploadMutation = useUploadChatFile();

  usePinnedMessages(conversation.id);
  const pinnedMessages = useChatStore((s) => s.pinnedMessagesByConversation[conversation.id] ?? EMPTY_MESSAGES);

  const other = getOtherParticipant(conversation, currentUserId);
  const isOtherOnline = other ? (onlineUsers[other.id] ?? other.isOnline ?? false) : false;
  const isOtherTyping = typingUserIds.some((id) => id !== currentUserId);

  // ——— Call setup ———
  const { startCall, status: callStatus } = useCallStore();
  const { data: myProfile } = useProfile();

  const handleStartCall = useCallback(async (callType: 'audio' | 'video') => {
    if (!other) return;

    // Kiểm tra trình duyệt có hỗ trợ getUserMedia không (cần Secure Context)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Trình duyệt không hỗ trợ truy cập Camera/Micro. Hãy đảm bảo bạn đang dùng HTTPS hoặc localhost.');
      return;
    }

    try {
      // Yêu cầu quyền Camera/Micro ngay lập tức tại event click để vượt rào Safari iOS
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: callType === 'video' ? { facingMode: 'user' } : false,
      });
      // Lưu stream vào Store để dùng sau khi bên kia bắt máy
      useCallStore.getState().setLocalStream(stream);

      startCall(
        { id: other.id, name: other.name || 'User', avatarUrl: other.avatarUrl },
        callType
      );
      // Gửi tín hiệu call:request qua socket
      const socket = getSocket();
      if (socket) {
        socket.emit('call:request', {
          targetUserId: other.id,
          callType,
          callerInfo: {
            name: myProfile?.name || 'User',
            avatarUrl: myProfile?.avatarUrl || null,
          },
        });
      }
    } catch (err: any) {
      console.error('[Call] getUserMedia error:', err.name, err.message);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert(
          'Quyền Camera/Micro bị chặn!\n\n' +
          'Cách cấp quyền:\n' +
          '1. Click vào biểu tượng 🔒 trên thanh địa chỉ trình duyệt\n' +
          '2. Tìm "Camera" và "Microphone"\n' +
          '3. Chuyển sang "Allow" (Cho phép)\n' +
          '4. Tải lại trang (F5) và thử gọi lại'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('Không tìm thấy Camera hoặc Microphone. Vui lòng kiểm tra thiết bị đã được kết nối.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert('Camera/Micro đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.');
      } else {
        alert(`Không thể truy cập Camera/Micro: ${err.message}`);
      }
    }
  }, [other, startCall, myProfile]);

  // ——— Scroll helpers ———
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-pulse');
      setTimeout(() => el.classList.remove('animate-pulse'), 2000);
    }
  };

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
    if (!content && !selectedFile) return;

    let payloadType: 'text' | 'image' | 'file' = 'text';
    let finalContent = content;

    // Nếu có file upload
    if (selectedFile) {
      payloadType = selectedFile.type;
      try {
        const res = await uploadMutation.mutateAsync(selectedFile.file);
        const data = res.data.data;
        if (data) {
          finalContent = `${data.url}?filename=${encodeURIComponent(data.fileName)}`;
        }
      } catch (error) {
        console.error("Upload error:", error);
        return;
      }
    }

    setInputValue('');
    setSelectedFile(null);
    const replyToId = replyingTo?.id;
    setReplyingTo(null);

    if (isTypingLocally) {
      setIsTypingLocally(false);
      emitTyping(conversation.id, false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    const payload = { conversationId: conversation.id, content: finalContent, type: payloadType, replyToId };
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
    inputValue, selectedFile, replyingTo, isTypingLocally, emitTyping, conversation.id,
    emitMessage, currentUserId, sendMsgMutation, scrollToBottom, uploadMutation
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

  const handleReply = () => {
    if (!contextMenu) return;
    const msg = messages.find(m => m.id === contextMenu.messageId);
    if (msg) setReplyingTo(msg);
    closeContextMenu();
    textareaRef.current?.focus();
  };

  const handleTogglePin = () => {
    if (!contextMenu) return;
    pinMutation.mutate({ messageId: contextMenu.messageId, conversationId: conversation.id });
    closeContextMenu();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setSelectedFile({
      file,
      type: isImage ? 'image' : 'file',
      previewUrl: isImage ? URL.createObjectURL(file) : undefined
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    textareaRef.current?.focus();
  };

  // Insert emoji vào vị trí con trỏ trong textarea
  const handleEmojiSelect = useCallback((emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setInputValue(prev => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const newValue = ta.value.slice(0, start) + emoji + ta.value.slice(end);
    setInputValue(newValue);
    // Restore cursor position sau emoji
    requestAnimationFrame(() => {
      ta.selectionStart = start + emoji.length;
      ta.selectionEnd = start + emoji.length;
      ta.focus();
    });
  }, []);

  if (!other) return null;

  return (
    <div className="flex flex-col h-full bg-background relative" onClick={closeContextMenu}>
      <ChatHeader
        other={other}
        isOnline={isOtherOnline}
        onBack={onBackMobile}
        onCall={handleStartCall}
        callDisabled={!isOtherOnline || callStatus !== 'idle'}
      />

      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-2 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
            <div 
              className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleScrollToMessage(pinnedMessages[0].id)}
            >
              <p className="text-xs font-bold text-primary">{pinnedMessages.length} tin nhắn đã ghim</p>
              <p className="text-xs text-primary/80 truncate mt-0.5">
                {pinnedMessages[0].senderId === currentUserId ? 'Bạn' : other.name}: {pinnedMessages[0].isRecalled ? <span className="inline-flex items-center gap-1 align-text-bottom"><Ban className="w-3 h-3" /> Tin nhắn đã được thu hồi</span> : pinnedMessages[0].content || '[File/Ảnh]'}
              </p>
            </div>
            <button onClick={() => setExpandedPins(!expandedPins)} className="p-1 text-primary hover:bg-primary/10 transition-colors rounded">
              {expandedPins ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {expandedPins && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2 p-2 bg-background rounded-xl border border-primary/10 shadow-sm">
                  <div className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleScrollToMessage(msg.id)}>
                    <p className="text-xs font-bold text-foreground">{msg.senderId === currentUserId ? 'Bạn' : other.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {msg.isRecalled ? <span className="inline-flex items-center gap-1 align-text-bottom"><Ban className="w-3 h-3" /> Thu hồi</span> : msg.content || '[File/Ảnh]'}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); pinMutation.mutate({ messageId: msg.id, conversationId: conversation.id }); }} 
                    disabled={pinMutation.isPending}
                    className="p-1.5 bg-primary/10 text-primary hover:bg-rose-100 hover:text-rose-500 border border-primary/20 cursor-pointer rounded-md shrink-0 flex items-center justify-center transition-colors disabled:opacity-50" 
                    title="Bỏ ghim"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                  onCallAgain={handleStartCall}
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
        className="px-4 py-3 border-t border-border bg-card flex flex-col gap-2 shrink-0 relative"
      >
        {/* Reply Preview */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 border-l-4 border-primary/50 text-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col overflow-hidden">
              <span className="text-primary font-medium text-xs flex items-center gap-1.5">
                <CornerUpLeft className="h-3.5 w-3.5" />
                Đang trả lời {replyingTo.senderId === currentUserId ? 'chính bạn' : (other?.name || 'User')}
              </span>
              <span className="text-muted-foreground truncate w-full pr-4">{replyingTo.content || '[File/Ảnh]'}</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 rounded-full hover:bg-background/80 flex items-center justify-center shrink-0 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/20 text-sm animate-in fade-in">
            <div className="flex items-center gap-3 overflow-hidden">
              {selectedFile.type === 'image' && selectedFile.previewUrl ? (
                <img src={selectedFile.previewUrl} alt="Preview" className="h-10 w-10 object-cover rounded-md border border-border" />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-background rounded-md border border-border">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate max-w-[200px]">{selectedFile.file.name}</span>
                <span className="text-xs text-muted-foreground">{(selectedFile.file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="h-8 w-8 rounded-full hover:bg-background flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 w-full">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="*/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Đính kèm file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Emoji Picker */}
          <EmojiButton onEmojiSelect={handleEmojiSelect} />
          
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
              placeholder={`Nhắn tin cho ${other?.name}...`}
              className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 placeholder:text-muted-foreground transition-all max-h-[120px] leading-relaxed"
            />
          </div>

          <button
            id="send-message-btn"
            type="submit"
            disabled={(!inputValue.trim() && !selectedFile) || sendMsgMutation.isPending || uploadMutation.isPending}
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 shrink-0',
              (inputValue.trim() || selectedFile)
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg scale-100 hover:scale-105'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {(sendMsgMutation.isPending || uploadMutation.isPending)
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
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
            <button
              onClick={handleReply}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <CornerUpLeft className="h-4 w-4" />
              Trả lời
            </button>
            <button
              onClick={handleTogglePin}
              disabled={pinMutation.isPending}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              {messages.find(m => m.id === contextMenu.messageId)?.isPinned ? (
                <>
                  <Pin className="h-4 w-4 text-muted-foreground" />
                  Bỏ ghim
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                  Ghim tin nhắn
                </>
              )}
            </button>
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
