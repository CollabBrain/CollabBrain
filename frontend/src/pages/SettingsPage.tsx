import React from 'react';
import { NotificationSettingsPanel } from '../components/NotificationSettingsPanel';
import { useAuthStore } from '../store/useAuthStore';

export const SettingsPage = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cài đặt</h1>
        <p className="text-sm text-slate-400 font-medium mt-0.5">Quản lý cấu hình tài khoản và ứng dụng của bạn</p>
      </div>

      {isAuthenticated ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <NotificationSettingsPanel />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 font-semibold">
          Vui lòng đăng nhập để thay đổi cài đặt.
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
