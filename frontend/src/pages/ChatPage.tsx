import { useEffect, useState, useRef, useCallback } from 'react';
import { MessageSquare, Sparkles, Send, Paperclip, Mic, ArrowLeft, Plus, FileText, CheckCircle } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { initSocket } from '../socket/socket';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Lazy imports to isolate crashes
import ChatSidebar from '../features/chat/components/ChatSidebar';
import ChatWindow from '../features/chat/components/ChatWindow';

import { getConversationsApi } from '../features/chat/services/chat.service';
import { getSocket } from '../socket/socket';
import { useChatSocket } from '../features/chat/hooks/useChat';
import type { Conversation, SocketNewMessage, SocketTypingEvent, SocketOnlineStatus } from '../types/chat.types';

/**
 * ChatPage — Trang Chat chính.
 * Tích hợp Trợ lý AI (AIAssistantWindow) tương tác tuyệt đẹp dựa theo Mockup 2
 * cùng với các đoạn chat 1-1 thông thường.
 */
const ChatPage = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // Subscribe to ONLY primitive values from store
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  // Track activeConversation via local state to avoid selector-on-array re-render loops
  const [activeConversation, setActiveConvLocal] = useState<Conversation | undefined>(undefined);

  useEffect(() => {
    if (!activeConversationId || activeConversationId === 'ai-assistant') {
      setActiveConvLocal(undefined);
      return;
    }
    // Get current conversation from store snapshot
    const conv = useChatStore.getState().conversations.find(c => c.id === activeConversationId);
    setActiveConvLocal(conv);

    // Also subscribe so we pick up new data (e.g. after API fetch)
    const unsub = useChatStore.subscribe((state) => {
      const updated = state.conversations.find(c => c.id === activeConversationId);
      setActiveConvLocal(prev => {
        if (!updated && !prev) return prev;
        if (!updated || !prev) return updated;
        if (prev.id === updated.id && prev.updatedAt === updated.updatedAt && prev.unreadCount === updated.unreadCount) return prev;
        return updated;
      });
    });
    return unsub;
  }, [activeConversationId]);

  // Parse userId from JWT (once)
  useEffect(() => {
    if (!accessToken) return;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setCurrentUserId(payload.id ?? payload.sub ?? payload.userId ?? '');
    } catch {
      // Ignore JWT errors
    }
  }, [accessToken]);

  // Init socket (once)
  useEffect(() => {
    if (accessToken) initSocket(accessToken);
  }, [accessToken]);

  // Load conversations (once, via direct API call — no useQuery to avoid re-fetch loops)
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!accessToken || loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const res = await getConversationsApi();
        const convs = res.data.data?.conversations ?? [];
        useChatStore.getState().setConversations(convs);
      } catch (err) {
        console.warn('[ChatPage] load conversations failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  // Register all chat socket events (handles initial_online, typing, new_message, recall, pin, etc.)
  useChatSocket();

  // Switch mobile view when conversation is selected
  useEffect(() => {
    if (activeConversationId) setMobileView('chat');
  }, [activeConversationId]);

  const handleBackMobile = useCallback(() => {
    setActiveConversation(null);
    setMobileView('sidebar');
  }, [setActiveConversation]);

  const isAIAssistant = activeConversationId === 'ai-assistant';


  return (
    <div
      id="chat-page"
      className="flex h-[calc(100vh-64px)] md:h-screen bg-white overflow-hidden font-sans"
    >
      {/* ——— Sidebar ——— */}
      <div
        className={[
          'md:flex md:w-80 md:shrink-0 flex-col border-r border-slate-100',
          mobileView === 'sidebar' ? 'flex flex-col w-full' : 'hidden',
        ].join(' ')}
      >
        <ErrorBoundary fallbackLabel="Lỗi hiển thị sidebar">
          <ChatSidebar isLoading={isLoading} currentUserId={currentUserId} />
        </ErrorBoundary>
      </div>

      {/* ——— Chat Workspace ——— */}
      <div
        className={[
          'flex-1 flex flex-col overflow-hidden bg-slate-50/20',
          mobileView === 'chat' ? 'flex' : 'hidden md:flex',
        ].join(' ')}
      >
        <ErrorBoundary fallbackLabel="Lỗi hiển thị cửa sổ chat">
          {isAIAssistant ? (
            <AIAssistantWindow onBackMobile={handleBackMobile} />
          ) : activeConversation && currentUserId ? (
            <ChatWindow
              key={activeConversation.id}
              conversation={activeConversation}
              currentUserId={currentUserId}
              onBackMobile={handleBackMobile}
            />
          ) : (
            <EmptyState />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

/**
 * AIAssistantWindow — Trợ lý AI tương tác đỉnh cao (Mockup 2)
 */
const AIAssistantWindow = ({ onBackMobile }: { onBackMobile: () => void }) => {
  const { data: profile } = useProfile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'ai';
    content: string;
    createdAt: string;
  }>>([
    {
      id: 'm1',
      sender: 'user',
      content: 'Can you explain the main differences between mitosis and meiosis? Make it simple enough for a high school biology review.',
      createdAt: new Date(Date.now() - 1000 * 60).toISOString(),
    },
    {
      id: 'm2',
      sender: 'ai',
      content: `Certainly! Here's a simple breakdown of the main differences between mitosis and meiosis for your high school biology review.

**1. Purpose**
* **Mitosis**: Growth, repair, and replacement of cells. It makes identical copies of your body cells (like skin or muscle).
* **Meiosis**: Reproduction. It creates sex cells (sperm and egg) for sexual reproduction.

**2. Number of Cell Divisions**
* **Mitosis**: Only one round of division.
* **Meiosis**: Two rounds of division (Meiosis I and Meiosis II).

In short, mitosis makes clones for growth, while meiosis makes unique cells.`,
      createdAt: new Date().toISOString(),
    }
  ]);

  // Cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    const newMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    // Phản hồi giả lập thông minh
    setTimeout(() => {
      setIsTyping(false);
      let reply = "Đó là một câu hỏi rất hay! Dựa vào các tài liệu bạn đã tải lên, tôi khuyên bạn nên tập trung vào các điểm cốt lõi này...";
      
      const lower = text.toLowerCase();
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('xin chào')) {
        reply = `Xin chào ${profile?.name || 'bạn'}! Tôi là Trợ lý học tập AI của Studifier. Hôm nay tôi có thể hỗ trợ gì cho bạn? Bạn có thể gửi tài liệu học tập hoặc đặt bất cứ câu hỏi nào cho tôi.`;
      } else if (lower.includes('quiz') || lower.includes('trắc nghiệm') || lower.includes('kiểm tra')) {
        reply = `Tuyệt vời! Chúng ta hãy làm một câu hỏi trắc nghiệm Sinh học nhanh nhé:

**Sự khác biệt chính về kết quả tế bào giữa Nguyên phân (Mitosis) và Giảm phân (Meiosis) là gì?**
* **A)** Nguyên phân tạo 4 tế bào độc nhất, Giảm phân tạo 2 tế bào giống hệt.
* **B)** Nguyên phân tạo 2 tế bào lưỡng bội (diploid) giống hệt nhau, Giảm phân tạo 4 tế bào giao tử đơn bội (haploid) độc nhất.
* **C)** Nguyên phân chỉ xảy ra ở thực vật, Giảm phân chỉ xảy ra ở động vật.

*Nhập đáp án A, B hoặc C của bạn bên dưới nhé!*`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai' as const,
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
  };

  // Hàm render nội dung chat Sinh học đẹp mắt khớp thiết kế
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // 1. Render tiêu đề chỉ mục (1. Purpose, 2. Number of Cell Divisions)
      if (line.match(/^\*\*?\d+\.\s+\w+/)) {
        const cleanTitle = line.replace(/\*\*/g, '');
        return (
          <h4 key={idx} className="text-base font-extrabold text-indigo-600 mt-4 mb-2 first:mt-0 leading-tight">
            {cleanTitle}
          </h4>
        );
      }
      
      // 2. Render dòng mô tả chi tiết của nguyên phân / giảm phân
      if (line.startsWith('* **Mitosis**') || line.startsWith('* **Meiosis**')) {
        const isMitosis = line.includes('Mitosis');
        const cleanContent = line.replace(/^\*\s+\*\*Mitosis\*\*:\s*/, '').replace(/^\*\s+\*\*Meiosis\*\*:\s*/, '');
        return (
          <p key={idx} className="text-sm text-slate-600 mb-2 leading-relaxed">
            <span className="font-extrabold text-slate-800">{isMitosis ? 'Mitosis' : 'Meiosis'}:</span> {cleanContent}
          </p>
        );
      }

      // 3. Xử lý các dòng in đậm tiêu chuẩn
      if (line.match(/^\*\*.*\*\*$/)) {
        const boldText = line.replace(/\*\*/g, '');
        return (
          <p key={idx} className="text-sm font-bold text-slate-800 mt-3 mb-1">
            {boldText}
          </p>
        );
      }

      // Dòng trống
      if (!line.trim()) return <div key={idx} className="h-2" />;

      // Text thông thường
      return (
        <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-2 font-medium">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    });
  };

  const userAvatar = profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
  const userName = profile?.name || 'User';

  return (
    <div className="flex flex-col h-full bg-slate-50/20 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 border-0 bg-transparent"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </div>

          <div>
            <h3 className="font-extrabold text-sm text-slate-800 leading-none">AI Assistant</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Ready to help you study</p>
          </div>
        </div>

        <button
          onClick={startNewChat}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100/70 hover:bg-indigo-50 rounded-full border border-slate-200/50 transition-all duration-200 cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      {/* Message Screen View */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          /* Trạng thái chào đón bắt đầu (Startup Greeting State) */
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-6 animate-fade-in py-12">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center shadow-sm">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-sm text-slate-400 font-semibold leading-relaxed">
                Upload documents, ask questions, or practice for your upcoming exams.
              </p>
            </div>

            {/* Thẻ gợi ý nhanh */}
            <div className="grid grid-cols-1 gap-2.5 w-full pt-4">
              {[
                'Explain differences between Mitosis and Meiosis',
                'Generate a study quiz from my documents',
                'Summarize the Advanced Machine Learning PDF',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInputValue(suggestion); }}
                  className="w-full text-left px-5 py-3 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-white border border-slate-100 rounded-2xl hover:bg-indigo-50/20 transition-all duration-200 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Danh sách bong bóng tin nhắn */
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar AI bên trái */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 shrink-0 flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}

                  {/* Bubble content */}
                  <div
                    className={[
                      'max-w-[85%] rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] leading-relaxed relative',
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm text-sm font-semibold'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm',
                    ].join(' ')}
                  >
                    {isUser ? <p className="font-medium">{msg.content}</p> : renderMessageContent(msg.content)}
                  </div>

                  {/* Avatar Người dùng bên phải */}
                  {isUser && (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 shadow-sm"
                    />
                  )}
                </div>
              );
            })}

            {/* Chỉ báo AI đang soạn tin */}
            {isTyping && (
              <div className="flex gap-4 items-start justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 shrink-0 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-sm p-4 flex items-center gap-1 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input panel ở dưới */}
      <div className="p-4 shrink-0 bg-transparent">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="max-w-3xl mx-auto w-full bg-white border border-slate-100 rounded-[28px] p-3.5 flex flex-col gap-3 shadow-[0_12px_36px_rgba(99,102,241,0.04)]"
        >
          {/* Text Area input */}
          <textarea
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }
            }}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything or paste your study material..."
            className="w-full bg-transparent resize-none focus:outline-none text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed py-1 px-2.5 max-h-[120px]"
          />

          {/* Footer controls row */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-3 px-1 select-none">
            {/* Left attachment buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                title="Đính kèm tài liệu"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border-0 bg-transparent outline-none"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>
              
              <button
                type="button"
                title="Ghi âm giọng nói"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border-0 bg-transparent outline-none"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>

              <div className="w-px h-5 bg-slate-100 mx-1" />

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold text-slate-500 hover:text-indigo-600 bg-slate-50/50 hover:bg-indigo-50/50 rounded-xl transition-all cursor-pointer border-0 outline-none"
              >
                <FileText className="w-3.5 h-3.5" />
                Search Docs
              </button>
            </div>

            {/* Right send button */}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={[
                'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 border-0 outline-none cursor-pointer',
                inputValue.trim()
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              ].join(' ')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <p className="text-center text-[10px] text-slate-400 font-semibold mt-2.5">
          AI Assistant can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
};

/**
 * EmptyState khi chưa mở bất cứ hội thoại nào
 */
const EmptyState = () => {
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 py-12 max-w-sm mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
        <MessageSquare className="h-8 w-8 text-indigo-600" />
      </div>
      <div className="space-y-2">
        <h3 className="font-black text-slate-800 text-lg">Studifier AI Workspace</h3>
        <p className="text-xs text-slate-400 font-semibold leading-relaxed">
          Chọn cuộc trò chuyện Trợ lý AI ở trên cùng hoặc mở một cuộc trò chuyện nhóm học tập để bắt đầu nhắn tin.
        </p>
      </div>
      <button
        onClick={() => setActiveConversation('ai-assistant')}
        className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer border-0 outline-none active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Mở Trợ lý AI học tập
      </button>
    </div>
  );
};

export default ChatPage;
