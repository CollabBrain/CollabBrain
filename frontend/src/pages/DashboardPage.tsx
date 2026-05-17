import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { APP_NAME, ROUTES } from '../constants';

const DashboardPage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Chào mừng đến với {APP_NAME}! {isAuthenticated ? '✅ Đã xác thực' : ''}
        </p>
      </div>

      {/* Placeholder — sẽ thay bằng nội dung thực */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          Nội dung Dashboard sẽ được xây dựng ở đây.
        </p>
        <Link
          to={ROUTES.PROFILE}
          className="text-sm text-primary font-medium hover:underline"
        >
          Đến trang Hồ sơ →
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
