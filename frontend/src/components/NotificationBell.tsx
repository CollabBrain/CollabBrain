import { useState, useEffect, useRef } from "react";
import { useTodos, useUpdateTodo } from "../hooks/useTodos";
import type { TodoItem } from "../hooks/useTodos";
import { Bell, Calendar, Check, X, AlertCircle, MessageCircle } from "lucide-react";
import { useNotificationSettings } from "../hooks/useNotificationSettings";

export const NotificationBell = () => {
  const { data: todos = [] } = useTodos();
  const { data: notifSettings } = useNotificationSettings();
  const updateTodoMutation = useUpdateTodo();

  const [upcomingTasks, setUpcomingTasks] = useState<TodoItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Track tasks that have already triggered a Toast alert in the current session
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; timeStr: string; type: 'todo' | 'chat' }>>([]);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Get notification enabled state
  const isNotifEnabled = notifSettings?.enableAll !== false;
  const isChatEnabled = notifSettings?.enableChat !== false;
  const chatPriority = notifSettings?.chatPriority || 'HIGH';

  // Check if chat notifications should be prominent
  const isChatHighPriority = chatPriority === 'HIGH';
  const isChatMediumPriority = chatPriority === 'MEDIUM';

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Interval checking every 5 seconds for upcoming tasks
  useEffect(() => {
    if (!isNotifEnabled) return;

    const checkUpcomingTasks = () => {
      const now = new Date();
      const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Find uncompleted tasks with notifications enabled, due within the window
      const upcoming = todos.filter((todo) => {
        if (todo.isCompleted || !todo.isNotify || !todo.dueDate) return false;
        const dueDate = new Date(todo.dueDate);
        return dueDate >= fiveMinutesAgo && dueDate <= fifteenMinutesLater;
      });

      setUpcomingTasks(upcoming);

      // Trigger toast alerts for new upcoming tasks
      upcoming.forEach((todo) => {
        if (!notifiedIdsRef.current.has(todo.id)) {
          notifiedIdsRef.current.add(todo.id);

          // Calculate time remaining string
          const dueTime = new Date(todo.dueDate!).getTime();
          const diffMs = dueTime - now.getTime();
          const diffMins = Math.round(diffMs / 60000);

          let timeStr = "";
          if (diffMins > 0) {
            timeStr = `diễn ra sau ${diffMins} phút`;
          } else if (diffMins < 0) {
            timeStr = `đã trễ hẹn ${Math.abs(diffMins)} phút`;
          } else {
            timeStr = `đang diễn ra ngay bây giờ`;
          }

          // Add toast
          const newToast = { id: todo.id, title: todo.title, timeStr, type: 'todo' as const };
          setToasts((prev) => [...prev, newToast]);

          // Auto remove toast after 7 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== todo.id));
          }, 7000);
        }
      });
    };

    checkUpcomingTasks(); // initial run
    const interval = setInterval(checkUpcomingTasks, 5000);
    return () => clearInterval(interval);
  }, [todos, isNotifEnabled]);

  const handleQuickComplete = async (todoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await updateTodoMutation.mutateAsync({
        id: todoId,
        isCompleted: true
      });
      // Remove corresponding toast if active
      setToasts((prev) => prev.filter((t) => t.id !== todoId));
    } catch (err) {
      console.error(err);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Function to add chat message toast (called from outside)
  useEffect(() => {
    // Listen for custom chat notification events
    const handleChatNotification = (event: CustomEvent<{ senderName: string; content: string; conversationName: string }>) => {
      if (!isNotifEnabled || !isChatEnabled) return;

      const toastId = `chat-${Date.now()}`;
      const { senderName, content, conversationName } = event.detail;

      const newToast = {
        id: toastId,
        title: senderName,
        timeStr: content.length > 50 ? content.slice(0, 50) + '...' : content,
        type: 'chat' as const
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);

      // Play sound if enabled
      if (notifSettings?.enableSound) {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQ==');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }

      // Vibrate if enabled
      if (notifSettings?.enableVibrate && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    };

    window.addEventListener('chat-notification', handleChatNotification as EventListener);
    return () => window.removeEventListener('chat-notification', handleChatNotification as EventListener);
  }, [isNotifEnabled, isChatEnabled, notifSettings?.enableSound, notifSettings?.enableVibrate]);

  // Sort toasts: chat HIGH priority first, then MEDIUM, then LOW, then todo
  const sortedToasts = [...toasts].sort((a, b) => {
    if (a.type === 'chat' && b.type === 'todo') return -1;
    if (a.type === 'todo' && b.type === 'chat') return 1;
    if (a.type === 'chat' && b.type === 'chat') {
      if (isChatHighPriority) return -1;
      if (isChatMediumPriority && a.id > b.id) return -1;
    }
    return 0;
  });

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors cursor-pointer border-0 bg-transparent outline-none relative ${
          !isNotifEnabled
            ? 'text-slate-300'
            : upcomingTasks.length > 0
            ? 'text-amber-600 hover:bg-amber-50 animate-wiggle'
            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
        }`}
        title={!isNotifEnabled ? "Thông báo đã tắt" : "Thông báo lịch học"}
      >
        <Bell className={`w-5 h-5 ${upcomingTasks.length > 0 ? "animate-wiggle" : ""}`} />

        {isNotifEnabled && upcomingTasks.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border border-white leading-none scale-100 select-none animate-pulse">
            {upcomingTasks.length}
          </span>
        )}
        {!isNotifEnabled && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" title="Thông báo đã tắt" />
        )}
      </button>

      {/* Popover List */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-80 bg-white border border-slate-100 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-4 z-50 text-left animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-50 mb-3">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Lịch học sắp diễn ra
            </span>
            {upcomingTasks.length > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-black text-rose-600 bg-rose-50 rounded-lg">
                Sắp tới
              </span>
            )}
          </div>

          {upcomingTasks.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-bold py-6 text-center">
              Không có lịch học nào sắp diễn ra trong 15 phút tới
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {upcomingTasks.map((todo) => {
                const now = new Date();
                const dueTime = new Date(todo.dueDate!).getTime();
                const diffMins = Math.round((dueTime - now.getTime()) / 60000);

                return (
                  <div
                    key={todo.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:bg-indigo-50/10 transition-colors"
                  >
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-slate-700 truncate leading-snug">
                        {todo.title}
                      </p>
                      <p className="text-[9px] text-slate-450 font-bold mt-1 flex items-center gap-1 select-none">
                        <ClockIcon className="w-3 h-3 text-indigo-500" />
                        {diffMins > 0
                          ? `Sắp bắt đầu (sau ${diffMins} phút)`
                          : diffMins < 0
                          ? `Trễ ${Math.abs(diffMins)} phút`
                          : "Đang diễn ra"}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleQuickComplete(todo.id, e)}
                      disabled={updateTodoMutation.isPending}
                      className="h-7 w-7 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-colors border-0 outline-none cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
                      title="Đánh dấu hoàn thành"
                    >
                      <Check className="w-4 h-4 stroke-[3.5]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Toast Alerts Container */}
      {sortedToasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-auto">
          {sortedToasts.map((toast) => (
            <div
              key={toast.id}
              className={[
                'rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md flex items-start gap-3.5 animate-in slide-in-from-right duration-350 select-none relative overflow-hidden group',
                // Priority styling for chat messages
                toast.type === 'chat' && isChatHighPriority
                  ? 'bg-rose-600/95 border border-rose-500 text-white p-4.5'
                  : toast.type === 'chat' && isChatMediumPriority
                  ? 'bg-amber-500/95 border border-amber-400 text-white p-4.5'
                  : toast.type === 'chat'
                  ? 'bg-slate-800/95 border border-slate-700 text-white p-4.5'
                  : 'bg-slate-900/95 border border-slate-800 text-white p-4.5'
              ].join(' ')}
            >
              {/* Left Icon */}
              <div className={[
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                toast.type === 'chat' && isChatHighPriority
                  ? 'bg-white/20 text-white'
                  : toast.type === 'chat' && isChatMediumPriority
                  ? 'bg-white/20 text-white'
                  : toast.type === 'chat'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-500/10 text-amber-500'
              ].join(' ')}>
                {toast.type === 'chat' ? (
                  <MessageCircle className="w-5 h-5 animate-pulse" />
                ) : (
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 text-left space-y-1">
                <p className={[
                  'text-xs font-black uppercase tracking-widest leading-none',
                  toast.type === 'chat' && isChatHighPriority
                    ? 'text-rose-200'
                    : toast.type === 'chat'
                    ? 'text-amber-200'
                    : 'text-slate-150'
                ].join(' ')}>
                  {toast.type === 'chat' ? 'Tin nhắn mới' : 'Lịch học sắp diễn ra'}
                </p>
                <p className="text-sm font-bold text-white truncate leading-snug">{toast.title}</p>
                <p className={[
                  'text-[10px] font-extrabold capitalize',
                  toast.type === 'chat' && isChatHighPriority
                    ? 'text-rose-200'
                    : toast.type === 'chat'
                    ? 'text-amber-200'
                    : 'text-amber-400'
                ].join(' ')}>
                  {toast.timeStr}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                {toast.type === 'todo' && (
                  <button
                    onClick={(e) => handleQuickComplete(toast.id, e)}
                    disabled={updateTodoMutation.isPending}
                    className="h-7 w-7 rounded-lg bg-indigo-650 hover:bg-indigo-650/80 text-white flex items-center justify-center border-0 outline-none cursor-pointer transition-colors shadow-sm"
                    title="Hoàn thành nhanh"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                  </button>
                )}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center border-0 outline-none cursor-pointer transition-colors"
                  title="Đóng thông báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mini Clock Icon
const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
