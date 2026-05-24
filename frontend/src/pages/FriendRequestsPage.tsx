import React, { useState } from 'react';
import { RequestCard } from '../components/friends/RequestCard';
import { useFriendRequests } from '../hooks/useFriends';
import { UserPlus, Send, Inbox } from 'lucide-react';

const tabs = [
  { key: 'received' as const, label: 'Đã nhận', icon: Inbox },
  { key: 'sent' as const, label: 'Đã gửi', icon: Send },
];

export const FriendRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const { data: requests, isLoading, error } = useFriendRequests(activeTab);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Lời mời kết bạn</h2>
        <p className="text-slate-500 text-sm mt-1">Quản lý các lời mời bạn đã nhận và đã gửi.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="font-semibold text-slate-700">Không thể tải dữ liệu</p>
          <p className="text-sm text-slate-400 mt-1">Kiểm tra kết nối và thử lại.</p>
        </div>
      ) : !requests || requests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={28} className="text-indigo-300" />
          </div>
          <p className="font-semibold text-slate-700">Không có lời mời nào</p>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'received'
              ? 'Bạn chưa nhận được lời mời kết bạn nào.'
              : 'Bạn chưa gửi lời mời kết bạn nào.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} type={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
};
