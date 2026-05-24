import React from 'react';
import type { User } from '../../types/friend';
import { ShieldOff } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../lib/axios';

interface BlockedUserCardProps {
  user: User;
}

export const BlockedUserCard: React.FC<BlockedUserCardProps> = ({ user }) => {
  const queryClient = useQueryClient();

  const { mutate: unblockUser, isPending } = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.post(`/friends/unblock`, { userId });
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  return (
    <div className="card p-4 flex items-center gap-4">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}&backgroundColor=94a3b8&fontColor=ffffff`}
          alt={user.name}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100 grayscale opacity-60"
        />
        <span className="absolute -bottom-1 -right-1 bg-rose-100 text-rose-600 rounded-full p-0.5">
          <ShieldOff size={12} />
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-600">{user.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">Đã bị chặn</p>
      </div>

      {/* Action */}
      <button
        onClick={() => unblockUser(user.id)}
        disabled={isPending}
        className="btn-ghost !py-2"
      >
        <ShieldOff size={14} />
        Bỏ chặn
      </button>
    </div>
  );
};
