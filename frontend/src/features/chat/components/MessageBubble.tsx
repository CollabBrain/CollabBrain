import { cn } from '../../../lib/utils';
import type { Message, ChatUser } from '../../../types/chat.types';
import { CheckCheck, Check, FileText, Download } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  sender?: ChatUser | null;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

const formatTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const Avatar = ({ user }: { user: ChatUser }) => {
  const initials = (user.name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name || 'User'}
      className="h-7 w-7 rounded-full object-cover shrink-0"
    />
  ) : (
    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-[10px] shrink-0">
      {initials}
    </div>
  );
};

const MessageBubble = ({
  message,
  isMine,
  sender,
  showAvatar = true,
  isLastInGroup = true,
}: MessageBubbleProps) => {
  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        'flex items-end gap-2 group',
        isMine ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar — chỉ hiện ở tin cuối nhóm, và chỉ khi không phải mình */}
      <div className="w-7 shrink-0">
        {!isMine && showAvatar && isLastInGroup && sender ? (
          <Avatar user={sender} />
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[70%] flex flex-col',
          isMine ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm flex flex-col gap-1',
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
            // Adjust border radius for grouped messages
            !isLastInGroup && isMine && 'rounded-br-2xl',
            !isLastInGroup && !isMine && 'rounded-bl-2xl'
          )}
        >
          {/* Reply Preview */}
          {message.replyTo && (
            <div
              className={cn(
                'text-xs pl-2.5 py-1 mb-1 border-l-2 cursor-pointer opacity-90 transition-opacity hover:opacity-100',
                isMine ? 'border-primary-foreground/40 bg-primary-foreground/10' : 'border-primary bg-primary/5',
                'rounded-r-md'
              )}
              onClick={() => {
                const el = document.getElementById(`msg-${message.replyToId}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('animate-pulse');
                  setTimeout(() => el.classList.remove('animate-pulse'), 2000);
                }
              }}
            >
              <div className="font-semibold mb-0.5 truncate">
                {message.replyTo.sender?.name || 'User'}
              </div>
              <div className="truncate max-w-[200px]">
                {message.replyTo.isRecalled
                  ? 'Tin nhắn đã được thu hồi'
                  : message.replyTo.content || '[File/Ảnh]'}
              </div>
            </div>
          )}

          {/* Message Content */}
          {message.isRecalled ? (
            <span className="italic opacity-80">{message.content}</span>
          ) : message.type === 'image' || (message.type as string) === 'IMAGE' ? (
            <div className="mt-1 mb-1">
              <img
                src={message.content}
                alt="Image"
                className="max-w-full rounded-lg max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.content, '_blank')}
                loading="lazy"
              />
            </div>
          ) : message.type === 'file' || (message.type as string) === 'FILE' ? (
            <a
              href={message.content}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl mt-1 w-full sm:w-[280px] max-w-full hover:bg-black/5 transition-colors',
                isMine ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-background text-foreground border border-border'
              )}
            >
              <div className={cn(
                'h-10 w-10 shrink-0 rounded-lg flex items-center justify-center',
                isMine ? 'bg-primary-foreground/20' : 'bg-primary/10'
              )}>
                <FileText className={cn("h-5 w-5", isMine ? "text-primary-foreground" : "text-primary")} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="font-medium text-sm truncate">
                  {message.content.split('/').pop()?.split('?')[0] || 'Tài liệu đính kèm'}
                </span>
                <span className="text-xs opacity-70">Nhấn để tải xuống</span>
              </div>
              <Download className="h-4 w-4 shrink-0 opacity-70" />
            </a>
          ) : (
            <span>{message.content}</span>
          )}
        </div>

        {/* Timestamp + read status — hiện khi hover hoặc tin cuối nhóm */}
        {isLastInGroup && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
              isMine ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            {isMine && (
              <span className="text-[10px]">
                {message.isRead ? (
                  <CheckCheck className="h-3 w-3 text-primary" />
                ) : (
                  <Check className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ——— Typing Indicator ———
export const TypingIndicator = ({ senderName }: { senderName?: string }) => (
  <div className="flex items-end gap-2">
    <div className="w-7 shrink-0" />
    <div className="flex flex-col items-start">
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted shadow-sm flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
      </div>
      {senderName && (
        <span className="text-[10px] text-muted-foreground mt-1 ml-1">{senderName} đang nhập...</span>
      )}
    </div>
  </div>
);

// ——— Date Divider ———
export const DateDivider = ({ dateStr }: { dateStr: string }) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86_400_000
  );

  let label: string;
  if (isNaN(diffDays)) {
    label = 'Ngày khác';
  } else if (diffDays === 0) {
    label = 'Hôm nay';
  } else if (diffDays === 1) {
    label = 'Hôm qua';
  } else {
    label = date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

export default MessageBubble;
