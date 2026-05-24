import React from 'react';
import { BlockedUserCard } from '../components/friends/BlockedUserCard';
import { useBlockList } from '../hooks/useFriends';
import { ShieldOff } from 'lucide-react';

export const BlockedListPage: React.FC = () => {
  const { data: blockedUsers, isLoading, error } = useBlockList();

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Danh sách đã chặn</h2>
        <p className="text-slate-500 text-sm mt-1">
          {blockedUsers && blockedUsers.length > 0
            ? `Bạn đang chặn ${blockedUsers.length} người.`
            : 'Quản lý những người bạn đã chặn.'}
        </p>
      </div>

      {/* Notice banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <ShieldOff size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Người bị chặn sẽ không thể xem trang cá nhân, nhắn tin hoặc tương tác với bạn. Bạn có thể bỏ chặn bất kỳ lúc nào.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="font-semibold text-slate-700">Không thể tải danh sách</p>
          <p className="text-sm text-slate-400 mt-1">Kiểm tra kết nối và thử lại.</p>
        </div>
      ) : !blockedUsers || blockedUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-slate-300" />
          </div>
          <p className="font-semibold text-slate-700">Danh sách trống</p>
          <p className="text-sm text-slate-400 mt-1">Bạn chưa chặn ai cả.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {blockedUsers.map((user) => (
            <BlockedUserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};
