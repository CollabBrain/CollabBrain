import { useState, useRef, useEffect } from 'react';
import { Search, X, MessageCircle, Loader2 } from 'lucide-react';
import { useSearchUsers, useCreateConversation } from '../hooks/useChat';
import { cn } from '../../../lib/utils';
import type { ChatUser } from '../../../types/chat.types';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Debounce hook inline
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debounced;
}

const UserAvatar = ({ user, size = 'md' }: { user: ChatUser; size?: 'sm' | 'md' }) => {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';

  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name}
      className={cn('rounded-full object-cover ring-2 ring-border shrink-0', sizeClass)}
    />
  ) : (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold shrink-0',
        sizeClass
      )}
    >
      {initials}
    </div>
  );
};

const UserSearchModal = ({ isOpen, onClose }: UserSearchModalProps) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedQuery = useDebounce(inputValue, 400);

  const { data: users = [], isFetching } = useSearchUsers(debouncedQuery);
  const createConv = useCreateConversation();

  const handleSelect = async (user: ChatUser) => {
    try {
      await createConv.mutateAsync({ targetUserId: user.id });
      onClose();
      setInputValue('');
    } catch (err) {
      console.error('[UserSearchModal] createConversation error:', err);
    }
  };

  const handleClose = () => {
    onClose();
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      {/* Modal panel */}
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Tin nhắn mới</h2>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="user-search-input"
              autoFocus
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 placeholder:text-muted-foreground transition-all"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {debouncedQuery.trim().length < 2 && (
            <div className="px-5 py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nhập ít nhất 2 ký tự để tìm kiếm</p>
            </div>
          )}

          {debouncedQuery.trim().length >= 2 && !isFetching && users.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">Không tìm thấy người dùng nào</p>
            </div>
          )}

          {users.map((user) => (
            <button
              key={user.id}
              id={`search-user-${user.id}`}
              onClick={() => handleSelect(user)}
              disabled={createConv.isPending}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/60 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserAvatar user={user} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              {user.isOnline && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Nhấn vào một người dùng để bắt đầu cuộc trò chuyện
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
