import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  Send, Paperclip, Pin, CornerUpLeft, MoreVertical, X, RotateCcw, Trash2,
  ChevronDown, ChevronUp, FileText, Image as ImageIcon, File as FileIcon,
  Loader2, MessageSquare, Download, Ban, Sparkles
} from 'lucide-react';
import { useGroupChat } from '../../../hooks/useGroupChat';
import type { GroupMessage, MentionedUser } from '../../../types/chat.types';
import type { MemberData } from '../services/group.service';
import { formatFileSize } from '../services/groupChat.service';
import { EmojiButton } from '../../../components/common/EmojiPicker';

// ——— Types ———
interface GroupChatTabProps {
  groupId: string;
  groupName: string;
  myUserId: string;
  myRole: 'OWNER' | 'MEMBER' | 'VIEWER';
  members: MemberData[];
}

// ——— Helpers ———
const getInitials = (name: string) =>
  name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getFileIcon = (mimeType?: string, content?: string) => {
  if (!mimeType && !content) return <FileIcon className="w-5 h-5" />;
  const m = mimeType || '';
  if (m.startsWith('image/') || (content || '').match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i))
    return <ImageIcon className="w-5 h-5" />;
  if (m.includes('pdf') || (content || '').match(/\.pdf(\?|$)/i))
    return <FileText className="w-5 h-5 text-rose-500" />;
  return <FileIcon className="w-5 h-5 text-indigo-500" />;
};

// ——— Sub-components ———

/** Hiển thị avatar tròn */
const Avatar = ({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}>
      {avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" /> : getInitials(name)}
    </div>
  );
};

