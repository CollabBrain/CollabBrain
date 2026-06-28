import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useTodos, useUpdateTodo, parseTodoAttachments } from '../hooks/useTodos';
import type { TodoItem } from '../hooks/useTodos';
import { APP_NAME, ROUTES } from '../constants';
import { Card, CardContent } from '../components/ui/card';
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
  Calendar,
  CheckCircle,
  AlertCircle,
  Bell,
  ListTodo,
  Paperclip,
  Link2,
  Check,
  Loader2,
  Clock,
  TrendingUp,
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
  const { data: profile } = useProfile();
  const { data: todos = [], isLoading: isTodosLoading } = useTodos();
  const updateTodoMutation = useUpdateTodo();

  const now = new Date();
  const greeting = useMemo(() => {
    if (now.getHours() < 12) return 'Chào buổi sáng';
    if (now.getHours() < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const displayName = profile?.name || 'bạn';

  // Todo stats
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const activeCount = totalCount - completedCount;
  const overdueCount = todos.filter((t) => {
    if (t.isCompleted || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  }).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const today = now;
  const todayTodos = todos.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingTodos = todos
    .filter((t) => {
      if (t.isCompleted || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= twentyFourHoursLater;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const overdueTodos = todos
    .filter((t) => {
      if (t.isCompleted || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    })
    .sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime());

  const handleQuickComplete = async (todoId: string) => {
    try {
      await updateTodoMutation.mutateAsync({ id: todoId, isCompleted: true });
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  };

  const getTimeRemaining = (dateStr: string) => {
    const diffMs = new Date(dateStr).getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 0) return `Trễ ${Math.abs(diffMins)} phút`;
    if (diffMins < 60) return `Còn ${diffMins} phút`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `Còn ${hours}h${mins > 0 ? ` ${mins}p` : ""}`;
  };

  const renderTodoCard = (todo: TodoItem, showTimeRemaining = false) => {
    const atts = parseTodoAttachments(todo.attachments);
    const isOverdue = todo.dueDate && new Date(todo.dueDate) < now && !todo.isCompleted;

    return (
      <div
        key={todo.id}
        className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md group/card ${
          isOverdue
            ? "bg-rose-50/30 border-rose-100"
            : todo.isCompleted
            ? "bg-slate-50/60 border-slate-100 opacity-75"
            : "bg-white border-slate-100 hover:border-indigo-100"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2">
              {todo.isNotify && !todo.isCompleted && (
                <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
              )}
              <p className={`text-sm font-bold truncate leading-snug ${
                todo.isCompleted ? "line-through text-slate-400" : "text-slate-700"
              }`}>
                {todo.title}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {todo.dueDate && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-lg border ${
                  todo.isCompleted
                    ? "text-slate-400 bg-slate-100/50 border-slate-200/50"
                    : isOverdue
                    ? "text-rose-600 bg-rose-50 border-rose-100"
                    : "text-indigo-600 bg-indigo-50/50 border-indigo-100/50"
                }`}>
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatTime(todo.dueDate)}
                </span>
              )}

              {showTimeRemaining && todo.dueDate && !todo.isCompleted && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border ${
                  isOverdue
                    ? "text-rose-600 bg-rose-50 border-rose-100 animate-pulse"
                    : "text-amber-600 bg-amber-50 border-amber-100"
                }`}>
                  {getTimeRemaining(todo.dueDate)}
                </span>
              )}

              {todo.isCompleted && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-lg border text-emerald-600 bg-emerald-50 border-emerald-100">
                  Đã hoàn thành
                </span>
              )}
            </div>

            {atts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {atts.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-md border text-emerald-600 bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors truncate max-w-[140px]"
                    title={att.name}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {att.url.startsWith("http") && !att.url.includes("supabase") ? (
                      <Link2 className="w-2.5 h-2.5 shrink-0" />
                    ) : (
                      <Paperclip className="w-2.5 h-2.5 shrink-0" />
                    )}
                    {att.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          {todo.isCompleted ? (
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center border border-emerald-100 shrink-0">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
          ) : (
            <button
              onClick={() => handleQuickComplete(todo.id)}
              disabled={updateTodoMutation.isPending}
              className="h-8 w-8 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-all border-0 outline-none cursor-pointer disabled:opacity-50 shadow-sm shrink-0 opacity-60 group-hover/card:opacity-100"
              title="Hoàn thành nhanh"
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header + App info */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          {APP_NAME} — Nền tảng học tập thông minh
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {greeting}, {displayName}
        </h1>
        <p className="text-muted-foreground text-sm">
          Không gian học tập kết nối, ghi nhớ và cộng tác mọi lúc mọi nơi.
        </p>
      </div>

      {/* Todo Stats Cards */}
      {!isTodosLoading && totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <ListTodo className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{activeCount}</p>
                  <p className="text-xs text-slate-400 font-semibold">Đang làm</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{completedCount}</p>
                  <p className="text-xs text-slate-400 font-semibold">Hoàn thành</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{completionRate}%</p>
                  <p className="text-xs text-slate-400 font-semibold">Tỷ lệ hoàn thành</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${overdueCount > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                  <AlertCircle className={`h-5 w-5 ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{overdueCount}</p>
                  <p className="text-xs text-slate-400 font-semibold">Trễ hạn</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Upcoming & Overdue Todos */}
      {!isTodosLoading && totalCount > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Lịch học & Thông báo</h2>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-muted-foreground">
              <Link to="/todos">Xem tất cả <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming */}
            <Card className="border border-slate-100 bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-black text-slate-700">Sắp tới (24h)</h3>
                  {upcomingTodos.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 rounded-lg animate-pulse">
                      {upcomingTodos.length}
                    </span>
                  )}
                </div>
                {upcomingTodos.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Calendar className="w-8 h-8 text-slate-200" />
                    <p className="text-xs text-slate-400 font-semibold text-center">Không có lịch nào sắp tới</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {upcomingTodos.slice(0, 5).map((todo) => renderTodoCard(todo, true))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card className="border border-slate-100 bg-white overflow-hidden">
              <div className={`h-1 ${overdueCount > 0 ? 'bg-gradient-to-r from-rose-400 to-pink-500' : 'bg-gradient-to-r from-indigo-400 to-violet-500'}`} />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${overdueCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    {overdueCount > 0 ? (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Calendar className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-700">{overdueCount > 0 ? 'Trễ hạn' : 'Hôm nay'}</h3>
                  {overdueCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
                      {overdueCount}
                    </span>
                  )}
                  {overdueCount === 0 && todayTodos.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg">
                      {todayTodos.length}
                    </span>
                  )}
                </div>
                {overdueCount > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {overdueTodos.slice(0, 5).map((todo) => renderTodoCard(todo, true))}
                    {overdueCount > 5 && (
                      <Link to="/todos" className="block text-center text-[11px] font-bold text-indigo-600 hover:text-indigo-700 py-2 transition-colors">
                        Xem thêm {overdueCount - 5} lịch →
                      </Link>
                    )}
                  </div>
                ) : todayTodos.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {todayTodos.map((todo) => renderTodoCard(todo, false))}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8 text-slate-200" />
                    <p className="text-xs text-slate-400 font-semibold text-center">Không có lịch nào hôm nay</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Loading state */}
      {isTodosLoading && (
        <div className="py-8 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-400 font-semibold">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Recently joined / activity summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Mới tham gia</h2>
        </div>

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
      </section>
    </div>
  );
};

export default DashboardPage;
