import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Paperclip, Pin, CornerUpLeft, MoreVertical, X, RotateCcw, Trash2,
  ChevronDown, ChevronUp, FileText, Image as ImageIcon, File as FileIcon,
  Loader2, MessageSquare, Download, Ban
} from 'lucide-react';
import { useGroupChat } from '../../../hooks/useGroupChat';
import type { GroupMessage, MentionedUser } from '../../../types/chat.types';
import type { MemberData } from '../services/group.service';
import { formatFileSize } from '../services/groupChat.service';

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
  const fileName = url.split('/').pop()?.split('?')[0] || 'file';
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
const renderContent = (content: string, mentions?: GroupMessage['mentions']) => {
  if (!content) return '';
  if (!mentions || mentions.length === 0) return content;
  let result = content;
  mentions.forEach(({ user }) => {
    if (!user) return;
    result = result.replace(
      new RegExp(`@${user.name}`, 'g'),
      `__MENTION__${user.name}__MENTION__`
    );
  });
  const parts = result.split(/__MENTION__|__MENTION__/);
  return (
    <>
      {parts.map((part, i) => {
        const isMention = mentions.some(({ user }) => user.name === part);
        return isMention ? (
          <span key={i} className="text-indigo-600 font-semibold bg-indigo-50 px-0.5 rounded">
            @{part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
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
          <div className={`relative px-4 py-2.5 text-[15px] max-w-full min-w-0 ${isMe
            ? 'bg-[#0084FF] text-white rounded-[22px] rounded-br-[4px]'
            : 'bg-[#E4E6EB] text-black rounded-[22px] rounded-bl-[4px]'
          } ${message.isRecalled ? 'opacity-60 italic' : ''}`}>
            {message.isRecalled ? (
              <span className="text-sm opacity-80 inline-flex items-center gap-1.5"><Ban className="w-4 h-4" /> Tin nhắn đã được thu hồi</span>
            ) : isFile ? (
              <FileCard url={message.content} content={message.content} />
            ) : isImage ? (
              <img src={message.content} alt="Ảnh" className="max-w-[200px] max-h-[200px] rounded-xl object-cover cursor-pointer" onClick={() => window.open(message.content, '_blank')} />
            ) : (
              <p className="leading-snug whitespace-pre-wrap break-words break-all">
                {renderContent(message.content, message.mentions)}
              </p>
            )}

            {/* Timestamp */}
            <p className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
              {formatTime(message.createdAt)}
              {message.isPinned && <Pin className="w-3 h-3" />}
            </p>
          </div>

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
    ? `${userNames[0]} đang nhập...`
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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ——— Auto scroll to bottom ———
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ——— Infinite scroll (load more) ———
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || isLoading) return;
    if (container.scrollTop < 100) {
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
  const handleSend = () => {
    if (!inputValue.trim() || !canSend) return;
    sendMessage(inputValue, {
      replyToId: replyTo?.id,
      mentionIds: mentionIds.length > 0 ? mentionIds : undefined
    });
    setInputValue('');
    setReplyTo(null);
    setMentionIds([]);
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
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      alert('File không được vượt quá 30MB');
      return;
    }
    setUploadingFile(true);
    setUploadProgress(0);
    await uploadFile(file, setUploadProgress);
    setUploadingFile(false);
    setUploadProgress(0);
    e.target.value = '';
  };

  // ——— Mention dropdown members ———
  const filteredMembers = mentionQuery !== null
    ? members
        .filter(m => m.userId !== myUserId)
        .filter(m => (m.user?.name || '').toLowerCase().includes(mentionQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200">

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
            <button onClick={loadMoreMessages} disabled={isLoading} className="text-xs text-indigo-500 hover:underline border-0 bg-transparent cursor-pointer">
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

            {/* Text input */}
            <div className="flex-1 relative bg-[#F0F2F5] rounded-[20px] flex items-end">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Aa"
                rows={1}
                className="w-full px-4 py-3 text-[15px] bg-transparent border-0 focus:ring-0 outline-none transition-all resize-none block"
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
              disabled={!inputValue.trim() || uploadingFile}
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
