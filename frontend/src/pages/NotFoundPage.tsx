import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold">Trang không tồn tại</h1>
      <p className="text-sm text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Link
        to={ROUTES.HOME}
        className="text-sm text-primary font-medium hover:underline"
      >
        ← Quay về trang chủ
      </Link>
    </div>
  );
};

export default NotFoundPage;
