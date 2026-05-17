import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { APP_NAME, ROUTES } from '../constants';
import { Button } from '../components/ui/button';

/**
 * MainLayout — layout chính cho các trang cần đăng nhập (Dashboard, Profile...).
 * Có navbar top với avatar user và nút logout.
 */
const MainLayout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={ROUTES.DASHBOARD} className="font-bold text-lg text-primary">
            {APP_NAME}
          </Link>

          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.PROFILE}>
                <User className="h-4 w-4 mr-1.5" />
                Hồ sơ
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Đăng xuất
            </Button>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
