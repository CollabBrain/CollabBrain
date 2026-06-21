import React from 'react';
import type { FriendSuggestion } from '../../types/friend';
import { UserPlus, Users } from 'lucide-react';
import { useSendRequest } from '../../hooks/useFriends';

interface SuggestionCardProps {
  suggestion: FriendSuggestion;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  const { mutate: sendRequest, isPending } = useSendRequest();
  const { user, mutualFriendsCount } = suggestion;

  return (
    <div className="card p-5 flex flex-col items-center text-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
      {/* Avatar */}
      <div className="relative">
        <img
          src={user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}&backgroundColor=4f46e5&fontColor=ffffff`}
          alt={user.name}
          className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-50"
        />
        {user.status === 'online' && (
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></span>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="font-semibold text-slate-800">{user.name}</p>
        {mutualFriendsCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Users size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">{mutualFriendsCount} bạn chung</span>
          </div>
        )}
      </div>

      {/* Action */}
      <button
        onClick={() => sendRequest(user.id)}
        disabled={isPending}
        className="btn-primary w-full justify-center !py-2.5"
      >
        <UserPlus size={15} />
        {isPending ? 'Đang gửi...' : 'Thêm bạn bè'}
      </button>
    </div>
  );
};
