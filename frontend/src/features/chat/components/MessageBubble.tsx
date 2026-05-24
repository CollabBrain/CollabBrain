import { cn } from '../../../lib/utils';
import type { Message, ChatUser } from '../../../types/chat.types';
import { CheckCheck, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  sender?: ChatUser | null;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const Avatar = ({ user }: { user: ChatUser }) => {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name}
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
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm',
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
            // Adjust border radius for grouped messages
            !isLastInGroup && isMine && 'rounded-br-2xl',
            !isLastInGroup && !isMine && 'rounded-bl-2xl'
          )}
        >
          {message.content}
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
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86_400_000
  );

  let label: string;
  if (diffDays === 0) label = 'Hôm nay';
  else if (diffDays === 1) label = 'Hôm qua';
  else label = new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

export default MessageBubble;