/** Thẻ file đính kèm (giống Messenger) */
const FileCard = ({ url, content }: { url: string; content: string }) => {
  if (!url) return null;
  let fileName = 'file';
  try {
    const urlObj = new URL(url);
    const filenameParam = urlObj.searchParams.get('filename');
    if (filenameParam) {
      fileName = decodeURIComponent(filenameParam);
    } else {
      fileName = url.split('/').pop()?.split('?')[0] || 'file';
    }
  } catch (e) {
    fileName = url.split('/').pop()?.split('?')[0] || 'file';
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-white/80 border border-slate-200 rounded-xl hover:bg-indigo-50 transition-colors max-w-[240px] mt-1 group/card"
    >
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        {getFileIcon(undefined, content)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 truncate">{fileName}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Nhấn để tải / xem</p>
      </div>
      <Download className="w-4 h-4 text-slate-300 group-hover/card:text-indigo-500 shrink-0" />
    </a>
  );
};

/** Preview tin nhắn đang reply */
const ReplyBar = ({ message, onCancel }: { message: GroupMessage; onCancel: () => void }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-t border-indigo-100">
    <CornerUpLeft className="w-4 h-4 text-indigo-400 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-indigo-600">{message.sender?.name}</p>
      <p className="text-xs text-slate-500 truncate">
        {message.isRecalled ? '🚫 Tin nhắn đã được thu hồi' : message.content}
      </p>
    </div>
    <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer rounded">
      <X className="w-4 h-4" />
    </button>
  </div>
);

/** Mention highlight trong nội dung tin nhắn */
const renderContent = (content: string, mentions?: GroupMessage['mentions'], isMe?: boolean) => {
  if (!content) return '';

  // Regex tìm các chuỗi bắt đầu bằng @ theo sau là chữ tiếng Việt/Anh, số, khoảng trắng (tối đa 3 từ)
  const mentionRegex = /@([A-Za-z0-9_À-ỹ]+(?:\s+[A-Za-z0-9_À-ỹ]+){0,2})/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  mentionRegex.lastIndex = 0;
  let key = 0;

  while ((match = mentionRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];
    const name = match[1];

    // Add text trước mention
    if (matchIndex > lastIndex) {
      parts.push(<span key={key++}>{content.substring(lastIndex, matchIndex)}</span>);
    }

    // Kiểm tra nếu là AI Assistant hoặc AI thì hiển thị dạng chữ thường bình thường, không bọc trong pill xanh nổi bật
    const isAIBot = name.toLowerCase() === 'ai assistant' || name.toLowerCase() === 'ai';

    if (isAIBot) {
      parts.push(<span key={key++}>{matchText}</span>);
    } else {
      // Add mention khác (thành viên thường) được định dạng đậm màu xanh nước biển / trắng tùy người gửi
      parts.push(
        <span
          key={key++}
          className={`font-bold px-1 py-0.5 rounded-md ${
            isMe 
              ? 'text-white bg-white/20' 
              : 'text-blue-600 bg-blue-50 border border-blue-100 font-bold'
          }`}
        >
          {matchText}
        </span>
      );
    }

    lastIndex = mentionRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? <>{parts}</> : <>{content}</>;
};

/** Một bong bóng tin nhắn */
const MessageBubble = ({
  message,
  isMe,
  isOwner,
  prevSenderId,
  onReply,
  onPin,
  onRecall,
  onDelete,
}: {
  message: GroupMessage;
  isMe: boolean;
  isOwner: boolean;
  prevSenderId?: string;
  onReply: (msg: GroupMessage) => void;
  onPin: (msgId: string) => void;
  onRecall: (msgId: string) => void;
  onDelete: (msgId: string) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  if (!message) return null;
  
  const isConsecutive = prevSenderId === message.senderId;
  const isFile = message.type === 'FILE' || message.type === 'file';
  const isImage = message.type === 'IMAGE' || message.type === 'image';

  return (
    <div id={`msg-${message.id}`} className={`flex gap-2 group/bubble ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? 'mt-0.5' : 'mt-4'}`}>
      {/* Avatar — chỉ hiển thị nếu không phải consecutive và không phải tin của mình */}
      {!isMe && (
        <div className="w-8 shrink-0 self-end">
          {!isConsecutive && <Avatar name={message.sender?.name || '?'} avatarUrl={message.sender?.avatarUrl} />}
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Tên người gửi (không consecutive, không phải mình) */}
        {!isConsecutive && !isMe && (
          <p className="text-xs font-semibold text-slate-500 mb-1 ml-1">{message.sender?.name}</p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`mb-1 px-3 py-1.5 rounded-xl border-l-4 bg-slate-50 border-indigo-300 max-w-full ${isMe ? 'self-end' : 'self-start'}`}>
            <p className="text-[10px] font-bold text-indigo-500">{message.replyTo.sender?.name || 'Ai đó'}</p>
            <p className="text-xs text-slate-400 truncate">
              {message.replyTo.isRecalled ? <span className="inline-flex items-center gap-1 align-text-bottom"><Ban className="w-3 h-3" /> Tin nhắn đã được thu hồi</span> : message.replyTo.content}
            </p>
          </div>
        )}

        {/* Tin nhắn chính */}
        <div className="flex items-end gap-1 max-w-full min-w-0">
          {/* Action menu button (hover) */}
          {!isMe && (
            <div className="relative self-center opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer rounded">
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                  <div className="absolute left-0 bottom-8 z-30 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <button onClick={() => { onReply(message); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 border-0 bg-transparent cursor-pointer">
                      <CornerUpLeft className="w-3.5 h-3.5" /> Reply
                    </button>
                    {isOwner && !message.isRecalled && (
                      <button onClick={() => { onPin(message.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 border-0 bg-transparent cursor-pointer">
                        <Pin className="w-3.5 h-3.5" /> {message.isPinned ? 'Bỏ ghim' : 'Ghim'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bubble body */}
          {message.isRecalled ? (
            <div className={`relative px-4 py-2.5 text-[15px] max-w-full min-w-0 ${isMe
              ? 'bg-[#0084FF] text-white rounded-[22px] rounded-br-[4px]'
              : 'bg-[#E4E6EB] text-black rounded-[22px] rounded-bl-[4px]'
            } opacity-60 italic`}>
              <span className="text-sm opacity-80 inline-flex items-center gap-1.5"><Ban className="w-4 h-4" /> Tin nhắn đã được thu hồi</span>
              <p className="text-[10px] mt-1 flex items-center justify-end gap-1 text-indigo-100">
                {formatTime(message.createdAt)}
              </p>
            </div>
          ) : isFile ? (
            <div className={`max-w-full min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'} select-none`}>
              <FileCard url={message.content} content={message.content} />
              <p className="text-[10px] mt-1 text-slate-400 flex items-center gap-1">
                {formatTime(message.createdAt)}
                {message.isPinned && <Pin className="w-3 h-3 text-slate-400" />}
              </p>
            </div>
          ) : (
            <div className={`relative px-4 py-2.5 text-[15px] max-w-full min-w-0 ${isMe
              ? 'bg-[#0084FF] text-white rounded-[22px] rounded-br-[4px]'
              : 'bg-[#E4E6EB] text-black rounded-[22px] rounded-bl-[4px]'
            }`}>
              {isImage ? (
                <img src={message.content} alt="Ảnh" className="max-w-[200px] max-h-[200px] rounded-xl object-cover cursor-pointer" onClick={() => window.open(message.content, '_blank')} />
              ) : (
                <p className="leading-snug whitespace-pre-wrap break-words break-all">
                  {renderContent(message.content, message.mentions, isMe)}
                </p>
              )}
              {/* Timestamp */}
              <p className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                {formatTime(message.createdAt)}
                {message.isPinned && <Pin className="w-3 h-3" />}
              </p>
            </div>
          )}

          {/* Action menu button (hover, bên phải cho tin của mình) */}
          {isMe && !message.isRecalled && (
            <div className="relative self-center opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer rounded">
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 bottom-8 z-30 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <button onClick={() => { onReply(message); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 border-0 bg-transparent cursor-pointer">
                      <CornerUpLeft className="w-3.5 h-3.5" /> Reply
                    </button>
                    {isOwner && (
                      <button onClick={() => { onPin(message.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 border-0 bg-transparent cursor-pointer">
                        <Pin className="w-3.5 h-3.5" /> {message.isPinned ? 'Bỏ ghim' : 'Ghim'}
                      </button>
                    )}
                    <button onClick={() => { onRecall(message.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 border-0 bg-transparent cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" /> Thu hồi
                    </button>
                    <button onClick={() => { onDelete(message.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 border-0 bg-transparent cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Xóa (chỉ mình)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Thanh hiển thị tin nhắn đã ghim */
const PinnedMessagesBar = ({
  pinnedMessages,
  onUnpin,
  isOwner
}: {
  pinnedMessages: GroupMessage[];
  onUnpin: (msgId: string) => void;
  isOwner: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-pulse');
      setTimeout(() => el.classList.remove('animate-pulse'), 2000);
    }
  };

  if (pinnedMessages.length === 0) return null;

  const latest = pinnedMessages[0];
  return (
    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
      <div className="flex items-center gap-2">
        <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <div 
          className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => handleScrollToMessage(latest.id)}
        >
          <p className="text-xs font-bold text-amber-700">{pinnedMessages.length} tin nhắn đã ghim</p>
          <p className="text-xs text-amber-600 truncate mt-0.5">
            {latest.sender?.name}: {latest.isRecalled ? <span className="inline-flex items-center gap-1 align-text-bottom"><Ban className="w-3 h-3" /> Tin nhắn đã được thu hồi</span> : latest.content || '[File/Ảnh]'}
          </p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1 text-amber-500 border-0 bg-transparent cursor-pointer rounded">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="flex items-start gap-2 p-2 bg-white rounded-xl border border-amber-100">
              <Avatar name={msg.sender?.name || '?'} avatarUrl={msg.sender?.avatarUrl} />
              <div 
                className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleScrollToMessage(msg.id)}
              >
                <p className="text-xs font-bold text-slate-700">{msg.sender?.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {msg.isRecalled ? <span className="inline-flex items-center gap-1 align-text-bottom"><Ban className="w-3 h-3" /> Thu hồi</span> : msg.content || '[File/Ảnh]'}
                </p>
              </div>
              {isOwner && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onUnpin(msg.id); }} 
                  className="p-1.5 bg-amber-100 text-amber-600 hover:bg-rose-100 hover:text-rose-500 border border-amber-200 cursor-pointer rounded-md shrink-0 flex items-center justify-center transition-colors" 
                  title="Bỏ ghim"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Typing indicator */
const TypingIndicator = ({ userNames }: { userNames: string[] }) => {
  if (userNames.length === 0) return null;
  const text = userNames.length === 1
    ? userNames[0].startsWith("AI Assistant")
      ? `${userNames[0]}...`
      : `${userNames[0]} đang nhập...`
    : `${userNames.join(', ')} đang nhập...`;
  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-xs text-slate-400 italic">{text}</p>
    </div>
  );
};

// ================================================================
// ——— Main Component ———
// ================================================================

const GroupChatTab = ({ groupId, groupName, myUserId, myRole, members }: GroupChatTabProps) => {
  const canSend = myRole !== 'VIEWER';
  const isOwner = myRole === 'OWNER';

  const {
    messages,
    pinnedMessages,
    typingUserNames,
    hasMore,
    isLoading,
    sendMessage,
    sendTyping,
    pinMessage,
    recallMessage,
    deleteMessage,
    uploadFile,
    loadMoreMessages,
  } = useGroupChat({ groupId, myUserId, groupName, isVisible: true });

  // ——— Input state ———
  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Scroll to bottom khi có tin mới (chỉ nếu đang gần cuối)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;
    
    // Nếu là lần đầu load trang -> luôn scroll xuống đáy
    if (isInitialLoadRef.current) {
      scrollToBottom('instant');
      // Set timeout nhỏ để đảm bảo render DOM xong trước khi đánh dấu là đã load
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
      return;
    }

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
    if (isNearBottom) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Giữ scroll position khi prepend (load thêm trang cũ)
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoading) return;
    const delta = container.scrollHeight - prevScrollHeightRef.current;
    // Chỉ cộng delta nếu đang có tin nhắn (không phải load trang đầu tiên) và delta lớn hơn 0
    if (delta > 0 && prevScrollHeightRef.current > 0) {
      container.scrollTop += delta;
      // Reset after adjusting so we don't apply it again until next load more
      prevScrollHeightRef.current = container.scrollHeight;
    }
  }, [messages.length, isLoading]);

  // ——— Infinite scroll (load more) ———
  const handleLoadMoreClick = useCallback(() => {
    if (messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
    loadMoreMessages();
  }, [loadMoreMessages]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Hiển thị nút scroll to bottom nếu chưa cuộn tới đáy
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    setShowScrollBtn(!isNearBottom);

    if (!hasMore || isLoading) return;
    if (container.scrollTop < 100) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages();
    }
  }, [hasMore, isLoading, loadMoreMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ——— Mention detection ———
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Tự động phát hiện nếu có tiền tố @AI Assistant hoặc @AI ở đầu ô nhập liệu để bật/tắt viền phát sáng AI Mode
    const hasAIPrefix = /^\s*@AI Assistant/gi.test(val) || /^\s*@AI/gi.test(val);
    if (hasAIPrefix && !isAiMode) {
      setIsAiMode(true);
    } else if (!hasAIPrefix && isAiMode) {
      setIsAiMode(false);
    }

    // Detect @mention
    const atIdx = val.lastIndexOf('@');
    if (atIdx >= 0) {
      const query = val.slice(atIdx + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query);
      } else {
        setMentionQuery(null);
      }
    } else {
      setMentionQuery(null);
    }

    // Typing indicator
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  const handleSelectMention = (member: MentionedUser) => {
    const atIdx = inputValue.lastIndexOf('@');
    const before = inputValue.slice(0, atIdx);
    setInputValue(before + `@${member.name} `);
    setMentionIds(prev => [...prev, member.id]);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  // ——— Send ———
  const handleSend = async () => {
    if (!canSend) return;
    const text = inputValue.trim();
    if (!text && !attachedFile) return;

    let uploadFailed = false;

    // 1. Nếu có file đính kèm, thực hiện upload trước
    if (attachedFile) {
      setUploadingFile(true);
      setUploadProgress(0);
      try {
        const result = await uploadFile(attachedFile, setUploadProgress);
        if (!result) {
          uploadFailed = true;
        }
      } catch (err) {
        console.error("Lỗi upload file trong group chat:", err);
        uploadFailed = true;
      } finally {
        setUploadingFile(false);
        setUploadProgress(0);
        setAttachedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }

    if (uploadFailed) return;

    // 2. Nếu có tin nhắn văn bản, gửi nó đi sau đó (ghi riêng ra)
    if (text) {
      const finalMentionIds = Array.from(new Set(
        isAiMode 
          ? [...mentionIds, 'ai-assistant-bot-uuid']
          : mentionIds
      ));

      // Đảm bảo tin gửi đi có chứa prefix nếu đang ở chế độ AI
      let finalText = text;
      if (isAiMode && !text.toLowerCase().startsWith('@ai assistant') && !text.toLowerCase().startsWith('@ai')) {
        finalText = `@AI Assistant ${text}`;
      }

      sendMessage(finalText, {
        replyToId: replyTo?.id,
        mentionIds: finalMentionIds.length > 0 ? finalMentionIds : undefined
      });
    }

    setInputValue('');
    setReplyTo(null);
    setMentionIds([]);
    setIsAiMode(false);
    sendTyping(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ——— File upload ———
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      alert('File không được vượt quá 30MB');
      return;
    }
    setAttachedFile(file);
  };

  const renderAttachedFilePreview = () => {
    if (!attachedFile) return null;
    const name = attachedFile.name.toLowerCase();
    const isDocx = name.endsWith('.docx') || name.endsWith('.doc');
    const isXlsx = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isPptx = name.endsWith('.pptx') || name.endsWith('.ppt');
    const isImage = attachedFile.type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    let iconBg = 'bg-rose-500'; // red for PDF
    let typeLabel = 'PDF';
    let IconComponent = FileText;

    if (isDocx) {
      iconBg = 'bg-blue-500'; // blue for Word
      typeLabel = 'DOCX';
      IconComponent = FileIcon;
    } else if (isXlsx) {
      iconBg = 'bg-emerald-500'; // green for Excel
      typeLabel = 'XLSX';
      IconComponent = FileIcon;
    } else if (isPptx) {
      iconBg = 'bg-orange-500'; // orange for PowerPoint
      typeLabel = 'PPTX';
      IconComponent = FileIcon;
    } else if (isImage) {
      iconBg = 'bg-purple-500'; // purple for Image
      typeLabel = 'IMAGE';
      IconComponent = ImageIcon;
    }

    return (
      <div className="mb-3 p-3 bg-slate-50/70 border border-slate-200/60 rounded-2xl flex items-center justify-between select-none relative transition-all duration-200 max-w-sm w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white`}>
            {uploadingFile ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <IconComponent className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">{attachedFile.name}</h4>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{typeLabel}</span>
          </div>
        </div>

        {!uploadingFile && (
          <button
            type="button"
            onClick={() => {
              setAttachedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer outline-none flex items-center justify-center shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  // ——— Emoji insert ———
  const handleEmojiSelect = useCallback((emoji: string) => {
    const ta = inputRef.current;
    if (!ta) {
      setInputValue(prev => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const newValue = ta.value.slice(0, start) + emoji + ta.value.slice(end);
    setInputValue(newValue);
    requestAnimationFrame(() => {
      ta.selectionStart = start + emoji.length;
      ta.selectionEnd = start + emoji.length;
      ta.focus();
    });
  }, []);

  // ——— Mention dropdown members ———
  const AI_BOT_MEMBER: MemberData = {
    id: 'ai-assistant-bot-member-id',
    userId: 'ai-assistant-bot-uuid',
    role: 'MEMBER' as any,
    joinedAt: new Date().toISOString(),
    user: {
      id: 'ai-assistant-bot-uuid',
      name: 'AI Assistant',
      email: 'ai.assistant@collabbrain.com',
    }
  };

  const filteredMembers = mentionQuery !== null
    ? [
        AI_BOT_MEMBER,
        ...members.filter(m => m.userId !== myUserId)
      ]
        .filter(m => (m.user?.name || '').toLowerCase().includes(mentionQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 relative">

      {/* Pinned bar */}
      <PinnedMessagesBar
        pinnedMessages={pinnedMessages}
        onUnpin={pinMessage}
        isOwner={isOwner}
      />

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-0.5"
        style={{ minHeight: 0 }}
      >
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}

        {hasMore && messages.length > 0 && (
          <div className="text-center py-2">
            <button onClick={handleLoadMoreClick} disabled={isLoading} className="text-xs text-indigo-500 hover:underline border-0 bg-transparent cursor-pointer">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Tải tin nhắn cũ hơn'}
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-indigo-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Chưa có tin nhắn nào</p>
            <p className="text-xs text-slate-300">Hãy là người đầu tiên gửi tin nhắn!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.senderId === myUserId}
            isOwner={isOwner}
            prevSenderId={messages[i - 1]?.senderId}
            onReply={setReplyTo}
            onPin={pinMessage}
            onRecall={recallMessage}
            onDelete={deleteMessage}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-8 h-9 w-9 rounded-full bg-indigo-600 border border-indigo-700 shadow-md flex items-center justify-center hover:bg-indigo-700 text-white transition-all hover:scale-105 z-10 cursor-pointer"
          title="Cuộn xuống dưới"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Typing indicator */}
      <TypingIndicator userNames={typingUserNames} />

      {/* File upload progress */}
      {uploadingFile && (
        <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-indigo-700">Đang tải file lên...</span>
                <span className="text-indigo-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply bar */}
      {replyTo && <ReplyBar message={replyTo} onCancel={() => setReplyTo(null)} />}

      {/* Mention dropdown */}
      {filteredMembers.length > 0 && (
        <div className="mx-4 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
          {filteredMembers.map(m => (
            <button
              key={m.userId}
              onClick={() => handleSelectMention({ id: m.userId, name: m.user?.name || '', avatarUrl: m.user?.avatarUrl || null })}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 border-0 bg-transparent cursor-pointer text-left"
            >
              <Avatar name={m.user?.name || '?'} avatarUrl={m.user?.avatarUrl} />
              <div>
                <p className="text-sm font-semibold text-slate-700">{m.user?.name}</p>
                <p className="text-xs text-slate-400">{m.user?.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-3 pb-4 pt-2 bg-white">
        {isAiMode && (
          <div className="mb-2 p-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
              <p className="text-xs font-semibold text-indigo-700 truncate">
                Chế độ hỏi AI: Câu hỏi sẽ được gửi trực tiếp tới AI Assistant để phân tích tài liệu nhóm.
              </p>
            </div>
            <button
              onClick={() => {
                setIsAiMode(false);
                setInputValue(prev => prev.replace(/^@AI Assistant\s*/gi, '').replace(/^@AI\s*/gi, '').trim());
              }}
              className="p-1 rounded-full hover:bg-indigo-100/50 text-indigo-400 hover:text-indigo-600 transition-colors border-0 bg-transparent cursor-pointer outline-none flex items-center justify-center shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {renderAttachedFilePreview()}
        {canSend ? (
          <div className="flex items-end gap-2">
            {/* File attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="p-2 mb-1 text-[#0084FF] hover:bg-slate-100 rounded-full border-0 bg-transparent cursor-pointer transition-colors shrink-0 disabled:opacity-50"
              title="Đính kèm file"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
              onChange={handleFileChange}
            />

            {/* AI Sparkle button */}
            <button
              onClick={() => {
                if (!isAiMode) {
                  // Bật AI Mode: đưa @AI Assistant vào input
                  setInputValue(prev => {
                    const clean = prev.replace(/^@AI Assistant\s*/gi, '').replace(/^@AI\s*/gi, '').trim();
                    return `@AI Assistant ${clean}`.trim() + ' ';
                  });
                  setIsAiMode(true);
                } else {
                  // Tắt AI Mode: xóa @AI Assistant khỏi input
                  setInputValue(prev => prev.replace(/^@AI Assistant\s*/gi, '').replace(/^@AI\s*/gi, '').trim());
                  setIsAiMode(false);
                }
              }}
              className={`p-2 mb-1 rounded-full border-0 bg-transparent cursor-pointer transition-all duration-200 shrink-0 ${
                isAiMode 
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 shadow-[0_0_8px_rgba(99,102,241,0.2)] scale-110' 
                  : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100'
              }`}
              title="Hỏi AI Assistant"
            >
              <Sparkles className="w-6 h-6" />
            </button>
            {/* Emoji Button */}
            <div className="relative mb-1">
              <EmojiButton onEmojiSelect={handleEmojiSelect} />
            </div>

            {/* Text input */}
            <div className={`flex-1 relative rounded-[20px] flex items-end border transition-all duration-300 ${
              isAiMode 
                ? 'bg-indigo-50/30 border-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.15)]' 
                : 'bg-[#F0F2F5] border-transparent'
            }`}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isAiMode ? "Hỏi AI Assistant về tài liệu nhóm..." : "Aa"}
                rows={1}
                className={`w-full px-4 py-3 text-[15px] bg-transparent border-0 focus:ring-0 outline-none transition-all resize-none block ${
                  isAiMode ? 'font-bold text-indigo-950 placeholder:text-indigo-400' : 'text-slate-800'
                }`}
                style={{ maxHeight: '120px', lineHeight: '1.4' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && !attachedFile) || uploadingFile}
              className="p-2 mb-1 text-[#0084FF] hover:bg-slate-100 rounded-full border-0 bg-transparent cursor-pointer transition-colors shrink-0 disabled:opacity-50"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="text-center py-3 text-sm text-slate-400">
            Bạn chỉ có quyền xem — không thể gửi tin nhắn
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChatTab;
