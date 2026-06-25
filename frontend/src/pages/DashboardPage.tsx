import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { APP_NAME, ROUTES } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import {
  MessagesSquare,
  FileText,
  Layers,
  Users,
  UserRoundPen,
  User,
  Sparkles,
  ArrowRight,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

type ShortcutItem = {
  label: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  accent: string;
};

const shortcuts: ShortcutItem[] = [
  {
    label: 'Tin nhắn',
    description: 'Trò chuyện nhóm và riêng tư',
    to: ROUTES.CHAT,
    icon: <MessagesSquare className="h-6 w-6" />,
    accent: 'bg-sky-50 text-sky-600 border-sky-100',
  },
  {
    label: 'Tài liệu',
    description: 'Xem và chia sẻ tài liệu',
    to: ROUTES.DOCUMENTS,
    icon: <FileText className="h-6 w-6" />,
    accent: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    label: 'Flashcard',
    description: 'Học thuộc với thẻ ghi nhớ',
    to: '/flashcard',
    icon: <Layers className="h-6 w-6" />,
    accent: 'bg-violet-50 text-violet-600 border-violet-100',
  },
  {
    label: 'Bạn bè',
    description: 'Quản lý kết nối của bạn',
    to: ROUTES.FRIENDS,
    icon: <Users className="h-6 w-6" />,
    accent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    label: 'Nhóm',
    description: 'Khám phá nhóm học tập',
    to: ROUTES.GROUPS,
    icon: <UserRoundPen className="h-6 w-6" />,
    accent: 'bg-rose-50 text-rose-600 border-rose-100',
  },
  {
    label: 'Hồ sơ',
    description: 'Chỉnh sửa thông tin cá nhân',
    to: ROUTES.PROFILE,
    icon: <User className="h-6 w-6" />,
    accent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
];

const DashboardPage = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const displayName = profile?.name || 'bạn';

  return (
    <div className="space-y-8">
      {/* Header + App info */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          {APP_NAME} — Nền tảng học tập thông minh
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isAuthenticated ? `${greeting}, ${displayName}` : 'Chào mừng bạn đến với CollabBrain'}
        </h1>
        <p className="text-muted-foreground text-sm">
          Không gian học tập kết nối, ghi nhớ và cộng tác mọi lúc mọi nơi.
        </p>
      </div>

      {/* Quick access tiles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Truy cập nhanh</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => (
            <Link key={item.to} to={item.to} className="group">
              <Card className="h-full border border-border/60 bg-card/95 transition-all hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex h-full items-center gap-4 p-5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.accent}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently joined / activity summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Mới tham gia</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
            Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {isProfileLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Đang tải thông tin tài khoản...
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-border/60 bg-card/90">
            <CardContent className="flex flex-col gap-4 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Tài khoản {displayName} đã sẵn sàng
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bạn có thể bắt đầu bằng cách chọn một tính năng ở trên.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" asChild>
                  <Link to={ROUTES.GROUPS}>Khám phá nhóm</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/flashcard">Tạo bộ flashcard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
