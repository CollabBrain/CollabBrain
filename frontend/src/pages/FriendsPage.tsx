import React, { useState } from 'react';
import { FriendCard } from '../components/friends/FriendCard';
import { FriendSearch } from '../components/friends/FriendSearch';
import { useFriends } from '../hooks/useFriends';
import type { User } from '../types/friend';
import { Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FriendsPage: React.FC = () => {
  const { data: friends, isLoading, error } = useFriends();
  const [searchResults, setSearchResults] = useState<User[] | null>(null);
  const navigate = useNavigate();

  const displayedFriends = searchResults ?? friends ?? [];
  const isSearching = searchResults !== null;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Bạn bè</h2>
            <p className="text-slate-500 text-sm mt-1">
              {friends ? `${friends.length} người bạn` : 'Quản lý danh sách bạn bè của bạn'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FriendSearch onSearchResult={setSearchResults} />
            <button
              onClick={() => navigate('/friends/suggestions')}
              className="btn-primary whitespace-nowrap"
            >
              <UserPlus size={16} />
              Thêm bạn
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Đang tải danh sách...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center border-rose-100">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <Users size={20} className="text-rose-400" />
          </div>
          <p className="font-semibold text-slate-700">Không thể tải danh sách</p>
          <p className="text-sm text-slate-400 mt-1">Kiểm tra kết nối và thử lại sau.</p>
        </div>
      ) : displayedFriends.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-indigo-300" />
          </div>
          <p className="font-semibold text-slate-700">
            {isSearching ? 'Không tìm thấy kết quả' : 'Chưa có bạn bè nào'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {isSearching ? 'Hãy thử tên khác.' : 'Hãy khám phá gợi ý kết bạn từ chúng tôi!'}
          </p>
          {!isSearching && (
            <button
              onClick={() => navigate('/friends/suggestions')}
              className="btn-primary mx-auto mt-4"
            >
              <UserPlus size={16} />
              Tìm bạn bè
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {displayedFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}
    </div>
  );
};
