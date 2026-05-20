import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { APP_NAME, ROUTES } from '../constants';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

/**
 * MainLayout — layout chính cho các trang cần đăng nhập.
 * ChatPage dùng toàn bộ chiều cao (không bọc max-w / padding).
 */
const MainLayout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Tổng tin nhắn chưa đọc để hiện badge trên nav
  const totalUnread = useChatStore((s) =>
    s.conversations.reduce((acc, c) => acc + c.unreadCount, 0)
  );

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const isChatPage = pathname.startsWith(ROUTES.CHAT);

  const navItems = [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.CHAT, label: 'Tin nhắn', icon: MessageSquare, badge: totalUnread },
    { to: ROUTES.PROFILE, label: 'Hồ sơ', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-card sticky top-0 z-50 shrink-0">
        <div className="max-w-full px-4 h-14 flex items-center justify-between">
          <Link to={ROUTES.DASHBOARD} className="font-bold text-lg text-primary">
            {APP_NAME}
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, badge }) => (
              <Button
                key={to}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  'relative',
                  pathname.startsWith(to) && 'bg-primary/10 text-primary hover:bg-primary/15'
                )}
              >
                <Link to={to}>
                  <Icon className="h-4 w-4 mr-1.5" />
                  {label}
                  {badge && badge > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </Link>
              </Button>
            ))}

            <div className="w-px h-5 bg-border mx-1" />

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Đăng xuất
            </Button>
          </nav>
        </div>
      </header>

      {/* Page content — ChatPage cần full height, các trang khác dùng padding */}
      {isChatPage ? (
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      ) : (
        <main className="max-w-5xl mx-auto w-full px-4 py-8">
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default MainLayout;
