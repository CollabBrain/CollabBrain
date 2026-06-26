import { useProfile } from '../features/profile/hooks/useProfile';
import { useTodos, useUpdateTodo, parseTodoAttachments } from '../hooks/useTodos';
import type { TodoItem } from '../hooks/useTodos';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Bell,
  ListTodo,
  Paperclip,
  Link2,
  Check,
  ArrowRight,
  Sparkles,
  BookOpen,
  TrendingUp,
  Loader2,
} from 'lucide-react';

const DashboardPage = () => {
  const { data: profile } = useProfile();
  const { data: todos = [], isLoading } = useTodos();
  const updateTodoMutation = useUpdateTodo();

  // Calculate statistics
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const activeCount = totalCount - completedCount;
  const overdueCount = todos.filter((t) => {
    if (t.isCompleted || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  // Completion rate
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Today's todos
  const today = new Date();
  const todayTodos = todos.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  // Upcoming todos (next 24 hours, not completed, sorted by time)
  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingTodos = todos
    .filter((t) => {
      if (t.isCompleted || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= twentyFourHoursLater;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  // Overdue todos (not completed, past due)
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

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
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
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-lg border ${
                    todo.isCompleted
                      ? "text-slate-400 bg-slate-100/50 border-slate-200/50"
                      : isOverdue
                      ? "text-rose-600 bg-rose-50 border-rose-100"
                      : "text-indigo-600 bg-indigo-50/50 border-indigo-100/50"
                  }`}
                >
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatTime(todo.dueDate)}
                </span>
              )}

              {showTimeRemaining && todo.dueDate && !todo.isCompleted && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-lg border ${
                    isOverdue
                      ? "text-rose-600 bg-rose-50 border-rose-100 animate-pulse"
                      : "text-amber-600 bg-amber-50 border-amber-100"
                  }`}
                >
                  {getTimeRemaining(todo.dueDate)}
                </span>
              )}

              {todo.isCompleted && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-lg border text-emerald-600 bg-emerald-50 border-emerald-100">
                  Đã hoàn thành
                </span>
              )}
            </div>

            {/* Attachment badges */}
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

          {/* Quick complete button / Completion status check */}
          {todo.isCompleted ? (
            <div
              className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center border border-emerald-100 shrink-0"
              title="Đã hoàn thành"
            >
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
    <div className="space-y-6 text-left relative select-none">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-[28px] p-8 text-white shadow-xl shadow-indigo-600/10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">{getGreeting()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {profile?.name || "Bạn"} 👋
          </h1>
          <p className="text-indigo-200 text-sm font-semibold mt-1.5 max-w-xl">
            {upcomingTodos.length > 0
              ? `Bạn có ${upcomingTodos.length} lịch học sắp diễn ra trong 24 giờ tới. Hãy chuẩn bị tốt nhé!`
              : overdueCount > 0
              ? `Có ${overdueCount} lịch học đã trễ hạn. Kiểm tra và cập nhật ngay nhé!`
              : "Không có lịch học nào sắp tới. Hãy tận hưởng thời gian rảnh! 🎉"
            }
          </p>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to="/todos"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-xs font-black text-white transition-all border border-white/10 hover:border-white/20 cursor-pointer"
            >
              <ListTodo className="w-4 h-4" />
              Quản lý lịch học
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/documents"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-xs font-black text-white transition-all border border-white/10 hover:border-white/20 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Tài liệu học tập
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng lịch học", value: totalCount, icon: ListTodo, color: "text-indigo-600 bg-indigo-50 border-indigo-100", gradient: "from-indigo-500 to-indigo-600" },
          { label: "Đang thực hiện", value: activeCount, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100", gradient: "from-amber-500 to-amber-600" },
          { label: "Đã hoàn thành", value: completedCount, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-100", gradient: "from-emerald-500 to-emerald-600" },
          { label: "Quá hạn", value: overdueCount, icon: AlertCircle, color: "text-rose-600 bg-rose-50 border-rose-100", gradient: "from-rose-500 to-rose-600" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] flex items-center justify-between hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{stat.label}</span>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black text-slate-700">Tiến độ hoàn thành</span>
            </div>
            <span className="text-sm font-black text-indigo-600">{completionRate}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2">
            {completedCount} / {totalCount} lịch học đã hoàn thành
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <span className="text-xs text-slate-400 font-bold">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Study Alerts Section */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(99,102,241,0.015)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-3xl" />
            <div className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4">
                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-500" />
                  </div>
                  Thông báo & Lịch học sắp tới
                </h3>
                {upcomingTodos.length > 0 && (
                  <span className="px-2.5 py-1 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 rounded-lg animate-pulse">
                    {upcomingTodos.length} sắp tới
                  </span>
                )}
              </div>

              {upcomingTodos.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold text-center">
                    Không có lịch học nào sắp diễn ra<br />trong 24 giờ tới
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {upcomingTodos.map((todo) => renderTodoCard(todo, true))}
                </div>
              )}
            </div>
          </div>

          {/* Overdue / Today's Schedule Section */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(99,102,241,0.015)] relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl ${
              overdueTodos.length > 0
                ? "bg-gradient-to-r from-rose-400 to-pink-500"
                : "bg-gradient-to-r from-indigo-400 to-violet-500"
            }`} />
            <div className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4">
                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                    overdueTodos.length > 0
                      ? "bg-rose-50 border-rose-100"
                      : "bg-indigo-50 border-indigo-100"
                  }`}>
                    {overdueTodos.length > 0 ? (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Calendar className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  {overdueTodos.length > 0 ? "Lịch học trễ hạn" : "Lịch học hôm nay"}
                </h3>
                {overdueTodos.length > 0 && (
                  <span className="px-2.5 py-1 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
                    {overdueTodos.length} trễ hạn
                  </span>
                )}
                {overdueTodos.length === 0 && todayTodos.length > 0 && (
                  <span className="px-2.5 py-1 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg">
                    {todayTodos.length} lịch hôm nay
                  </span>
                )}
              </div>

              {overdueTodos.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {overdueTodos.slice(0, 5).map((todo) => renderTodoCard(todo, true))}
                  {overdueTodos.length > 5 && (
                    <Link
                      to="/todos"
                      className="block text-center text-[11px] font-bold text-indigo-600 hover:text-indigo-700 py-2 transition-colors"
                    >
                      Xem tất cả {overdueTodos.length} lịch trễ hạn →
                    </Link>
                  )}
                </div>
              ) : todayTodos.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {todayTodos.map((todo) => renderTodoCard(todo, false))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold text-center">
                    Không có lịch học nào hôm nay.<br />Hãy tận hưởng! 🎉
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
