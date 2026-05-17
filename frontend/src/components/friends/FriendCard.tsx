import React from 'react';
import type { User } from '../../types/friend';
import { MessageCircle, UserX } from 'lucide-react';
import { useUnfriend } from '../../hooks/useFriends';

interface FriendCardProps {
  friend: User;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend }) => {
  const { mutate: unfriend, isPending } = useUnfriend();

  const handleUnfriend = () => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${friend.name}?`)) {
      unfriend(friend.id);
    }
  };

  const statusColor = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    offline: 'bg-slate-300',
  }[friend.status || 'offline'];

  return (
    <div className="card p-4 flex items-center gap-4 group">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={friend.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${friend.name}&backgroundColor=4f46e5&fontColor=ffffff`}
          alt={friend.name}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100"
        />
        <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor}`}></span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate">{friend.name}</p>
        <p className="text-xs text-slate-400 mt-0.5 capitalize">{friend.status || 'Offline'}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button className="btn-secondary !px-3 !py-2">
          <MessageCircle size={15} />
          <span className="hidden sm:inline">Nhắn tin</span>
        </button>
        <button
          onClick={handleUnfriend}
          disabled={isPending}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
          title="Hủy kết bạn"
        >
          <UserX size={16} />
        </button>
      </div>
    </div>
  );
};
