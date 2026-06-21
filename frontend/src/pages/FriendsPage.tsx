import { useState } from 'react';
import { Search, Plus, RotateCw, UserPlus, MessageCircle, ChevronDown, Loader2 } from 'lucide-react';
import { useProfile } from '../features/profile/hooks/useProfile';
import {
  useFriends,
  useFriendRequests,
  useFriendSuggestions,
  useAcceptRequest,
  useRejectRequest,
  useSendRequest,
} from '../hooks/useFriends';
import type { FriendUser, FriendRequestItem, FriendSuggestionItem } from '../hooks/useFriends';
import { useNavigate } from 'react-router-dom';
import { useCreateConversation } from '../features/chat/hooks/useChat';

/**
 * FriendsPage — Trang quản lý bạn bè Studifier (Mockup 5).
 * Giao diện tiếng Việt song song 2 cột:
 * - Cột trái: Danh sách bạn bè nhanh.
 * - Cột phải: Hộp quản lý lời mời kết bạn, gợi ý kết bạn và danh sách tất cả bạn bè dạng lưới.
 * 
 * Tích hợp Backend API:
 * - GET /friends/list → Danh sách bạn bè
 * - GET /friends/requests/receive → Lời mời kết bạn
 * - GET /friends/suggestions → Gợi ý kết bạn
 */
