import { useEffect, useState, useRef, useCallback } from 'react';
import { MessageSquare, Sparkles, Send, Paperclip, Mic, ArrowLeft, Plus, FileText, CheckCircle, History, Trash2, Clock, X } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { initSocket } from '../socket/socket';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { uploadPersonalDocumentApi } from '../features/group/services/document.service';
import { queryRagApi } from '../features/chat/services/chat.service';
import { useSettings } from '../hooks/useSettings';

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
            <AIAssistantWindow currentUserId={currentUserId} onBackMobile={handleBackMobile} />
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
const AIAssistantWindow = ({ currentUserId, onBackMobile }: { currentUserId: string; onBackMobile: () => void }) => {
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const webName = settings?.web_name || 'Studifier';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPdfCollapsed, setIsPdfCollapsed] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // States cho việc đính kèm tài liệu trước khi gửi
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // States quản lý trạng thái tải lịch sử chat
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [aiConvId, setAiConvId] = useState<string>('');
  const [historyChats, setHistoryChats] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const generateUUID = () => {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const showCustomAlert = (message: string, type: 'success' | 'error') => {
    setCustomAlert({ message, type });
    setTimeout(() => {
      setCustomAlert(null);
    }, 4000);
  };

  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'ai';
    content: string;
    createdAt: string;
    file?: {
      name: string;
      url: string;
      type: string;
      isUploading?: boolean;
    };
  }>>([]);

  const updateChatsList = (convId: string, currentMessages: typeof messages) => {
    if (!currentUserId || !convId || currentMessages.length === 0) return;
    const chatsKey = `ai_assistant_chats_${currentUserId}`;
    try {
      const storedChats = localStorage.getItem(chatsKey);
      let chats: Array<{ id: string; title: string; updatedAt: string }> = storedChats ? JSON.parse(storedChats) : [];
      const existingIndex = chats.findIndex(c => c.id === convId);
      
      const firstUserMsg = currentMessages.find(m => m.sender === 'user' && m.content);
      const titleText = firstUserMsg ? (firstUserMsg.content.length > 40 ? firstUserMsg.content.slice(0, 40) + '...' : firstUserMsg.content) : 'Tài liệu mới tải lên';
      
      const updatedChat = {
        id: convId,
        title: titleText,
        updatedAt: new Date().toISOString()
      };
      
      if (existingIndex > -1) {
        chats.splice(existingIndex, 1);
      }
      chats.unshift(updatedChat);
      localStorage.setItem(chatsKey, JSON.stringify(chats));
      setHistoryChats(chats);
    } catch (e) {
      console.error("Lỗi cập nhật danh sách hội thoại:", e);
    }
  };

  // 1. Tải lịch sử chat từ LocalStorage khi mount hoặc currentUserId thay đổi
  useEffect(() => {
    if (!currentUserId) return;
    const chatsKey = `ai_assistant_chats_${currentUserId}`;
    const lastActiveKey = `ai_assistant_last_active_id_${currentUserId}`;
    try {
      const storedChats = localStorage.getItem(chatsKey);
      const chats = storedChats ? JSON.parse(storedChats) : [];
      setHistoryChats(chats);

      let activeId = localStorage.getItem(lastActiveKey) || '';
      if (!activeId) {
        if (chats.length > 0) {
          activeId = chats[0].id;
        } else {
          activeId = generateUUID();
        }
        localStorage.setItem(lastActiveKey, activeId);
      }
      setAiConvId(activeId);

      const messagesKey = `ai_assistant_messages_${currentUserId}_${activeId}`;
      const storedMessages = localStorage.getItem(messagesKey);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error("Lỗi đọc lịch sử chat AI từ localStorage:", e);
    } finally {
      setIsHistoryLoaded(true);
    }
  }, [currentUserId]);

  // 2. Tự động lưu lịch sử chat vào LocalStorage mỗi khi tin nhắn thay đổi
  useEffect(() => {
    if (!currentUserId || !isHistoryLoaded || !aiConvId) return;
    const localKey = `ai_assistant_messages_${currentUserId}_${aiConvId}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(messages));
      localStorage.setItem(`ai_assistant_last_active_id_${currentUserId}`, aiConvId);
      if (messages.length > 0) {
        updateChatsList(aiConvId, messages);
      }
    } catch (e) {
      console.error("Lỗi lưu lịch sử chat AI vào localStorage:", e);
    }
  }, [messages, currentUserId, isHistoryLoaded, aiConvId]);

  const selectChatHistory = (convId: string) => {
    if (!currentUserId) return;
    setAiConvId(convId);
    const messagesKey = `ai_assistant_messages_${currentUserId}_${convId}`;
    const storedMessages = localStorage.getItem(messagesKey);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }
    setIsHistoryModalOpen(false);
  };

  const deleteChatHistory = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    const chatsKey = `ai_assistant_chats_${currentUserId}`;
    const messagesKey = `ai_assistant_messages_${currentUserId}_${convId}`;
    try {
      localStorage.removeItem(messagesKey);
      const storedChats = localStorage.getItem(chatsKey);
      let chats: Array<{ id: string; title: string; updatedAt: string }> = storedChats ? JSON.parse(storedChats) : [];
      chats = chats.filter(c => c.id !== convId);
      localStorage.setItem(chatsKey, JSON.stringify(chats));
      setHistoryChats(chats);
      
      if (aiConvId === convId) {
        const newId = generateUUID();
        setAiConvId(newId);
        setMessages([]);
        localStorage.setItem(`ai_assistant_last_active_id_${currentUserId}`, newId);
      }
      showCustomAlert("Xóa lịch sử trò chuyện thành công!", "success");
    } catch (err) {
      console.error("Lỗi xóa lịch sử hội thoại:", err);
      showCustomAlert("Xóa lịch sử thất bại!", "error");
    }
  };

  // Cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Hàm render giao diện tệp đính kèm dùng chung (mockup)
  const renderFileAttachmentBox = (
    file: { name: string; url?: string; type: string; isUploading?: boolean }, 
    onClickPreview?: () => void, 
    onRemove?: () => void
  ) => {
    const isDocx = file.type === 'DOCX' || file.name.toLowerCase().endsWith('.docx');
    const isXlsx = file.type === 'XLSX' || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    let iconBg = 'bg-[#f43f5e]'; // Màu đỏ cho PDF
    let typeLabel = 'PDF';
    if (isDocx) {
      iconBg = 'bg-[#3b82f6]'; // Màu xanh dương cho Word
      typeLabel = 'DOCX';
    } else if (isXlsx) {
      iconBg = 'bg-[#10b981]'; // Màu xanh lá cho Excel
      typeLabel = 'XLSX';
    }

    return (
      <div 
        onClick={() => {
          if (file.isUploading) return;
          if (onClickPreview) onClickPreview();
        }}
        className={`p-3 bg-slate-50/70 border border-slate-200/60 rounded-2xl flex items-center justify-between select-none relative transition-all duration-200 ${
          file.isUploading ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:border-slate-300 hover:bg-slate-100/40'
        } max-w-sm w-full`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative`}>
            {file.isUploading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">{file.name}</h4>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{typeLabel}</span>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer outline-none flex items-center justify-center shrink-0 ml-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text && !attachedFile) return;

    let uploadFailed = false;

    // 1. Gửi tệp đính kèm riêng biệt (Tin nhắn thứ nhất)
    if (attachedFile) {
      setIsUploadingFile(true);
      const tempMsgId = `upload-${Date.now()}`;
      
      // Đẩy tin nhắn tệp đính kèm (content rỗng để tách biệt với tin nhắn chữ)
      setMessages((prev) => [
        ...prev,
        {
          id: tempMsgId,
          sender: 'user' as const,
          content: '', 
          createdAt: new Date().toISOString(),
          file: {
            name: attachedFile.name,
            url: '',
            type: attachedFile.name.split('.').pop()?.toUpperCase() || 'PDF',
            isUploading: true
          }
        }
      ]);

      try {
        const res = await uploadPersonalDocumentApi(attachedFile, undefined, aiConvId);
        const doc = res.data.data;
        if (!doc) {
          throw new Error("Không nhận được dữ liệu tài liệu từ phản hồi");
        }

        showCustomAlert("Tải tài liệu thành công!", "success");

        // Cập nhật tin nhắn User chứa link file hoàn tất
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMsgId
              ? {
                  ...m,
                  file: {
                    name: doc.name,
                    url: doc.url,
                    type: doc.type,
                    isUploading: false
                  }
                }
              : m
          )
        );
      } catch (err: any) {
        console.error("Lỗi upload tài liệu:", err);
        showCustomAlert("Tải tài liệu không thành công!", "error");
        uploadFailed = true;

        // Cập nhật tin nhắn User thành lỗi
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMsgId
              ? {
                  ...m,
                  content: `❌ Gửi tài liệu **${attachedFile.name}** thất bại.`,
                  file: undefined
                }
              : m
          )
        );
      } finally {
        setIsUploadingFile(false);
        setAttachedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }

    if (uploadFailed) return;

    // 2. Gửi tin nhắn text riêng biệt (Tin nhắn thứ hai) nếu có chữ
    if (text) {
      const textMsgId = `text-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: textMsgId,
          sender: 'user' as const,
          content: text,
          createdAt: new Date().toISOString(),
        }
      ]);
    }

    setInputValue('');
    setIsTyping(true);

    // Sử dụng câu hỏi mặc định nếu chỉ gửi file
    const queryText = text || "Hãy tóm tắt nội dung chính của tài liệu này giúp tôi.";

    try {
      const res = await queryRagApi(queryText, undefined, aiConvId);
      const answerData = res.data.data;
      if (!answerData) {
        throw new Error("Không nhận được dữ liệu từ máy chủ");
      }
      
      let responseText = answerData.answer;
      if (answerData.sources && answerData.sources.length > 0) {
        const uniqueDocs = Array.from(new Set(answerData.sources.map((s: any) => s.documentName)));
        responseText += `\n\n**Nguồn tham khảo:**\n` + uniqueDocs.map((doc: string) => `* 📎 ${doc}`).join('\n');
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai' as const,
          content: responseText,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.error("Lỗi truy vấn RAG:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai' as const,
          content: "❌ Không thể kết nối với dịch vụ trợ lý AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Kiểm tra định dạng tệp tin
    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    if (ext !== 'PDF' && ext !== 'DOCX' && ext !== 'XLSX') {
      showCustomAlert("Chỉ hỗ trợ đính kèm tệp PDF, DOCX và XLSX!", "error");
      return;
    }

    setAttachedFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    if (currentUserId) {
      localStorage.removeItem(`ai_assistant_messages_${currentUserId}`);
      const newId = generateUUID();
      setAiConvId(newId);
      localStorage.setItem(`ai_assistant_conv_id_${currentUserId}`, newId);
    }
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
    <div className="flex h-full bg-slate-50/20 relative overflow-hidden w-full">
      {/* Cột trái: Khung Chat chính */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0">
        
        {/* Hộp thoại Alert Tùy Chỉnh (Custom Alert Toast) */}
        {customAlert && (
          <div 
            className={[
              'absolute top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-fade-in max-w-xs md:max-w-sm w-full transition-all duration-300',
              customAlert.type === 'success' 
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800 shadow-emerald-100/60' 
                : 'bg-rose-50/95 border-rose-200 text-rose-800 shadow-rose-100/60'
            ].join(' ')}
          >
            {customAlert.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-xs font-black tracking-tight">{customAlert.message}</span>
            <button 
              type="button" 
              onClick={() => setCustomAlert(null)}
              className={[
                'ml-auto p-1.5 rounded-lg border-0 bg-transparent cursor-pointer outline-none flex items-center justify-center transition-colors',
                customAlert.type === 'success'
                  ? 'hover:bg-emerald-100/80 text-emerald-500 hover:text-emerald-700'
                  : 'hover:bg-rose-100/80 text-rose-500 hover:text-rose-700'
              ].join(' ')}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

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

                  <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-indigo-600 bg-slate-100/70 hover:bg-indigo-50 rounded-full border border-slate-200/50 transition-all duration-200 cursor-pointer active:scale-95"
              title="Lịch sử trò chuyện"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100/70 hover:bg-indigo-50 rounded-full border border-slate-200/50 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
        </div>

        {/* Message Screen View */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            /* Trạng thái chào đón bắt đầu */
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-6 animate-fade-in py-12">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center shadow-sm">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  Hôm nay tôi có thể giúp gì cho bạn?
                </h2>
                <p className="text-sm text-slate-400 font-semibold leading-relaxed">
                  Tải lên tài liệu học tập, đặt câu hỏi hoặc tóm tắt các tệp tài liệu của bạn.
                </p>
              </div>

              {/* Thẻ gợi ý nhanh */}
              <div className="grid grid-cols-1 gap-2.5 w-full pt-4">
                {[
                  'Giải thích sự khác biệt giữa Nguyên phân và Giảm phân',
                  'Tạo một bài kiểm tra trắc nghiệm từ tài liệu của tôi',
                  'Tóm tắt tài liệu Hướng dẫn học tập NodeJS',
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
                    {isUser && msg.file && !msg.content ? (
                      /* Nếu là tin nhắn chỉ chứa file của user: hiển thị box tài liệu trần như mockup */
                      <div className="max-w-[85%] select-none">
                        {renderFileAttachmentBox(
                          msg.file,
                          () => {
                            if (msg.file?.type === 'PDF' || msg.file?.name.toLowerCase().endsWith('.pdf')) {
                              setPreviewPdfUrl(msg.file.url);
                              setIsPdfCollapsed(false);
                            } else {
                              window.open(
                                `https://docs.google.com/gview?url=${encodeURIComponent(msg.file?.url || '')}&embedded=true`,
                                '_blank'
                              );
                            }
                          }
                        )}
                      </div>
                    ) : (
                      /* Tin nhắn có text hoặc của AI */
                      <div
                        className={[
                          'max-w-[85%] rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] leading-relaxed relative',
                          isUser
                            ? 'bg-indigo-600 text-white rounded-tr-sm text-sm font-semibold'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm',
                        ].join(' ')}
                      >
                        {msg.content && (
                          isUser ? <p className="font-medium">{msg.content}</p> : renderMessageContent(msg.content)
                        )}
                        
                        {msg.file && (
                          <div className={msg.content ? "mt-3 pt-3 border-t border-slate-100/60 flex flex-col gap-2.5" : "flex flex-col gap-2.5"}>
                            {renderFileAttachmentBox(
                              msg.file,
                              () => {
                                if (msg.file?.type === 'PDF' || msg.file?.name.toLowerCase().endsWith('.pdf')) {
                                  setPreviewPdfUrl(msg.file.url);
                                  setIsPdfCollapsed(false);
                                } else {
                                  window.open(
                                    `https://docs.google.com/gview?url=${encodeURIComponent(msg.file?.url || '')}&embedded=true`,
                                    '_blank'
                                  );
                                }
                              }
                            )}
                          </div>
                        )}
                      </div>
                    )}

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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.docx,.xlsx"
            />

            {/* Khối hiển thị file chờ gửi (attachedFile) theo mockup */}
            {attachedFile && (
              <div className="mx-1 mt-1">
                {renderFileAttachmentBox(
                  {
                    name: attachedFile.name,
                    type: attachedFile.name.split('.').pop()?.toUpperCase() || 'PDF',
                    isUploading: isUploadingFile
                  },
                  () => {
                    // Xem trước file PDF cục bộ
                    if (attachedFile.name.toLowerCase().endsWith('.pdf')) {
                      const localUrl = URL.createObjectURL(attachedFile);
                      setPreviewPdfUrl(localUrl);
                      setIsPdfCollapsed(false);
                    } else {
                      showCustomAlert("Chỉ có thể xem trước trực tiếp file PDF cục bộ.", "error");
                    }
                  },
                  handleRemoveAttachedFile
                )}
              </div>
            )}

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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className={`p-2 rounded-xl transition-all cursor-pointer border-0 bg-transparent outline-none ${
                    isUploadingFile 
                      ? 'text-slate-300 cursor-wait' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
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
                disabled={!inputValue.trim() && !attachedFile}
                className={[
                  'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 border-0 outline-none cursor-pointer',
                  (inputValue.trim() || attachedFile)
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
          {/* Lớp phủ xem trước PDF chiếm toàn bộ chiều rộng phần chat */}
          {previewPdfUrl && !isPdfCollapsed && (
            <div className="absolute inset-0 bg-white z-40 flex flex-col animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Xem trước tài liệu PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Minimize button */}
                  <button
                    type="button"
                    title="Thu nhỏ thành nút nổi"
                    onClick={() => setIsPdfCollapsed(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-all border-0 cursor-pointer outline-none flex items-center gap-1 active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    Thu nhỏ
                  </button>
                  {/* Close button */}
                  <button
                    type="button"
                    title="Đóng xem trước"
                    onClick={() => setPreviewPdfUrl(null)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 border-0 bg-transparent cursor-pointer outline-none transition-colors flex items-center justify-center active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* PDF Preview Iframe */}
              <div className="flex-1 bg-slate-100">
                <iframe 
                  src={previewPdfUrl} 
                  className="w-full h-full border-0" 
                  title="PDF Preview"
                />
              </div>
            </div>
          )}

          {/* Nút nổi mở lại PDF khi đang thu nhỏ */}
          {previewPdfUrl && isPdfCollapsed && (
            <button
              type="button"
              title="Mở lại xem trước PDF"
              onClick={() => setIsPdfCollapsed(false)}
              className="absolute bottom-24 right-6 h-12 w-12 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 active:scale-95 flex items-center justify-center z-35 cursor-pointer border-0 outline-none transition-all duration-200 animate-bounce"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Modal Lịch sử Trò chuyện */}
      {isHistoryModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full max-h-[70vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-800">Lịch sử Trò chuyện AI</h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {historyChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <Clock className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">Chưa có lịch sử trò chuyện nào</p>
                </div>
              ) : (
                historyChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => selectChatHistory(chat.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      aiConvId === chat.id
                        ? 'bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        aiConvId === chat.id ? 'bg-indigo-100/50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-bold truncate ${
                          aiConvId === chat.id ? 'text-indigo-900' : 'text-slate-700'
                        }`}>
                          {chat.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          {new Date(chat.updatedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => deleteChatHistory(chat.id, e)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border-0 bg-transparent ml-2 shrink-0 cursor-pointer"
                      title="Xóa lịch sử"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * EmptyState khi chưa mở bất cứ hội thoại nào
 */
const EmptyState = () => {
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const { data: settings } = useSettings();
  const webName = settings?.web_name || 'Studifier';
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 py-12 max-w-sm mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
        <MessageSquare className="h-8 w-8 text-indigo-600" />
      </div>
      <div className="space-y-2">
        <h3 className="font-black text-slate-800 text-lg">{webName} AI Workspace</h3>
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
