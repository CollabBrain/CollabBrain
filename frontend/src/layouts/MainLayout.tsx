import { useState, memo, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, FileText, User, Users, UserCircle, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { ROUTES } from '../constants';
import { cn } from '../lib/utils';
import { CallOverlay } from '../features/chat/components/CallOverlay';
import { useCallStore } from '../store/useCallStore';
import { getSocket } from '../socket/socket';

// ——— Nav items config ———
const NAV_ITEMS = [
  { to: ROUTES.CHAT, label: 'Chat', icon: MessageSquare },
  { to: ROUTES.DOCUMENTS, label: 'My Documents', icon: FileText },
  { to: '/friends', label: 'Friends', icon: User },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: ROUTES.PROFILE, label: 'Profile', icon: UserCircle },
];

// ——— Sidebar tách riêng, ổn định identity ———
interface SidebarContentProps {
  pathname: string;
  userAvatar: string;
  userName: string;
  userTier: string;
  onNavClick?: () => void;
  onLogout: () => void;
}

const SidebarContent = memo(({
  pathname,
  userAvatar,
  userName,
  userTier,
  onNavClick,
  onLogout,
}: SidebarContentProps) => {
  const isActive = (path: string) => {
    if (path === ROUTES.CHAT) return pathname.startsWith(ROUTES.CHAT);
    return pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 p-6 justify-between select-none">
      <div className="space-y-8">
        {/* Logo Branding */}
        <div className="flex flex-col gap-0.5 px-2">
          <Link to="/" className="text-[26px] font-extrabold text-indigo-600 tracking-tight flex items-center gap-1.5 hover:opacity-90">
            Studifier
          </Link>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">
            AI LEARNING
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm relative border-0 outline-none',
                  active
                    ? 'bg-indigo-50/70 text-indigo-600 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-indigo-600' : 'text-slate-400')} />
                {label}
                {active && (
                  <span className="absolute right-0.5 top-[25%] bottom-[25%] w-1.5 rounded-l bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile & Settings Footer Section */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <Link
          to={ROUTES.PROFILE}
          onClick={onNavClick}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all duration-200 group relative"
        >
          <img
            src={userAvatar}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
              {userName}
            </p>
            <p className="text-xs font-semibold text-slate-400 truncate">
              {userTier}
            </p>
          </div>
        </Link>

        {/* Utility Buttons: Settings & Logout */}
        <div className="flex items-center justify-between px-2">
          <Link
            to={ROUTES.PROFILE}
            title="Settings"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent outline-none"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

/**
 * MainLayout — Layout chính hỗ trợ Sidebar bên trái theo thiết kế Studifier.
 * Hỗ trợ Responsive: Desktop hiện Sidebar cố định, Mobile hiện Header rút gọn và Sidebar dạng ngăn kéo (Drawer).
 */
const MainLayout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: profile } = useProfile();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { setIncomingCall, status } = useCallStore();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const closeMobile = () => setIsMobileOpen(false);

  // ——— Lắng nghe cuộc gọi đến từ bất kỳ trang nào ———
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = (data: {
      callerId: string;
      callType: 'audio' | 'video';
      callerInfo: { name: string; avatarUrl?: string | null };
    }) => {
      // Bỏ qua nếu đang trong cuộc gọi khác
      if (status !== 'idle') {
        socket.emit('call:reject', { callerId: data.callerId, reason: 'busy' });
        return;
      }
      setIncomingCall({
        callerId: data.callerId,
        callType: data.callType,
        callerInfo: data.callerInfo,
      });
    };

    socket.on('call:incoming', handleIncomingCall);
    return () => { socket.off('call:incoming', handleIncomingCall); };
  }, [status, setIncomingCall]);

  // Avatar mặc định hoặc lấy từ profile
  const userAvatar = profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
  const userName = profile?.name || 'User';
  const userTier = profile?.email || 'Premium Student';

  // Props chung cho sidebar
  const sidebarProps: SidebarContentProps = {
    pathname,
    userAvatar,
    userName,
    userTier,
    onLogout: handleLogout,
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* CallOverlay — toàn cục, nằm trên tất cả nội dung */}
      <CallOverlay />
      {/* Mobile Navbar Header */}
      <header className="md:hidden shrink-0 h-16 border-b bg-white flex items-center justify-between px-6 z-40">
        <div className="flex flex-col">
          <span className="text-xl font-black text-indigo-600 tracking-tight">Studifier</span>
          <span className="text-[8px] font-bold text-slate-400 tracking-wider">AI LEARNING</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 border-0 bg-transparent outline-none cursor-pointer"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-[260px] shrink-0 h-screen sticky top-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeMobile}
          />
          {/* Drawer menu */}
          <div className="relative w-[260px] max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            <SidebarContent {...sidebarProps} onNavClick={closeMobile} />
            {/* Close button top-right inside panel */}
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg border-0 bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Workspace Panel */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      {pathname.startsWith(ROUTES.CHAT) ? (
          // ChatPage lấy toàn bộ chiều cao màn hình và không cuộn ngoài
          <div className="flex-1 h-full overflow-hidden">
            <Outlet />
          </div>
        ) : pathname.match(/^\/groups\/.+/) ? (
          // GroupWorkspacePage: full width, tự cuộn, không giới hạn max-width
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        ) : (
          // Các trang khác (Documents, Friends, Groups, Profile) có thanh cuộn và padding
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-[1200px] mx-auto w-full">
              <Outlet />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default MainLayout;
