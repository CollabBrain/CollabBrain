import { useState, memo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldAlert, AlertOctagon, LogOut, Menu, X, Settings, FileText } from 'lucide-react';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { cn } from '../lib/utils';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Quản lý Users', icon: Users },
  { to: '/admin/groups', label: 'Quản lý Groups', icon: ShieldAlert },
  { to: '/admin/documents', label: 'Quản lý Tài liệu', icon: FileText },
  { to: '/admin/reports', label: 'Báo cáo vi phạm', icon: AlertOctagon },
  { to: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings },
];

interface SidebarProps {
  pathname: string;
  onNavClick?: () => void;
  onLogout: () => void;
}

const AdminSidebarContent = memo(({ pathname, onNavClick, onLogout }: SidebarProps) => {
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 justify-between select-none">
      <div className="space-y-8">
        {/* Logo Admin */}
        <div className="flex flex-col gap-0.5 px-2">
          <Link to="/admin/dashboard" className="text-2xl font-black text-indigo-400 tracking-tight flex items-center gap-1.5 hover:opacity-90">
            CollabBrain
          </Link>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">
            Admin Portal
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5">
          {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm relative border-0 outline-none',
                  active
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-white' : 'text-slate-400')} />
                {label}
                {active && (
                  <span className="absolute right-0.5 top-[25%] bottom-[25%] w-1.5 rounded-l bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">
              Administrator
            </p>
            <p className="text-xs font-semibold text-slate-400 truncate">
              Hệ thống quản lý
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-xl transition-all duration-200 font-semibold text-sm border-0 bg-transparent outline-none cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-rose-400" />
          Đăng xuất Admin
        </button>
      </div>
    </div>
  );
});

AdminSidebarContent.displayName = 'AdminSidebarContent';

const AdminLayout = () => {
  const { logout } = useAdminAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.replace('/admin/login');
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden font-sans text-slate-200">
      {/* Mobile Header */}
      <header className="md:hidden shrink-0 h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-40">
        <div className="flex flex-col">
          <span className="text-xl font-black text-indigo-400 tracking-tight">CollabBrain</span>
          <span className="text-[8px] font-bold text-slate-400 tracking-wider">ADMIN PORTAL</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 border-0 bg-transparent outline-none cursor-pointer"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[260px] shrink-0 h-screen sticky top-0">
        <AdminSidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={closeMobile}
          />
          <div className="relative w-[260px] max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            <AdminSidebarContent pathname={pathname} onLogout={handleLogout} onNavClick={closeMobile} />
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 rounded-lg border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Workspace Panel */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-64px)] md:h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-950">
          <div className="max-w-[1400px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
