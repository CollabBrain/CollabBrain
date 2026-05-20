import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useConversations, useChatSocket } from '../features/chat/hooks/useChat';
import { useChatStore, selectActiveConversation } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { initSocket } from '../socket/socket';
import ChatSidebar from '../features/chat/components/ChatSidebar';
import ChatWindow from '../features/chat/components/ChatWindow';
import { APP_NAME } from '../constants';

/**
 * ChatPage — trang Chat 1-1 chính.
 *
 * Layout desktop: 2 cột (sidebar | chat window)
 * Layout mobile:  chỉ hiện sidebar hoặc chat window (không phải cả 2)
 */
const ChatPage = () => {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Khởi tạo socket khi vào trang (nếu chưa kết nối)
  useEffect(() => {
    if (accessToken) {
      initSocket(accessToken);
    }
  }, [accessToken]);

  // Đăng ký socket event handlers
  useChatSocket();

  // Load conversations
  const { isLoading } = useConversations();

  // Active conversation từ store
  const activeConversation = useChatStore(selectActiveConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  // Lấy userId của user hiện tại từ store
  // (đây là mock — thực tế nên lấy từ useProfile hoặc decode JWT)
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // Decode JWT để lấy userId
    if (!accessToken) return;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setCurrentUserId(payload.id ?? payload.sub ?? payload.userId ?? '');
    } catch {
      // JWT không hợp lệ — sẽ được xử lý bởi auth middleware
    }
  }, [accessToken]);

  // Mobile: state xác định có đang xem chat hay sidebar
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // Khi chọn conversation trên mobile → chuyển sang chat view
  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    setMobileView('chat');
  };

  // Nút back trên mobile → quay về sidebar
  const handleBackMobile = () => {
    setActiveConversation(null);
    setMobileView('sidebar');
  };

  return (
    <div
      id="chat-page"
      className="flex h-[calc(100vh-56px)] bg-background overflow-hidden"
    >
      {/* ——— Sidebar ——— */}
      <div
        className={[
          // Desktop: luôn hiện, cố định 320px
          'md:flex md:w-80 md:shrink-0 flex-col',
          // Mobile: ẩn/hiện tuỳ mobileView
          mobileView === 'sidebar' ? 'flex flex-col w-full' : 'hidden',
        ].join(' ')}
      >
        <ChatSidebarWrapper
          isLoading={isLoading}
          currentUserId={currentUserId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* ——— Chat Window ——— */}
      <div
        className={[
          'flex-1 flex flex-col overflow-hidden',
          // Mobile
          mobileView === 'chat' ? 'flex' : 'hidden md:flex',
        ].join(' ')}
      >
        {activeConversation && currentUserId ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            currentUserId={currentUserId}
            onBackMobile={handleBackMobile}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

// ——— Wrapper để inject callback vào ChatSidebar (tránh prop drilling phức tạp) ———
const ChatSidebarWrapper = ({
  isLoading,
  currentUserId,
  onSelectConversation,
}: {
  isLoading: boolean;
  currentUserId: string;
  onSelectConversation: (id: string) => void;
}) => {
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  // Override setActiveConversation để kích hoạt mobile callback
  const handleSetActive = (id: string | null) => {
    setActiveConversation(id);
    if (id) onSelectConversation(id);
  };

  // Ghi đè store action tạm thời thông qua event — thay vào đó dùng cách khác
  // Ta dùng useEffect để lắng nghe thay đổi activeConversationId
  const activeId = useChatStore((s) => s.activeConversationId);

  useEffect(() => {
    if (activeId) {
      onSelectConversation(activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return <ChatSidebar isLoading={isLoading} currentUserId={currentUserId} />;
};

// ——— Empty state khi chưa chọn conversation ———
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
      <MessageSquare className="h-10 w-10 text-primary/60" />
    </div>
    <div className="space-y-1.5">
      <h3 className="font-semibold text-lg">{APP_NAME} Chat</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tìm kiếm người dùng để bắt đầu nhắn tin.
      </p>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Tin nhắn được mã hóa đầu cuối
    </div>
  </div>
);

export default ChatPage;
