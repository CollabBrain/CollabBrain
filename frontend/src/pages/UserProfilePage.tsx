import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';
import { UserPlus, MessageCircle, Ban, ArrowLeft } from 'lucide-react';
import { useSendRequest, useBlockUser } from '../hooks/useFriends';
import type { User } from '../types/friend';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: sendRequest, isPending: isSendingRequest } = useSendRequest();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: async (): Promise<User> => {
      const response = await axiosInstance.get(`/users/${id}`);
      return (response as any).data?.data || (response as any).data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <p className="font-semibold text-slate-700">Không tìm thấy người dùng</p>
        <p className="text-sm text-slate-400 mt-1">Trang cá nhân này không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mx-auto mt-4">
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại
      </button>

      {/* Profile Card */}
      <div className="card overflow-hidden">
        {/* Cover */}
        <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Avatar + Actions */}
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="absolute -top-14 left-6 border-4 border-white rounded-2xl shadow-lg">
            <img
              src={userProfile.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${userProfile.name}&backgroundColor=4f46e5&fontColor=ffffff`}
              alt={userProfile.name}
              className="w-24 h-24 rounded-xl object-cover"
            />
            {userProfile.status === 'online' && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            )}
          </div>

          {/* Header row */}
          <div className="pt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{userProfile.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5 capitalize flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${userProfile.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                {userProfile.status || 'offline'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => sendRequest(userProfile.id)}
                disabled={isSendingRequest}
                className="btn-primary"
              >
                <UserPlus size={15} />
                Kết bạn
              </button>
              <button className="btn-secondary">
                <MessageCircle size={15} />
                Nhắn tin
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Bạn có chắc muốn chặn ${userProfile.name}?`)) {
                    blockUser(userProfile.id);
                  }
                }}
                disabled={isBlocking}
                className="btn-danger !px-3"
                title="Chặn người dùng"
              >
                <Ban size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
