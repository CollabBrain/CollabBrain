import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../services/axiosInstance';
import { UserPlus, UserCheck, UserX, Clock, Check, X, MessageCircle, Ban, ArrowLeft, Loader2 } from 'lucide-react';
import { 
  useSendRequest, 
  useBlockUser, 
  useUnfriend, 
  useUnrequest, 
  useAcceptRequest, 
  useRejectRequest 
} from '../hooks/useFriends';
import { useCreateConversation } from '../features/chat/hooks/useChat';
import type { User } from '../types/friend';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { mutate: sendRequest, isPending: isSendingRequest } = useSendRequest();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const { mutate: unrequest, isPending: isUnrequesting } = useUnrequest();
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectRequest();
  
  const createConversationMutation = useCreateConversation();

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: async (): Promise<User> => {
      const response = await axiosInstance.get(`/profile/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });

  const handleStartChat = async () => {
    if (!id) return;
    try {
      await createConversationMutation.mutateAsync({ targetUserId: id });
      navigate('/chat');
    } catch (err) {
      console.error("Lỗi khi mở cuộc trò chuyện:", err);
    }
  };

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
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium mb-4 transition-colors border-0 bg-transparent cursor-pointer"
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
          <div className="absolute -top-14 left-6 border-4 border-white rounded-2xl shadow-lg bg-white overflow-hidden">
            <img
              src={userProfile.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${userProfile.name}&backgroundColor=4f46e5&fontColor=ffffff`}
              alt={userProfile.name}
              className="w-24 h-24 rounded-xl object-cover"
            />
            {userProfile.status === 'online' && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </div>

          {/* Header row */}
          <div className="pt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{userProfile.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5 capitalize flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${userProfile.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                {userProfile.status || 'offline'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Friendship Button State */}
              {userProfile.friendshipStatus === 'ACCEPTED' ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 select-none">
                    <UserCheck size={15} className="text-emerald-500" />
                    Bạn bè
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm(`Bạn có chắc muốn hủy kết bạn với ${userProfile.name}?`)) {
                        unfriend(userProfile.id);
                      }
                    }}
                    disabled={isUnfriending}
                    className="btn-danger flex items-center justify-center p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border-0 cursor-pointer outline-none"
                    title="Hủy kết bạn"
                  >
                    <UserX size={15} />
                  </button>
                </div>
              ) : userProfile.friendshipStatus === 'PENDING' ? (
                userProfile.isSender ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 select-none">
                      <Clock size={15} className="text-amber-500 animate-pulse" />
                      Đã gửi yêu cầu
                    </span>
                    <button
                      onClick={() => unrequest(userProfile.id)}
                      disabled={isUnrequesting}
                      className="btn-ghost !px-3 text-slate-500 hover:text-slate-700 border border-slate-200"
                      title="Hủy yêu cầu kết bạn"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptRequest(userProfile.id)}
                      disabled={isAccepting}
                      className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 flex items-center gap-1"
                    >
                      <Check size={15} />
                      Đồng ý
                    </button>
                    <button
                      onClick={() => rejectRequest(userProfile.id)}
                      disabled={isRejecting}
                      className="btn-danger flex items-center gap-1"
                    >
                      <X size={15} />
                      Từ chối
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={() => sendRequest(userProfile.id)}
                  disabled={isSendingRequest}
                  className="btn-primary"
                >
                  {isSendingRequest ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <UserPlus size={15} />
                  )}
                  Kết bạn
                </button>
              )}

              {/* Message Button */}
              <button 
                onClick={handleStartChat}
                disabled={createConversationMutation.isPending}
                className="btn-secondary flex items-center gap-1"
              >
                {createConversationMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <MessageCircle size={15} />
                )}
                Nhắn tin
              </button>

              {/* Block Button */}
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

          {/* Bio / Description */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-left">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Giới thiệu</h3>
            {userProfile.bio ? (
              <div
                className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic prose max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: userProfile.bio }}
              />
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                Người dùng này chưa viết lời giới thiệu bản thân.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
