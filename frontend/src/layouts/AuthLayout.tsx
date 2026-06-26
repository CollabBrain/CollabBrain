import { Outlet } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { BookOpen, Users, Zap, Award } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const features = [
  { icon: BookOpen, text: 'Thư viện tài liệu phong phú' },
  { icon: Users, text: 'Học nhóm cộng tác thời gian thực' },
  { icon: Zap, text: 'Trợ lý AI thông minh hỗ trợ 24/7' },
  { icon: Award, text: 'Theo dõi tiến độ học tập cá nhân' },
];

const AuthLayout = () => {
  const { data: settings } = useSettings();
  const webName = settings?.web_name || APP_NAME;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ——— Left panel: Branding + Features */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-edu-gradient">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/5" />

        {/* Grid dots pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">{webName}</span>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Nền tảng học tập
                <br />
                <span className="text-white/80">cộng tác thông minh</span>
              </h1>
              <p className="text-white/60 text-base leading-relaxed max-w-sm">
                Kết nối với bạn bè, chia sẻ kiến thức và cùng nhau chinh phục mọi mục tiêu học tập.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 glass-card rounded-xl px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p 
            className="text-white/30 text-xs"
            dangerouslySetInnerHTML={{ __html: settings?.footer || `© 2026 ${webName}. All rights reserved.` }}
          />
        </div>
      </div>

      {/* ——— Right panel: Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-edu-gradient flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">{webName}</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
