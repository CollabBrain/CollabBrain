import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useSettings } from '../hooks/useSettings';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Layers, 
  Users, 
  CheckSquare, 
  HelpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

const DocsPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('intro');
  const { data: settings } = useSettings();

  const webName = settings?.web_name || 'CollabBrain';

  const sections: DocSection[] = [
    {
      id: 'intro',
      title: 'Giới thiệu chung',
      icon: BookOpen,
      content: (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100/50">
            <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              Tổng quan về hệ thống {webName}
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              <strong>{webName}</strong> là nền tảng quản lý tài liệu học tập nhóm và cá nhân thông minh, hoạt động như một trợ lý ảo được cá nhân hóa qua từng bài học. Tận dụng sức mạnh của <strong>RAG (Retrieval-Augmented Generation)</strong> và Vector Database, hệ thống giúp người học kết nối trực tiếp với tài liệu để hỏi đáp, tạo câu hỏi trắc nghiệm, và phân công tiến độ học tập một cách trực quan, tối ưu.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-800 border-b pb-2">Các cấu phần quan trọng</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></span>
                  <span className="font-extrabold text-slate-800 text-sm">Quản Lý & Phân Tích File</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tải lên không giới hạn các định dạng PDF, Word, Excel. Hệ thống tự động phân tách văn bản thành các đoạn nhỏ (chunks) và nhúng vector thời gian thực.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><Layers className="w-5 h-5" /></span>
                  <span className="font-extrabold text-slate-800 text-sm">Bộ Thẻ Flashcard AI</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Học từ vựng, thuật ngữ và khái niệm nhanh chóng nhờ hệ thống lật thẻ lặp lại ngắt quãng (Spaced Repetition) thông minh giúp nhớ sâu lâu.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-5 h-5" /></span>
                  <span className="font-extrabold text-slate-800 text-sm">Không Gian Làm Việc Nhóm</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Trò chuyện qua WebSocket thời gian thực, tag trực tiếp AI Assistant (@AI) để truy vấn nhanh kiến thức trên tập tài liệu chung của cả nhóm.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckSquare className="w-5 h-5" /></span>
                  <span className="font-extrabold text-slate-800 text-sm">Giao Việc & Theo Dõi Tiến Độ</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tạo Task List nhóm, gán người thực hiện, đính kèm file hướng dẫn cụ thể, thiết lập hạn hoàn thành (Deadline) rõ ràng.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'docs-mgmt',
      title: 'Quản lý tài liệu',
      icon: FileText,
      content: (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Hướng dẫn chi tiết quản lý tài liệu</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Hệ thống hỗ trợ bạn lưu trữ, sắp xếp tài liệu ở hai phân vùng riêng biệt: <strong>Tài liệu cá nhân</strong> (chỉ bạn có quyền truy cập, đọc và hỏi AI) và <strong>Tài liệu nhóm</strong> (chia sẻ chung giữa các thành viên trong nhóm làm việc).
          </p>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Quy trình upload và xử lý tài liệu:</h4>
            <div className="relative pl-6 border-l border-slate-200 space-y-6">
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-[8px] text-white" />
                <h5 className="text-xs font-bold text-slate-800">Bước 1: Tải file lên hệ thống</h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Nhấn nút <strong>"Tải tài liệu lên"</strong> hoặc biểu tượng Ghim kẹp giấy trong ô Chat. Hệ thống hỗ trợ các tệp tin văn bản có định dạng: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` (Giới hạn tối đa 50MB/file). Tệp được lưu trực tiếp trên Cloud Storage của Supabase.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-[8px] text-white" />
                <h5 className="text-xs font-bold text-slate-800">Bước 2: Phân tách và lập chỉ mục ngầm (Chunking & Embedding)</h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Hệ thống tự động đọc văn bản và phân tách thành các đoạn hội thoại có ngữ nghĩa ngắn (khoảng 200 - 500 ký tự có độ chồng gối để tránh mất ngữ nghĩa giữa các trang). Sau đó, mỗi đoạn văn bản được gửi đến mô hình nhúng vector của Python Server để tính toán lưu vào DB.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-[8px] text-white" />
                <h5 className="text-xs font-bold text-slate-800">Bước 3: Xem trước và quản lý trạng thái</h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Nhấp trực tiếp vào tên file để mở trình xem trước tích hợp trực tuyến (Google Docs/Sheets Viewer). File có thể được đổi tên, xóa mềm (Soft Delete) vào Thùng rác để khôi phục hoặc xóa vĩnh viễn khỏi Cloud.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-xs text-amber-900 space-y-2">
            <h5 className="font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              Nhận biết trạng thái hoàn thành nhúng:
            </h5>
            <p className="leading-relaxed">
              * <strong>isEmbedded = false</strong>: File đang trong hàng đợi xử lý hoặc vừa tải lên. Lúc này AI chưa thể đọc được nội dung bên trong file này.
              <br />
              * <strong>isEmbedded = true</strong>: Tiến trình nhúng vector hoàn tất. AI đã nạp đầy đủ kiến thức và sẵn sàng hỗ trợ bạn giải đáp.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'ai-rag',
      title: 'Hỏi đáp cùng AI (RAG)',
      icon: MessageSquare,
      content: (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Trò chuyện thông minh cùng AI Assistant</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Hệ thống RAG đảm bảo các câu trả lời của AI luôn bám sát theo nội dung tài liệu mà bạn tải lên, giảm thiểu tối đa hiện tượng sai lệch thông tin thường thấy trên các chatbot thông thường.
          </p>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">1. Quy trình hoạt động của AI RAG:</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <span className="text-xs font-extrabold text-indigo-700 block mb-1">1. Tìm kiếm</span>
                <span className="text-[10px] text-slate-500 block leading-tight">AI tìm các đoạn văn có ý nghĩa tương đồng câu hỏi</span>
              </div>
              <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl">
                <span className="text-xs font-extrabold text-violet-700 block mb-1">2. Trích lục</span>
                <span className="text-[10px] text-slate-500 block leading-tight">Thu thập các nguồn tài liệu cụ thể làm dẫn chứng</span>
              </div>
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <span className="text-xs font-extrabold text-blue-700 block mb-1">3. Trả lời</span>
                <span className="text-[10px] text-slate-500 block leading-tight">Mô hình LLM viết câu trả lời hoàn chỉnh</span>
              </div>
            </div>

            <h4 className="font-bold text-slate-800 text-sm mt-4">2. Tính năng Chat AI nhóm thông qua WebSockets:</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Khi bạn gửi tin nhắn kèm ký tự mention <strong>@AI Assistant</strong> hoặc <strong>@AI</strong> trong khung chat nhóm:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-500 space-y-1.5">
              <li>Bot AI sẽ tự động kích hoạt trạng thái gõ chữ hiển thị thời gian thực cho cả nhóm cùng quan sát.</li>
              <li>Hệ thống tự động kiểm tra xem trong nhóm có file tài liệu văn bản nào mới tải lên đang chờ xử lý hay không. Nếu có, Bot sẽ hiển thị trạng thái chờ `AI Assistant (Đang phân tích tài liệu... (Xs))` tối đa 20 giây để lấy thông tin mới nhất.</li>
              <li>Khi sẵn sàng, Bot chuyển sang `AI Assistant (Đang suy nghĩ... (Xs))` để tổng hợp và gửi lại câu trả lời kèm <strong>📎 Nguồn tài liệu tham khảo</strong> dạng danh sách tệp đính kèm ở dưới.</li>
            </ul>
          </div>

          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 space-y-2">
            <h5 className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Cách hỏi AI hiệu quả nhất:
            </h5>
            <p className="leading-relaxed">
              Nên hỏi rõ ràng, chi tiết và có ngữ cảnh cụ thể để AI dễ dàng đối chiếu từ khóa trong cơ sở dữ liệu.
              <br />
              * <strong>Khuyên dùng</strong>: <em>"Giải thích khái niệm Class Component trong file tài liệu ReactJS.pdf hộ tôi"</em>
              <br />
              * <strong>Không nên</strong>: <em>"Tài liệu viết gì đấy?"</em> (quá chung chung)
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'flashcards',
      title: 'Flashcard Học Tập',
      icon: Layers,
      content: (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Hướng dẫn tạo và học tập với Flashcard</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Flashcard là công cụ đắc lực giúp bạn chủ động ôn tập kiến thức cốt lõi trước kỳ thi hoặc ghi nhớ từ vựng tiếng Anh.
          </p>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Các bước tạo và quản lý Deck học tập:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Tạo bộ thẻ (Deck):</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Nhấp vào <strong>"Tạo bộ thẻ mới"</strong>, nhập Tên bộ thẻ (ví dụ: Từ vựng IELTS), mô tả và chọn chủ đề học tập.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Thêm thẻ học (Cards):</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Thiết lập câu hỏi ở mặt trước thẻ (ví dụ: *"Mô tả thuật ngữ RAG"*), và câu trả lời/giải nghĩa chi tiết ở mặt sau thẻ.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Chế độ học tập (Study Mode):</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Màn hình hiển thị từng thẻ ngẫu nhiên. Click vào thẻ để kích hoạt hiệu ứng 3D lật mặt xem đáp án giải nghĩa ở mặt sau.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Đánh giá ghi nhớ (Self-assessment):</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Sau khi xem đáp án, hãy tự đánh giá độ ghi nhớ của bản thân bằng cách chọn <strong>Dễ</strong>, <strong>Trung bình</strong>, hoặc <strong>Khó</strong> để thuật toán tự động phân phối thời gian lặp lại ôn tập vào hôm sau.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'collaboration',
      title: 'Làm việc nhóm & Giao việc',
      icon: Users,
      content: (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Hướng dẫn làm việc nhóm trực tuyến</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            {webName} cung cấp một giải pháp quản lý dự án học tập nhỏ gọn nhưng đầy đủ tiện ích giúp nâng cao hiệu suất làm việc nhóm.
          </p>

          <div className="space-y-5">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-2">1. Phân quyền vai trò trong nhóm (Roles & Permissions):</h4>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <span className="font-bold text-red-700 block">Trưởng Nhóm (Owner)</span>
                  <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">Toàn quyền cấu hình nhóm, thêm/xóa thành viên, phân công công việc, xóa tài liệu.</span>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <span className="font-bold text-indigo-700 block">Thành Viên (Member)</span>
                  <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">Gửi tin nhắn chat, upload tài liệu chung, tag hỏi AI, tạo hoặc cập nhật trạng thái Task cá nhân.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-700 block">Quan sát (Viewer)</span>
                  <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">Chỉ được xem các tài liệu nhóm, đọc nội dung chat và thông tin Task, không được thao tác chỉnh sửa.</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-2">2. Hướng dẫn sử dụng bảng Todo List nhóm:</h4>
              <ul className="list-decimal pl-5 text-xs text-slate-500 space-y-2">
                <li>Vào tab <strong>"Việc cần làm" (Todo List)</strong> bên trong nhóm.</li>
                <li>Nhấn <strong>"Thêm công việc"</strong>, nhập tiêu đề công việc, mô tả chi tiết, thiết lập mức độ ưu tiên (Thấp, Trung bình, Cao) và thời hạn hoàn thành (Due date).</li>
                <li>Chọn thành viên phụ trách (Assignee) và đính kèm tài liệu hướng dẫn/biểu mẫu trực tiếp từ kho tài liệu nhóm.</li>
                <li>Mỗi thành viên khi làm việc sẽ kéo thả trạng thái công việc qua các cột: <strong>Chờ thực hiện (Pending)</strong> {"→"} <strong>Đang làm (In Progress)</strong> {"→"} <strong>Đã hoàn thành (Completed)</strong> để cả nhóm cùng theo dõi trực quan.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'support',
      title: 'Hỗ trợ & Bảo mật',
      icon: HelpCircle,
      content: (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Hỗ trợ kỹ thuật & Bảo mật thông tin</h3>
          
          <div className="space-y-4">
            <div className="p-5 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex gap-3.5 items-start">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Chính sách bảo mật tài liệu và phân vùng dữ liệu</h4>
                <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                  Hệ thống sử dụng các quy tắc bảo mật thư mục (Row-Level Security) của Supabase để cô lập dữ liệu. Tài liệu cá nhân của bạn hoàn toàn bảo mật và không bị sử dụng để huấn luyện hay rò rỉ sang các tài khoản khác. Tài liệu nhóm được phân vùng theo đúng ID nhóm, chỉ các thành viên đã tham gia nhóm mới có thể đọc và truy vấn AI.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Các câu hỏi thường gặp (FAQ):</h4>
              
              <div className="space-y-3">
                <details className="group border border-slate-100 bg-white rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-50/40">
                  <summary className="text-xs font-bold text-slate-800 list-none flex justify-between items-center">
                    Làm thế nào để biết tệp PDF tải lên đã được AI học thành công?
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-slate-50 pt-2">
                    Bạn hãy vào danh sách tài liệu. Nếu tệp tin của bạn có hiển thị tích xanh và thuộc tính <strong>isEmbedded</strong> được ghi nhận là <strong>TRUE</strong> (hoặc hiển thị biểu tượng sẵn sàng) thì AI đã hoàn thành học tệp tin đó. Bạn có thể bắt đầu đặt câu hỏi ngay lập tức.
                  </p>
                </details>

                <details className="group border border-slate-100 bg-white rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-50/40">
                  <summary className="text-xs font-bold text-slate-800 list-none flex justify-between items-center">
                    Tôi gõ câu hỏi cho AI nhưng nhận được câu trả lời thông báo lỗi kết nối hoặc "Không tìm thấy nội dung"?
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-slate-50 pt-2">
                    1. Đảm bảo rằng tài liệu bạn muốn hỏi đã được upload thành công và có trạng thái nhúng hoàn tất (isEmbedded = true).
                    <br />
                    2. Nếu bạn vừa tải file lên, vui lòng chờ vài giây để hệ thống nền phân tích. Hệ thống chat nhóm đã được tích hợp bộ tự động chờ tối đa 20 giây đối với tài liệu mới để tránh trả về câu trả lời rỗng.
                  </p>
                </details>

                <details className="group border border-slate-100 bg-white rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-50/40">
                  <summary className="text-xs font-bold text-slate-800 list-none flex justify-between items-center">
                    Quy trình xử lý file PDF scan (không có text) như thế nào?
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-slate-50 pt-2">
                    Hiện tại, hệ thống RAG chỉ hỗ trợ đọc và phân tích các tệp tin dạng văn bản (Digital Text). Đối với các file PDF được scan dạng ảnh chụp, hệ thống sẽ bỏ qua và đánh dấu hoàn tất lỗi để tránh làm nghẽn tiến trình của nhóm. Bạn nên chuyển đổi tệp tin sang dạng tài liệu văn bản thông thường trước khi tải lên.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const footerText = settings?.footer || `${webName} &copy; ${new Date().getFullYear()} &bull; Tài liệu hướng dẫn sử dụng`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-indigo-100">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 z-20 shadow-sm">
        <div className="w-full px-6 md:px-12 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(ROUTES.HOME)}
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-transparent border-0 cursor-pointer outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Trở về trang chủ
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-indigo-600 tracking-tight">{webName} Docs</span>
            <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Premium
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="w-full px-6 md:px-12 py-10 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-2 shrink-0">
          <div className="sticky top-24 bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Danh mục hướng dẫn
            </p>
            {sections.map(({ id, title, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all border-0 cursor-pointer text-left ${
                  activeSection === id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 bg-transparent'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {title}
              </button>
            ))}
          </div>
        </aside>

        {/* Right Content Pane */}
        <main className="lg:col-span-3">
          <article className="bg-white border border-slate-200/60 rounded-3xl p-8 md:p-10 shadow-sm min-h-[500px] flex flex-col justify-between">
            <div>
              {sections.find(s => s.id === activeSection)?.content}
            </div>
            
            {/* Quick action bottom bar */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <p>Tài liệu cập nhật lần cuối: 2026</p>
              <p className="flex items-center gap-1">
                Phiên bản hệ thống: <span className="text-indigo-600">v1.2.0</span>
              </p>
            </div>
          </article>
        </main>
      </div>

      {/* Footer copyright */}
      <footer 
        className="py-6 border-t border-slate-200 bg-white text-center text-xs font-semibold text-slate-400 shrink-0"
        dangerouslySetInnerHTML={{ __html: footerText }}
      />

    </div>
  );
};

export default DocsPage;
