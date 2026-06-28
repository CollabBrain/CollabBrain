import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../services/axiosInstance';
import { 
  UserPlus, UserCheck, UserX, Clock, Check, X, MessageCircle, 
  Ban, ArrowLeft, Loader2, Flag, Mail, Calendar, User as UserIcon, Users, Layers, BookOpen
} from 'lucide-react';
import { 
  useSendRequest, 
  useBlockUser, 
  useUnfriend, 
  useUnrequest, 
  useAcceptRequest, 
  useRejectRequest,
  useUnblockUser
} from '../hooks/useFriends';
import { useCreateConversation } from '../features/chat/hooks/useChat';
import type { User } from '../types/friend';

// ——— Cover colors presets ———
const COVER_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-indigo-500',
  'from-rose-500 to-red-600',
  'from-green-500 to-emerald-600',
];

const getCoverColor = (id?: string) => {
  if (!id) return COVER_COLORS[0];
  const code = id.charCodeAt(id.length - 1);
  return COVER_COLORS[isNaN(code) ? 0 : code % COVER_COLORS.length];
};

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { mutate: sendRequest, isPending: isSendingRequest } = useSendRequest();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
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

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [reportReason, setReportReason] = useState('Spam hoặc quảng cáo');
  const [reportDetail, setReportDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmittingReport(true);
    try {
      await axiosInstance.post('/reports', {
        targetUserId: id,
        reason: `${reportReason}. Chi tiết: ${reportDetail.trim()}`,
      });
      setReportSuccess(true);
      setReportDetail('');
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Lỗi khi gửi báo cáo:", err);
      alert("Gửi báo cáo thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

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
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center max-w-md mx-auto shadow-sm space-y-4">
        <p className="font-semibold text-slate-700">Không tìm thấy người dùng</p>
        <p className="text-sm text-slate-400">Trang cá nhân này không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border-0 cursor-pointer">
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    );
  }

  const initials = userProfile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const coverColor = getCoverColor(userProfile.id);

  return (
    <div className="min-h-screen bg-slate-50 font-sans -mt-8 -mx-8 pb-12">
      {/* ——— Cover Banner ——— */}
      <div className={`h-52 md:h-64 relative overflow-hidden bg-gradient-to-br ${coverColor}`}>
        {userProfile.coverUrl ? (
          <img src={userProfile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 md:left-8 flex items-center gap-2 px-3.5 py-2 bg-black/20 hover:bg-black/35 text-white text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
      </div>

      {/* ——— Header Info ——— */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <div className="flex flex-col sm:flex-row gap-4 relative sm:items-start">
            {/* Avatar */}
            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${coverColor} flex items-center justify-center text-white text-4xl font-black shrink-0 border-4 border-white shadow-xl ring-2 ring-white -mt-10 sm:-mt-14 z-10 overflow-hidden`}>
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-3 sm:pt-4 pb-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{userProfile.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Users className="w-4 h-4 text-indigo-500" />
                  {userProfile.friendsCount || 0} bạn bè
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> {userProfile.email}
                </span>
              </div>
              
              {/* Trạng thái tùy chỉnh (status message) */}
              {userProfile.status && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mt-2 text-sm font-semibold text-indigo-600">
                  <span>{userProfile.status}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pt-4 sm:pb-3">
              {/* Friendship Button State */}
              {userProfile.friendshipStatus === 'BLOCKED' ? (
                <button
                  onClick={() => unblockUser(userProfile.id)}
                  disabled={isUnblocking}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer transition-all border-0"
                >
                  {isUnblocking ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                  Bỏ chặn
                </button>
              ) : userProfile.friendshipStatus === 'ACCEPTED' ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 select-none">
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
                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border-0 cursor-pointer outline-none"
                    title="Hủy kết bạn"
                  >
                    <UserX size={15} />
                  </button>
                </div>
              ) : userProfile.friendshipStatus === 'PENDING' ? (
                userProfile.isSender ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-xl border border-amber-200 select-none">
                      <Clock size={15} className="text-amber-500 animate-pulse" />
                      Đã gửi yêu cầu
                    </span>
                    <button
                      onClick={() => unrequest(userProfile.id)}
                      disabled={isUnrequesting}
                      className="px-3.5 py-2 text-sm font-semibold text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all"
                      title="Hủy yêu cầu kết bạn"
                    >
                      Hủy yêu cầu
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptRequest(userProfile.id)}
                      disabled={isAccepting}
                      className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl border-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={15} />
                      Đồng ý
                    </button>
                    <button
                      onClick={() => rejectRequest(userProfile.id)}
                      disabled={isRejecting}
                      className="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border-0 cursor-pointer flex items-center gap-1.5"
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
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-0 cursor-pointer flex items-center gap-1.5"
                >
                  {isSendingRequest ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                  Kết bạn
                </button>
              )}

              {/* Message Button */}
              <button 
                onClick={handleStartChat}
                disabled={createConversationMutation.isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                {createConversationMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                Nhắn tin
              </button>

              {/* Block Button */}
              {userProfile.friendshipStatus !== 'BLOCKED' && (
                <button
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc muốn chặn ${userProfile.name}?`)) {
                      blockUser(userProfile.id);
                    }
                  }}
                  disabled={isBlocking}
                  className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border-0 cursor-pointer"
                  title="Chặn người dùng"
                >
                  <Ban size={15} />
                </button>
              )}

              {/* Report Button */}
              <button
                onClick={() => setIsReportOpen(true)}
                className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl border-0 cursor-pointer"
                title="Báo cáo vi phạm"
              >
                <Flag size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ——— Content Grid ——— */}
      <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Bio */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <UserIcon className="h-4 w-4 text-indigo-500" />
                Giới thiệu bản thân
              </h3>
              {userProfile.bio ? (
                <div className="text-sm text-slate-700 prose max-w-none break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: userProfile.bio }} />
              ) : (
                <div className="text-sm text-slate-400 italic text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Người dùng này chưa viết lời giới thiệu bản thân.
                </div>
              )}
            </div>

            {/* Public Flashcards */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-indigo-500" />
                Thẻ Flashcard công khai ({userProfile.publicDecks?.length || 0})
              </h3>
              {userProfile.publicDecks && userProfile.publicDecks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userProfile.publicDecks.map(deck => (
                    <div 
                      key={deck.id}
                      onClick={() => navigate(`/flashcard/decks/${deck.id}`)}
                      className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 cursor-pointer transition-all duration-200 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm" style={{ backgroundColor: deck.color || '#4F46E5' }}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{deck.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{deck._count?.cards || 0} thẻ</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Chưa có bộ thẻ flashcard công khai nào.
                </div>
              )}
            </div>
            </div>

          {/* Right Column: Sidebar info */}
          <div className="space-y-6">
            {/* Card 1: Thông tin thêm */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Thông tin thêm</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Mail className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{userProfile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Calendar className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tham gia từ</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">
                      {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Nhóm công khai tham gia */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Users className="h-4 h-4 text-indigo-500" />
                Nhóm công khai tham gia ({userProfile.joinedGroups?.length || 0})
              </h3>
              {userProfile.joinedGroups && userProfile.joinedGroups.length > 0 ? (
                <div className="space-y-3">
                  {(showAllGroups ? userProfile.joinedGroups : userProfile.joinedGroups.slice(0, 3)).map(group => (
                    <div 
                      key={group.id}
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="p-3 rounded-xl border border-slate-50 hover:border-indigo-50 hover:bg-slate-50/50 cursor-pointer transition-all duration-200 flex items-center gap-3"
                    >
                      {group.avatarUrl ? (
                        <img src={group.avatarUrl} alt={group.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {group.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{group.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mt-0.5">
                          <span>{group._count?.members || 0} thành viên</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {userProfile.joinedGroups.length > 3 && (
                    <button 
                      type="button"
                      onClick={() => setShowAllGroups(prev => !prev)}
                      className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50/30 rounded-xl transition-all border-0 cursor-pointer"
                    >
                      {showAllGroups ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Chưa tham gia nhóm công khai nào.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
            {reportSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Check size={32} className="animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Báo cáo thành công!</h3>
                  <p className="text-sm text-slate-500">
                    Cảm ơn bạn đã báo cáo. Ban quản trị sẽ xem xét hành vi của người dùng này.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-slate-950">Báo cáo vi phạm</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Lý do vi phạm
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    >
                      <option value="Spam hoặc quảng cáo">Spam hoặc quảng cáo</option>
                      <option value="Xúc phạm, quấy rối hoặc đe dọa">Xúc phạm, quấy rối hoặc đe dọa</option>
                      <option value="Thông tin sai lệch hoặc lừa đảo">Thông tin sai lệch hoặc lừa đảo</option>
                      <option value="Nội dung phản cảm, đồi trụy hoặc bạo lực">Nội dung phản cảm, đồi trụy hoặc bạo lực</option>
                      <option value="Khác">Lý do khác...</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Chi tiết hành vi vi phạm (Tùy chọn)
                    </label>
                    <textarea
                      value={reportDetail}
                      onChange={(e) => setReportDetail(e.target.value)}
                      placeholder="Cung cấp thêm ngữ cảnh hoặc nội dung tin nhắn vi phạm..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 bg-transparent text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold border-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingReport ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi báo cáo'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
