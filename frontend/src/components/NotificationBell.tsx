import { useState, useEffect, useRef } from "react";
import { useTodos, useUpdateTodo } from "../hooks/useTodos";
import type { TodoItem } from "../hooks/useTodos";
import { Bell, Calendar, Check, X, AlertCircle, MessageCircle } from "lucide-react";
import { useNotificationSettings } from "../hooks/useNotificationSettings";
import { useNotifications, useMarkNotificationRead } from "../hooks/useNotifications";
import { cn } from "../lib/utils";

export const NotificationBell = () => {
  const { data: todos = [] } = useTodos();
  const { data: systemNotifs = [] } = useNotifications();
  const { data: notifSettings } = useNotificationSettings();
  const updateTodoMutation = useUpdateTodo();
  const markReadMutation = useMarkNotificationRead();

  const [upcomingTasks, setUpcomingTasks] = useState<TodoItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Track tasks that have already triggered a Toast alert in the current session
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; timeStr: string; type: 'todo' | 'chat' | 'friend' | 'group' | 'error' }>>([]);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Get notification enabled state
  const isNotifEnabled = notifSettings?.enableAll !== false;
  const isChatEnabled = notifSettings?.enableChat !== false;
  const isFriendEnabled = notifSettings?.enableFriend !== false;
  const isGroupEnabled = notifSettings?.enableGroup !== false;
  const chatPriority = notifSettings?.chatPriority || 'HIGH';

  // Check if chat notifications should be prominent
  const isChatHighPriority = chatPriority === 'HIGH';
  const isChatMediumPriority = chatPriority === 'MEDIUM';


  // Inject keyframe style for progress bar
  useEffect(() => {
    const styleId = 'toast-progress-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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

  // Listen for custom app notification events (chat, friend, group)
  useEffect(() => {
    interface AppNotificationDetail {
      title: string;
      message: string;
      type: 'chat' | 'friend' | 'group';
    }

    const handleAppNotification = (event: CustomEvent<AppNotificationDetail>) => {
      const { title, message, type } = event.detail;

      if (!isNotifEnabled) return;
      if (type === 'chat' && !isChatEnabled) return;
      if (type === 'friend' && !isFriendEnabled) return;
      if (type === 'group' && !isGroupEnabled) return;

      const toastId = `${type}-${Date.now()}`;
      const newToast = {
        id: toastId,
        title,
        timeStr: message,
        type
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

    window.addEventListener('app-notification', handleAppNotification as EventListener);
    return () => window.removeEventListener('app-notification', handleAppNotification as EventListener);
  }, [isNotifEnabled, isChatEnabled, isFriendEnabled, isGroupEnabled, notifSettings?.enableSound, notifSettings?.enableVibrate]);

  // Sort toasts: social alerts first, then todo
  const sortedToasts = [...toasts].sort((a, b) => {
    const isSocialA = ['chat', 'friend', 'group'].includes(a.type);
    const isSocialB = ['chat', 'friend', 'group'].includes(b.type);
    if (isSocialA && b.type === 'todo') return -1;
    if (a.type === 'todo' && isSocialB) return 1;
    if (a.type === 'chat' && b.type === 'chat') {
      if (isChatHighPriority) return -1;
      if (isChatMediumPriority && a.id > b.id) return -1;
    }
    return 0;
  });

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'chat':
        return {
          iconBg: 'bg-blue-500 text-white',
          titleColor: 'text-slate-900 dark:text-white',
          progressBarBg: 'bg-blue-50 dark:bg-blue-950/20',
          progressBarActive: 'bg-blue-500',
        };
      case 'friend':
        return {
          iconBg: 'bg-emerald-500 text-white',
          titleColor: 'text-slate-900 dark:text-white',
          progressBarBg: 'bg-emerald-50 dark:bg-emerald-950/20',
          progressBarActive: 'bg-emerald-500',
        };
      case 'group':
        return {
          iconBg: 'bg-purple-500 text-white',
          titleColor: 'text-slate-900 dark:text-white',
          progressBarBg: 'bg-purple-50 dark:bg-purple-950/20',
          progressBarActive: 'bg-purple-500',
        };
      case 'error':
        return {
          iconBg: 'bg-rose-500 text-white',
          titleColor: 'text-slate-900 dark:text-white',
          progressBarBg: 'bg-rose-50 dark:bg-rose-950/20',
          progressBarActive: 'bg-rose-500',
        };
      default: // todo / default
        return {
          iconBg: 'bg-amber-500 text-white',
          titleColor: 'text-slate-900 dark:text-white',
          progressBarBg: 'bg-amber-50 dark:bg-amber-950/20',
          progressBarActive: 'bg-amber-500',
        };
    }
  };

  const totalUnreadCount = upcomingTasks.length + systemNotifs.length;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors cursor-pointer border-0 bg-transparent outline-none relative ${
          !isNotifEnabled
            ? 'text-slate-300'
            : totalUnreadCount > 0
            ? 'text-rose-600 hover:bg-rose-50 animate-wiggle'
            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
        }`}
        title={!isNotifEnabled ? "Thông báo đã tắt" : "Thông báo & Lịch học"}
      >
        <Bell className={`w-5 h-5 ${totalUnreadCount > 0 ? "animate-wiggle" : ""}`} />

        {isNotifEnabled && totalUnreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border border-white leading-none scale-100 select-none animate-pulse">
            {totalUnreadCount}
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
              Thông báo & Lịch học
            </span>
            {totalUnreadCount > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-black text-rose-600 bg-rose-50 rounded-lg">
                Mới
              </span>
            )}
          </div>

          {upcomingTasks.length === 0 && systemNotifs.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-bold py-6 text-center">
              Không có thông báo hoặc lịch học nào mới
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {/* Cảnh báo hệ thống (System Warning Notifications) */}
              {systemNotifs.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl flex items-center justify-between gap-3 hover:bg-rose-100/50 transition-colors"
                >
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-rose-800 leading-snug">
                      {notif.title}
                    </p>
                    <p className="text-[10px] text-slate-650 font-bold mt-1 leading-normal">
                      {notif.content}
                    </p>
                  </div>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await markReadMutation.mutateAsync(notif.id);
                      } catch {}
                    }}
                    disabled={markReadMutation.isPending}
                    className="h-7 w-7 rounded-full bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-colors border-0 outline-none cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
                    title="Đánh dấu đã đọc"
                  >
                    <Check className="w-4 h-4 stroke-[3.5]" />
                  </button>
                </div>
              ))}

              {/* Lịch học sắp tới (Upcoming Tasks) */}
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
          {sortedToasts.map((toast) => {
            const styles = getToastStyles(toast.type);
            return (
              <div
                key={toast.id}
                className="w-[360px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.06)] flex items-stretch select-none relative overflow-hidden animate-in slide-in-from-right duration-300"
              >
                {/* Content Panel */}
                <div className="flex-1 flex flex-col justify-center pl-5 pr-9 py-5 text-left min-w-0">
                  <h4 className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5", styles.titleColor)}>
                    {toast.type === 'chat' 
                      ? 'Tin nhắn mới' 
                      : toast.type === 'friend' 
                      ? 'Lời mời kết bạn' 
                      : toast.type === 'group' 
                      ? 'Thông báo nhóm' 
                      : toast.type === 'error'
                      ? 'Cảnh báo hệ thống'
                      : 'Lịch học sắp diễn ra'}
                  </h4>
                  <p className="text-[15px] font-[100] text-slate-800 dark:text-white leading-tight truncate mb-0.5">
                    {toast.title}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 pr-1">
                    {toast.timeStr}
                  </p>
                </div>

                {/* Top-right Dismiss Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute top-2.5 right-2.5 h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center border-0 outline-none cursor-pointer transition-colors"
                  title="Đóng"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Bottom animated Progress Bar */}
                <div className={cn("absolute bottom-0 left-0 right-0 h-[3px] w-full", styles.progressBarBg)}>
                  <div
                    className={cn("h-full w-full", styles.progressBarActive)}
                    style={{ animation: 'toast-progress 5000ms linear forwards' }}
                  />
                </div>
              </div>
            );
          })}
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

// Chat Icon SVG
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Happy Face SVG (Success alert in friend requests/accepts)
const SuccessIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

// Sad Face SVG (System errors / Warn alerts)
const SadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

// Group Icon SVG (Group invites / announcements)
const GroupIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// Todo Icon SVG (Calendar/Todo items checklist)
const TodoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
