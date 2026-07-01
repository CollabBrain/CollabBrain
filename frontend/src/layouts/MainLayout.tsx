import { useState, memo, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, User, Users, UserCircle, Settings, LogOut, Menu, X, CheckSquare, Layers } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useChatStore } from '../store/useChatStore';
import { ROUTES } from '../constants';
import { cn } from '../lib/utils';
import { CallOverlay } from '../features/chat/components/CallOverlay';
import { useCallStore } from '../store/useCallStore';
import { getSocket, initSocket, disconnectSocket } from '../socket/socket';
import { useSettings } from '../hooks/useSettings';
import { NotificationBell } from '../components/NotificationBell';
import { useChatSocket, useConversations } from '../features/chat/hooks/useChat';
import { useFriendRequests } from '../hooks/useFriends';
import { useGroupInvitations } from '../features/group/services/group.service';
import { useQueryClient } from '@tanstack/react-query';
import { useGroupChatStore } from '../store/useGroupChatStore';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

// ——— Nav items config ———
const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.CHAT, label: 'Chat', icon: MessageSquare },
  { to: ROUTES.DOCUMENTS, label: 'My Documents', icon: FileText },
  { to: '/flashcard', label: 'Flashcard', icon: Layers },
  { to: '/todos', label: 'Todo List', icon: CheckSquare },
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
  webName?: string;
  chatUnreadCount: number;
  friendRequestsCount: number;
  groupInvitationsCount: number;
}