export const FriendsPage = () => {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const navigate = useNavigate();
  const createConversationMutation = useCreateConversation();

  const handleStartChat = async (friendId: string) => {
    try {
      await createConversationMutation.mutateAsync({ targetUserId: friendId });
      navigate('/chat');
    } catch (err) {
      console.error("Lỗi khi mở cuộc trò chuyện:", err);
    }
  };

  // ——— Real API hooks ———
  const { data: friends = [], isLoading: loadingFriends } = useFriends();
  const { data: receivedRequests = [], isLoading: loadingRequests } = useFriendRequests('received');
  const { data: suggestions = [], isLoading: loadingSuggestions } = useFriendSuggestions();

  // ——— Mutations ———
  const acceptMutation = useAcceptRequest();
  const rejectMutation = useRejectRequest();
  const sendRequestMutation = useSendRequest();

  // ——— Handlers ———
  const handleAcceptRequest = (senderId: string) => {
    acceptMutation.mutate(senderId);
  };

  const handleRejectRequest = (senderId: string) => {
    rejectMutation.mutate(senderId);
  };

  const handleSendRequest = (userId: string) => {
    sendRequestMutation.mutate(userId);
  };

  // Filter bạn bè theo search
  const filteredFriends = friends.filter((f: FriendUser) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick friends = top 5 cho sidebar trái
  const quickFriends = filteredFriends.slice(0, 5);

  return (
    <div className="flex flex-col md:flex-row gap-6 font-sans text-slate-800 animate-fade-in relative min-h-[calc(100vh-120px)]">
      
      {/* ——— Cột trái: Sidebar bạn bè nhanh ——— */}
      <div className="w-full md:w-72 shrink-0 bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] text-left select-none space-y-5">
        <div className="flex items-center justify-between pl-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Bạn bè</h2>
          <span className="text-xs font-bold text-slate-400">
            {friends.length}
          </span>
        </div>

        {/* Ô Tìm kiếm bạn bè nhanh */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm bạn bè..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200/10 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600/20 transition-all font-semibold placeholder:text-slate-400"
          />
        </div>

        {/* Danh sách bạn bè */}
        <div className="space-y-1">
          {loadingFriends ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : quickFriends.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold text-center py-6">
              {searchQuery ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè nào'}
            </p>
          ) : (
            quickFriends.map((friend: FriendUser) => (
              <button
                key={friend.id}
                onClick={() => handleStartChat(friend.id)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all border-0 outline-none cursor-pointer',
                  selectedFriend === friend.id
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                <div className="relative shrink-0">
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                        {(friend.name || '')
                          .split(' ')
                          .filter(Boolean)
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || '?'}
                      </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-700 truncate">{friend.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    {friend.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Xem thêm ở dưới */}
        {filteredFriends.length > 5 && (
          <div className="pt-2 border-t border-slate-50 text-center">
            <span className="text-[11px] font-bold text-slate-400">
              +{filteredFriends.length - 5} bạn bè khác
            </span>
          </div>
        )}
      </div>

      {/* ——— Cột phải: Quản lý chi tiết bạn bè ——— */}
      <div className="flex-1 space-y-6">
        
        {/* Header quản lý bạn bè */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
          <div className="text-left space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý Bạn bè</h1>
            <p className="text-slate-400 text-xs font-bold">
              Kết nối và cùng nhau tiến bộ trong học tập.
            </p>
          </div>
        </div>

        {/* Hàng chia đôi: Lời mời kết bạn & Gợi ý kết bạn */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
          
          {/* Card Lời mời kết bạn */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] text-left flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-700">Lời mời kết bạn</span>
                {receivedRequests.length > 0 && (
                  <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-extrabold flex items-center justify-center">
                    {receivedRequests.length}
                  </span>
                )}
              </div>
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : receivedRequests.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">Không có lời mời nào</p>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {receivedRequests.map((req: FriendRequestItem) => {
                  const senderInfo = req.sender;
                  if (!senderInfo) return null;
                  return (
                    <div key={req.senderId} className="flex items-center justify-between gap-3 p-1.5 rounded-2xl hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        {senderInfo.avatarUrl ? (
                          <img
                            src={senderInfo.avatarUrl}
                            alt={senderInfo.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {senderInfo.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-700 truncate">{senderInfo.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                            {senderInfo.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.senderId)}
                          disabled={acceptMutation.isPending}
                          className="px-3 py-1.5 text-[10px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all border-0 outline-none cursor-pointer disabled:opacity-50"
                        >
                          Đồng ý
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.senderId)}
                          disabled={rejectMutation.isPending}
                          className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all border-0 outline-none cursor-pointer disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card Gợi ý kết bạn */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] text-left flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3">
              <span className="text-sm font-black text-slate-700">Gợi ý kết bạn</span>
              <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg border-0 bg-transparent cursor-pointer">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">Không có gợi ý nào</p>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {suggestions.map((sug: FriendSuggestionItem) => (
                  <div key={sug.id} className="flex items-center justify-between gap-3 p-1.5 rounded-2xl hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      {sug.avatarUrl ? (
                        <img
                          src={sug.avatarUrl}
                          alt={sug.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {sug.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-700 truncate">{sug.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{sug.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendRequest(sug.id)}
                      disabled={sendRequestMutation.isPending}
                      className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 border border-slate-100 hover:border-indigo-600 rounded-xl transition-all cursor-pointer bg-transparent outline-none disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Lưới hiển thị tất cả bạn bè */}
        <div className="space-y-4 text-left select-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-sm font-black text-slate-700">Tất cả bạn bè</span>
            <span className="text-[10px] font-bold text-slate-400">{friends.length} bạn bè</span>
          </div>

          {loadingFriends ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : friends.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-7 h-7 text-indigo-300" />
              </div>
              <p className="text-sm font-bold text-slate-700">Chưa có bạn bè nào</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Hãy gửi lời mời kết bạn từ gợi ý bên trên nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend: FriendUser) => (
                <div
                  key={friend.id}
                  className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] flex flex-col items-center text-center space-y-4 hover:shadow-[0_8px_32px_rgba(99,102,241,0.03)] hover:border-slate-200/50 transition-all duration-300 relative group"
                >
                  {/* Avatar tròn */}
                  <div className="relative">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-slate-200 ring-offset-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm ring-2 ring-slate-200 ring-offset-2">
                        {(friend.name || '')
                          .split(' ')
                          .filter(Boolean)
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {friend.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">{friend.email}</p>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex gap-2 w-full pt-2">
                    <button
                      onClick={() => handleStartChat(friend.id)}
                      disabled={createConversationMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 text-[10px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer border-0 outline-none active:scale-95 disabled:opacity-50"
                    >
                      {createConversationMutation.isPending ? 'Kết nối...' : 'Nhắn tin'}
                    </button>
                    <button
                      onClick={() => navigate(`/users/${friend.id}`)}
                      className="flex-1 py-2 text-[10px] font-extrabold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl transition-all cursor-pointer outline-none active:scale-95"
                    >
                      Xem hồ sơ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Blue Message Floating Action Button ở góc phải dưới */}
      <button
        title="Nhắn tin nhanh"
        onClick={() => navigate('/chat')}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-slate-950/20 scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 z-40 outline-none"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

    </div>
  );
};

export default FriendsPage;
