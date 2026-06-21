import React from 'react';
import type { FriendRequest } from '../../types/friend';
import { Check, X, Clock } from 'lucide-react';
import { useAcceptRequest, useRejectRequest } from '../../hooks/useFriends';

interface RequestCardProps {
  request: FriendRequest;
  type: 'received' | 'sent';
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, type }) => {
  const { mutate: accept, isPending: isAccepting } = useAcceptRequest();
  const { mutate: reject, isPending: isRejecting } = useRejectRequest();
  const { mutate: cancel, isPending: isCanceling } = useRejectRequest();

  const isPending = isAccepting || isRejecting || isCanceling;
  const targetUser = type === 'received' ? request.sender : request.receiver;

  const timeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="card p-4 flex items-start gap-4">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={targetUser.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${targetUser.name}&backgroundColor=4f46e5&fontColor=ffffff`}
          alt={targetUser.name}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800">{targetUser.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock size={12} className="text-slate-400" />
          <span className="text-xs text-slate-400">{timeAgo(request.createdAt)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {type === 'received' ? (
            <>
              <button
                onClick={() => accept(request.id)}
                disabled={isPending}
                className="btn-primary !py-2"
              >
                <Check size={14} />
                Chấp nhận
              </button>
              <button
                onClick={() => reject(request.id)}
                disabled={isPending}
                className="btn-ghost !py-2"
              >
                <X size={14} />
                Từ chối
              </button>
            </>
          ) : (
            <button
              onClick={() => cancel(request.id)}
              disabled={isPending}
              className="btn-danger !py-2"
            >
              <X size={14} />
              Hủy lời mời
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