const SidebarContent = memo(({
  pathname,
  userAvatar,
  userName,
  userTier,
  onNavClick,
  onLogout,
  webName,
  chatUnreadCount,
  friendRequestsCount,
  groupInvitationsCount,
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
            {webName || 'Studifier'}
          </Link>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">
            AI LEARNING
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            const isChat = to === ROUTES.CHAT;
            const isFriends = to === '/friends';
            const isGroups = to === '/groups';

            let badgeCount = 0;
            if (isChat) badgeCount = chatUnreadCount;
            if (isFriends) badgeCount = friendRequestsCount;
            if (isGroups) badgeCount = groupInvitationsCount;

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
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
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
          <NotificationBell />
          <Link
            to={ROUTES.SETTINGS}
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
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { setIncomingCall, status } = useCallStore();

  const handleLogout = () => {
    logout();
    window.location.replace(ROUTES.LOGIN);
  };

  const closeMobile = () => setIsMobileOpen(false);

  // Initialize and clean up socket connection globally
  useEffect(() => {
    if (accessToken) {
      initSocket(accessToken);
    } else {
      disconnectSocket();
    }
  }, [accessToken]);

  // Setup global chat socket listener
  useChatSocket();
  useConversations();

  // Fetch notification settings
  const { data: notifSettings } = useNotificationSettings();
  const isNotifEnabled = notifSettings?.enableAll !== false;
  const isChatEnabled = notifSettings?.enableChat !== false;
  const isFriendEnabled = notifSettings?.enableFriend !== false;
  const isGroupEnabled = notifSettings?.enableGroup !== false;

  // Fetch real-time count of friend requests and group invitations
  const { data: friendRequests = [] } = useFriendRequests('received');
  const { data: groupInvitations = [] } = useGroupInvitations();
  const unreadGroupMessagesCount = useGroupChatStore((s) => s.totalUnreadCount);
  const totalUnread = useChatStore((s) => s.totalUnreadCount);

  // Clear unread count for group when viewing its chat
  useEffect(() => {
    const pathMatch = pathname.match(/^\/groups\/([^/]+)/);
    if (pathMatch) {
      const activeGroupId = pathMatch[1];
      useGroupChatStore.getState().clearUnread(activeGroupId);
    }
  }, [pathname]);

  // Listen to other real-time notifications via socket
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewFriendRequest = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'received'] });
      if (isNotifEnabled && isFriendEnabled) {
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: {
            title: 'Hệ thống Bạn bè',
            message: data?.message || 'Bạn có một lời mời kết bạn mới',
            type: 'friend'
          }
        }));
      }
    };

    const handleAcceptFriendRequest = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      if (isNotifEnabled && isFriendEnabled) {
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: {
            title: 'Hệ thống Bạn bè',
            message: data?.message || 'Lời mời kết bạn đã được chấp nhận',
            type: 'friend'
          }
        }));
      }
    };

    const handleNewGroupInvitation = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
      if (isNotifEnabled && isGroupEnabled) {
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: {
            title: 'Hệ thống Nhóm',
            message: data?.message || 'Bạn có một lời mời vào nhóm mới',
            type: 'group'
          }
        }));
      }
    };

    const handleNewGroupJoinRequest = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] });
      if (isNotifEnabled && isGroupEnabled) {
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: {
            title: 'Hệ thống Nhóm',
            message: data?.message || 'Có yêu cầu tham gia nhóm mới',
            type: 'group'
          }
        }));
      }
    };

    const handleGroupNewMessage = ({ groupId, message }: { groupId: string; message: any }) => {
      const pathMatch = window.location.pathname.match(/^\/groups\/([^/]+)/);
      const activeGroupId = pathMatch ? pathMatch[1] : null;

      let myId = '';
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        myId = payload.id ?? payload.sub ?? payload.userId ?? '';
      } catch {}

      const isFromMe = message.senderId === myId;
      if (groupId !== activeGroupId && !isFromMe) {
        useGroupChatStore.getState().incrementUnread(groupId);

        if (isNotifEnabled && isGroupEnabled) {
          const senderName = message.sender?.name || 'Ai đó';
          const preview = message.content.length > 50 
            ? message.content.slice(0, 50) + '...' 
            : message.content;
          window.dispatchEvent(new CustomEvent('app-notification', {
            detail: {
              title: senderName,
              message: `[Nhóm] ${preview}`,
              type: 'group'
            }
          }));
        }
      }
    };

    const handleChatNewMessage = ({ message }: { message: any }) => {
      console.log('[Socket MainLayout] Received message:', message.id, 'content:', message.content);
      const pathMatch = window.location.pathname.match(/^\/chat\/([^/]+)/);
      const activeConvId = pathMatch ? pathMatch[1] : null;

      let myId = '';
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        myId = payload.id ?? payload.sub ?? payload.userId ?? '';
      } catch {}

      const isFromMe = message.senderId === myId;
      if (message.conversationId !== activeConvId && !isFromMe) {
        // Trigger notification
        if (isNotifEnabled && isChatEnabled) {
          const senderName = message.sender?.name || 'Tin nhắn riêng';
          const preview = message.content.length > 50 
            ? message.content.slice(0, 50) + '...' 
            : message.content;
          window.dispatchEvent(new CustomEvent('app-notification', {
            detail: {
              title: senderName,
              message: preview,
              type: 'chat'
            }
          }));
        }
      }
    };

    const handleNewSystemNotification = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (isNotifEnabled) {
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: {
            title: data.title || 'Cảnh báo hệ thống',
            message: data.content || 'Bạn nhận được cảnh báo vi phạm mới.',
            type: 'error'
          }
        }));
      }
    };

    socket.on('new_request_friend', handleNewFriendRequest);
    socket.on('accept_friend_request', handleAcceptFriendRequest);
    socket.on('new_group_invitation', handleNewGroupInvitation);
    socket.on('new_group_join_request', handleNewGroupJoinRequest);
    socket.on('group:new_message', handleGroupNewMessage);
    socket.on('chat:new_message', handleChatNewMessage);
    socket.on('notification:new', handleNewSystemNotification);

    return () => {
      socket.off('new_request_friend', handleNewFriendRequest);
      socket.off('accept_friend_request', handleAcceptFriendRequest);
      socket.off('new_group_invitation', handleNewGroupInvitation);
      socket.off('new_group_join_request', handleNewGroupJoinRequest);
      socket.off('group:new_message', handleGroupNewMessage);
      socket.off('chat:new_message', handleChatNewMessage);
      socket.off('notification:new', handleNewSystemNotification);
    };
  }, [accessToken, queryClient, isNotifEnabled, isChatEnabled, isFriendEnabled, isGroupEnabled]);

  // ——— Lắng nghe cuộc gọi đến từ bất kỳ trang nào ———
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = (data: {
      callerId: string;
      callType: 'audio' | 'video';
      callerInfo: { name: string; avatarUrl?: string | null };
    }) => {
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

  const { data: settings } = useSettings();
  const webName = settings?.web_name || 'Studifier';

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
    webName,
    chatUnreadCount: isNotifEnabled && isChatEnabled ? totalUnread : 0,
    friendRequestsCount: isNotifEnabled && isFriendEnabled ? friendRequests.length : 0,
    groupInvitationsCount: isNotifEnabled && isGroupEnabled ? (groupInvitations.length + unreadGroupMessagesCount) : 0,
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* CallOverlay — toàn cục, nằm trên tất cả nội dung */}
      <CallOverlay />
      {/* Mobile Navbar Header */}
      <header className="md:hidden shrink-0 h-16 border-b bg-white flex items-center justify-between px-6 z-40">
        <div className="flex flex-col">
          <span className="text-xl font-black text-indigo-600 tracking-tight">{webName}</span>
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
        ) : pathname.startsWith('/flashcard') ? (
          // Flashcard pages: full width
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
