import { useState } from "react";
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  parseTodoAttachments,
} from "../hooks/useTodos";
import type { TodoItem, TodoAttachment } from "../hooks/useTodos";
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  ListTodo,
  AlertCircle,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Paperclip,
  Link2,
  UploadCloud,
  FolderOpen,
  FileText
} from "lucide-react";
import {
  getPersonalDocumentsApi,
  uploadPersonalDocumentApi,
} from "../features/group/services/document.service";

export const TodoListPage = () => {
  const { data: todos = [], isLoading } = useTodos();
  const createTodoMutation = useCreateTodo();
  const updateTodoMutation = useUpdateTodo();
  const deleteTodoMutation = useDeleteTodo();

  // View Mode: 'list' or 'schedule'
  const [viewMode, setViewMode] = useState<"list" | "schedule">("list");
  // Selected date for schedule grid view
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // State controls for creation
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newIsNotify, setNewIsNotify] = useState(false);
  const [newAttachments, setNewAttachments] = useState<TodoAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Selector from personal documents states
  const [personalDocs, setPersonalDocs] = useState<any[]>([]);
  const [showPersonalSelect, setShowPersonalSelect] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // External link states
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "overdue">("all");
  
  // Edit Modal State
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editIsNotify, setEditIsNotify] = useState(false);
  const [editIsCompleted, setEditIsCompleted] = useState(false);
  const [editAttachments, setEditAttachments] = useState<TodoAttachment[]>([]);
  const [editUploading, setEditUploading] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editShowPersonalSelect, setEditShowPersonalSelect] = useState(false);
  const [editShowLinkInput, setEditShowLinkInput] = useState(false);
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [editLinkName, setEditLinkName] = useState("");

  // Accordion details list state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchPersonalDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await getPersonalDocumentsApi({ page: 1, limit: 100 });
      const docs = res.data?.data?.data || [];
      setPersonalDocs(docs);
    } catch (err) {
      console.error("Lỗi khi tải tài liệu cá nhân:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      alert("Dung lượng file không được vượt quá 30MB");
      return;
    }

    if (isEdit) {
      setEditUploading(true);
      setEditUploadProgress(0);
    } else {
      setUploading(true);
      setUploadProgress(0);
    }

    try {
      const res = await uploadPersonalDocumentApi(file, (progress) => {
        if (isEdit) {
          setEditUploadProgress(progress);
        } else {
          setUploadProgress(progress);
        }
      });
      const uploadedDoc = res.data?.data;
      if (uploadedDoc) {
        const newAtt: TodoAttachment = { name: uploadedDoc.name, url: uploadedDoc.url };
        if (isEdit) {
          setEditAttachments((prev) => [...prev, newAtt]);
        } else {
          setNewAttachments((prev) => [...prev, newAtt]);
        }
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Tải file lên thất bại");
    } finally {
      if (isEdit) {
        setEditUploading(false);
        setEditUploadProgress(0);
      } else {
        setUploading(false);
        setUploadProgress(0);
      }
    }
    // Reset file input
    e.target.value = "";
  };

  const removeAttachment = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditAttachments((prev) => prev.filter((_, i) => i !== index));
    } else {
      setNewAttachments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createTodoMutation.mutateAsync({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        isNotify: newIsNotify,
        attachments: newAttachments.length > 0 ? JSON.stringify(newAttachments) : null
      });
      // Clear inputs
      setNewTitle("");
      setNewDesc("");
      setNewDueDate("");
      setNewIsNotify(false);
      setNewAttachments([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (todo: TodoItem) => {
    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        isCompleted: !todo.isCompleted
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) return;
    try {
      await deleteTodoMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDesc(todo.description || "");
    setEditIsNotify(todo.isNotify);
    setEditIsCompleted(todo.isCompleted);
    setEditAttachments(parseTodoAttachments(todo.attachments));
    setEditShowPersonalSelect(false);
    setEditShowLinkInput(false);
    setEditLinkUrl("");
    setEditLinkName("");
    // Format date string for datetime-local input (YYYY-MM-DDTHH:mm)
    if (todo.dueDate) {
      const date = new Date(todo.dueDate);
      const localString = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setEditDueDate(localString);
    } else {
      setEditDueDate("");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editTitle.trim()) return;

    try {
      await updateTodoMutation.mutateAsync({
        id: editingTodo.id,
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
        isNotify: editIsNotify,
        isCompleted: editIsCompleted,
        attachments: editAttachments.length > 0 ? JSON.stringify(editAttachments) : null
      });
      setEditingTodo(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Check if a task is overdue
  const isOverdue = (todo: TodoItem) => {
    if (todo.isCompleted || !todo.dueDate) return false;
    return new Date(todo.dueDate) < new Date();
  };

  // Helper: check if two dates are the same day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Filter and Search logic
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "active") return !todo.isCompleted;
    if (activeTab === "completed") return todo.isCompleted;
    if (activeTab === "overdue") return isOverdue(todo);
    return true; // all
  });

  // Calculate statistics
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const activeCount = totalCount - completedCount;
  const overdueCount = todos.filter(isOverdue).length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Schedule View hourly slot definitions (from 7 AM to 10 PM)
  const hourlySlots = Array.from({ length: 16 }, (_, i) => i + 7);

  const getTodosForHour = (hour: number) => {
    return filteredTodos.filter((todo) => {
      if (!todo.dueDate) return false;
      const todoDate = new Date(todo.dueDate);
      return isSameDay(todoDate, selectedDate) && todoDate.getHours() === hour;
    });
  };

  // Handle clicking on an empty hour slot to pre-fill the form
  const handleHourSlotClick = (hour: number) => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(hour, 0, 0, 0);
    // Format to datetime-local local string format (YYYY-MM-DDTHH:mm)
    const localString = new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setNewDueDate(localString);
    
    // Smooth scroll to form card on mobile
    const formEl = document.getElementById("add-todo-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navigateDate = (days: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(nextDate);
  };

  const formatSelectedDate = (date: Date) => {
    const today = new Date();
    if (isSameDay(date, today)) return "Hôm nay, " + date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    return date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Reusable attachment picker component renderer
  const renderAttachmentPicker = (
    attachments: TodoAttachment[],
    onRemove: (index: number) => void,
    isEdit: boolean
  ) => {
    const currentShowPersonal = isEdit ? editShowPersonalSelect : showPersonalSelect;
    const currentShowLink = isEdit ? editShowLinkInput : showLinkInput;
    const currentLinkUrl = isEdit ? editLinkUrl : linkUrl;
    const currentLinkName = isEdit ? editLinkName : linkName;
    const currentUploading = isEdit ? editUploading : uploading;
    const currentUploadProgress = isEdit ? editUploadProgress : uploadProgress;

    return (
      <div className="space-y-2 border-t border-slate-50 pt-3 text-left">
        <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block pl-0.5">
          Tài liệu / Liên kết đính kèm
        </label>

        {/* Attached items tags */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50/40 border border-indigo-150/60 rounded-xl group/att max-w-[200px]"
              >
                {att.url.startsWith("http") && !att.url.includes("supabase") ? (
                  <Link2 className="w-3 h-3 text-indigo-600 shrink-0" />
                ) : (
                  <Paperclip className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-slate-700 truncate hover:text-indigo-600 transition-colors"
                  title={att.name}
                  onClick={(e) => e.stopPropagation()}
                >
                  {att.name}
                </a>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="p-0.5 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-colors border-0 bg-transparent cursor-pointer opacity-60 group-hover/att:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl cursor-pointer text-slate-650 hover:text-slate-800 transition-all font-bold">
            <UploadCloud className="w-4 h-4 text-indigo-650" />
            {currentUploading ? `${currentUploadProgress}%` : "Tải tệp"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, isEdit)}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
              disabled={currentUploading}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (isEdit) {
                setEditShowPersonalSelect(!editShowPersonalSelect);
                setEditShowLinkInput(false);
              } else {
                setShowPersonalSelect(!showPersonalSelect);
                setShowLinkInput(false);
              }
              if (!(isEdit ? editShowPersonalSelect : showPersonalSelect)) fetchPersonalDocs();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-slate-650 hover:text-slate-800 transition-all font-bold cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            Chọn sẵn
          </button>

          <button
            type="button"
            onClick={() => {
              if (isEdit) {
                setEditShowLinkInput(!editShowLinkInput);
                setEditShowPersonalSelect(false);
              } else {
                setShowLinkInput(!showLinkInput);
                setShowPersonalSelect(false);
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-slate-655 hover:text-slate-800 transition-all font-bold cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-emerald-600" />
            Link ngoài
          </button>
        </div>

        {/* Personal docs select panel */}
        {currentShowPersonal && (
          <div className="bg-slate-50 border border-slate-200/55 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5 animate-in slide-in-from-top-1 duration-155">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/40 mb-1.5">
              <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest">Tài liệu cá nhân của bạn</span>
              <button type="button" onClick={() => isEdit ? setEditShowPersonalSelect(false) : setShowPersonalSelect(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {loadingDocs ? (
              <p className="text-[10px] text-slate-400 font-bold text-center py-2">Đang tải tài liệu...</p>
            ) : personalDocs.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold text-center py-2">Chưa có tài liệu cá nhân nào</p>
            ) : (
              personalDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    const newAtt: TodoAttachment = { name: doc.name, url: doc.url };
                    if (isEdit) {
                      setEditAttachments((prev) => [...prev, newAtt]);
                    } else {
                      setNewAttachments((prev) => [...prev, newAtt]);
                    }
                  }}
                  className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200/60 cursor-pointer flex items-center justify-between text-[11px] font-bold text-slate-600 transition-colors"
                >
                  <span className="truncate pr-2">{doc.name}</span>
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                </div>
              ))
            )}
          </div>
        )}

        {/* External link input panel */}
        {currentShowLink && (
          <div className="bg-slate-50 border border-slate-200/55 rounded-2xl p-3 space-y-2 animate-in slide-in-from-top-1 duration-155">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/40 mb-1">
              <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest">Gắn liên kết tùy chọn</span>
              <button type="button" onClick={() => isEdit ? setEditShowLinkInput(false) : setShowLinkInput(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Tên liên kết (ví dụ: Google Drive môn học)"
              value={currentLinkName}
              onChange={(e) => isEdit ? setEditLinkName(e.target.value) : setLinkName(e.target.value)}
              className="w-full px-3 py-2 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 font-semibold"
            />
            <input
              type="url"
              placeholder="Đường dẫn liên kết (http://... hoặc https://...)"
              value={currentLinkUrl}
              onChange={(e) => isEdit ? setEditLinkUrl(e.target.value) : setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-655/20 font-semibold"
            />
            <button
              type="button"
              onClick={() => {
                const url = isEdit ? editLinkUrl : linkUrl;
                const name = isEdit ? editLinkName : linkName;
                if (!url.trim()) return;
                const newAtt: TodoAttachment = { name: name.trim() || url.trim(), url: url.trim() };
                if (isEdit) {
                  setEditAttachments((prev) => [...prev, newAtt]);
                  setEditLinkUrl("");
                  setEditLinkName("");
                  setEditShowLinkInput(false);
                } else {
                  setNewAttachments((prev) => [...prev, newAtt]);
                  setLinkUrl("");
                  setLinkName("");
                  setShowLinkInput(false);
                }
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-0 cursor-pointer"
            >
              Xác nhận đính kèm
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render attachment badges for list/schedule items
  const renderAttachmentBadges = (todo: TodoItem) => {
    const atts = parseTodoAttachments(todo.attachments);
    if (atts.length === 0) return null;
    return (
      <>
        {atts.map((att, idx) => (
          <a
            key={idx}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg border text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-105 hover:text-emerald-700 transition-colors truncate max-w-[150px]"
            title={att.name}
            onClick={(e) => e.stopPropagation()}
          >
            {att.url.startsWith("http") && !att.url.includes("supabase") ? (
              <Link2 className="w-3 h-3 shrink-0" />
            ) : (
              <Paperclip className="w-3 h-3 shrink-0" />
            )}
            {att.name}
          </a>
        ))}
      </>
    );
  };

  return (
    <div className="space-y-6 text-left relative select-none">
      {/* Header title */}
      <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-5">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
          <ListTodo className="w-8 h-8 text-indigo-600" />
          TodoList
        </h1>
        <p className="text-slate-455 text-sm font-semibold pl-1.5">
          Lên kế hoạch học tập, quản lý tiến độ các buổi học nhóm hoặc bài tập cá nhân hiệu quả.
        </p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng số lịch", value: totalCount, icon: ListTodo, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Đang thực hiện", value: activeCount, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Đã hoàn thành", value: completedCount, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Quá hạn bài tập", value: overdueCount, icon: AlertCircle, color: "text-rose-600 bg-rose-50 border-rose-100" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">{stat.label}</span>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Add task form */}
        <div id="add-todo-form" className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgba(99,102,241,0.015)] relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-3xl" />
          <h3 className="text-sm font-black text-slate-700 pb-3 border-b border-slate-50 mb-5 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            Tạo Lịch học mới
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest pl-0.5">Tiêu đề lịch học *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Ôn thi giữa kỳ môn Java..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/50 hover:bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 focus:border-indigo-600 transition-all font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest pl-0.5">Ghi chú / Mô tả</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Nội dung thảo luận hoặc tài liệu chuẩn bị..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/50 hover:bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 focus:border-indigo-600 transition-all font-semibold resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest pl-0.5">Thời gian học tập (Hạn định)</label>
              <input
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/50 hover:bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 focus:border-indigo-600 transition-all font-semibold"
              />
            </div>

            {/* Multi-attachment picker for creation */}
            {renderAttachmentPicker(newAttachments, (idx) => removeAttachment(idx, false), false)}

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/25 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                {newIsNotify ? <Bell className="w-3.5 h-3.5 text-amber-500" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                Nhận chuông báo (trước 15 phút)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsNotify}
                  onChange={(e) => setNewIsNotify(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={createTodoMutation.isPending || !newTitle.trim()}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black border-0 shadow-md shadow-indigo-600/10 hover:shadow-indigo-650/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] uppercase tracking-wider"
            >
              {createTodoMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tạo Lịch Học
            </button>
          </form>
        </div>

        {/* Right Side: Filters, View Toggles, Lists / Schedule */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter & Search & Mode View Toggle Panel */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                <input
                  type="text"
                  placeholder="Tìm nhiệm vụ học tập..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/20 hover:bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 transition-all font-semibold placeholder:text-slate-400"
                />
              </div>

              {/* View Mode Toggle & Tabs */}
              <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                {/* Toggle View Mode */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/20 text-xs font-black">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 outline-none ${
                      viewMode === "list"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 bg-transparent"
                    }`}
                  >
                    Danh sách
                  </button>
                  <button
                    onClick={() => setViewMode("schedule")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 outline-none flex items-center gap-1 ${
                      viewMode === "schedule"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 bg-transparent"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Khung giờ
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Filters: only shown in List mode */}
            {viewMode === "list" && (
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/20 w-full sm:w-max">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "active", label: "Chưa làm" },
                  { id: "completed", label: "Đã xong" },
                  { id: "overdue", label: "Quá hạn" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border-0 outline-none ${
                      activeTab === tab.id
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 bg-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Date Navigator: only shown in Schedule Mode */}
            {viewMode === "schedule" && (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/20">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all cursor-pointer border-0 bg-transparent outline-none"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span 
                  onClick={() => setSelectedDate(new Date())}
                  className="text-xs font-black text-slate-700 cursor-pointer hover:text-indigo-655"
                  title="Về ngày hôm nay"
                >
                  {formatSelectedDate(selectedDate)}
                </span>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-xl transition-all cursor-pointer border-0 bg-transparent outline-none"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* List display / Schedule Grid display area */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(99,102,241,0.015)] p-6 min-h-[400px]">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-bold">Đang tải lịch học...</span>
              </div>
            ) : viewMode === "list" ? (
              /* DẠNG DANH SÁCH TRUYỀN THỐNG */
              filteredTodos.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <ListTodo className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold">Không tìm thấy lịch học nào!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTodos.map((todo) => {
                    const overdue = isOverdue(todo);
                    const isExpanded = !!expandedIds[todo.id];

                    return (
                      <div
                        key={todo.id}
                        className={`border border-slate-100 rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:shadow-indigo-650/5 flex flex-col gap-2.5 ${
                          todo.isCompleted ? "bg-slate-50/50 opacity-70" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(todo)}
                              disabled={updateTodoMutation.isPending}
                              className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer border-2 outline-none mt-0.5 ${
                                todo.isCompleted
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                  : "border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 text-transparent"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                            </button>

                            <div className="min-w-0 text-left">
                              <p
                                onClick={() => handleToggleComplete(todo)}
                                className={`text-sm font-bold text-slate-700 truncate cursor-pointer ${
                                  todo.isCompleted ? "line-through text-slate-400" : ""
                                }`}
                              >
                                {todo.title}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 mt-1.5 select-none">
                                {todo.dueDate && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg border ${
                                      todo.isCompleted
                                        ? "text-slate-400 bg-slate-100 border-slate-200"
                                        : overdue
                                        ? "text-rose-600 bg-rose-50 border-rose-100"
                                        : "text-indigo-600 bg-indigo-50/50 border-indigo-100/50"
                                    }`}
                                  >
                                    <Calendar className="w-3 h-3 shrink-0" />
                                    {formatDate(todo.dueDate)}
                                  </span>
                                )}

                                {todo.isNotify && !todo.isCompleted && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg border text-amber-600 bg-amber-50 border-amber-100">
                                    <Bell className="w-3 h-3" /> Chuông
                                  </span>
                                )}

                                {renderAttachmentBadges(todo)}

                                {overdue && (
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase text-rose-650 bg-rose-50 border border-rose-100 rounded-lg animate-pulse">
                                    Trễ hạn
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {todo.description && (
                              <button
                                onClick={() => toggleExpand(todo.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-0 bg-transparent outline-none cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(todo)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors border-0 bg-transparent outline-none cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(todo.id)}
                              disabled={deleteTodoMutation.isPending}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-55/10 transition-colors border-0 bg-transparent outline-none cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && todo.description && (
                          <div className="mt-1 pl-8 pr-4 text-xs font-semibold text-slate-500 leading-relaxed border-t border-slate-50 pt-2.5 text-left">
                            {todo.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* DẠNG LỊCH BIỂU CHIA KHUNG GIỜ (SCHEDULE HOURLY GRID) */
              <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden select-none">
                {hourlySlots.map((hour) => {
                  const hourTodos = getTodosForHour(hour);
                  const hourStr = hour.toString().padStart(2, "0") + ":00";

                  return (
                    <div
                      key={hour}
                      className="flex items-stretch hover:bg-slate-50/30 transition-colors group/row"
                    >
                      {/* Left: Hour indicator column */}
                      <div className="w-20 py-4 px-3 border-r border-slate-150 text-[11px] font-black text-slate-455 bg-slate-50/60 select-none text-center flex items-center justify-center shrink-0">
                        {hourStr}
                      </div>

                      {/* Right: Scheduled tasks box */}
                      <div 
                        onClick={() => { if (hourTodos.length === 0) handleHourSlotClick(hour); }}
                        className="flex-1 p-3 flex flex-wrap gap-2.5 items-center min-h-[58px] cursor-pointer"
                      >
                        {hourTodos.length === 0 ? (
                          <span className="text-[10px] text-slate-400 opacity-0 group-hover/row:opacity-100 transition-opacity font-bold pl-2">
                            + Bấm để lên lịch học vào {hourStr}
                          </span>
                        ) : (
                          hourTodos.map((todo) => {
                            const atts = parseTodoAttachments(todo.attachments);
                            return (
                              <div
                                key={todo.id}
                                onClick={(e) => { e.stopPropagation(); }}
                                className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 shadow-sm min-w-[200px] max-w-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left ${
                                  todo.isCompleted
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : "bg-indigo-50/40 text-indigo-900 border-indigo-150/70"
                                }`}
                              >
                                <div className="min-w-0 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleComplete(todo)}
                                    className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center transition-all border outline-none cursor-pointer ${
                                      todo.isCompleted
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-slate-350 hover:border-indigo-500 text-transparent bg-white"
                                    }`}
                                  >
                                    <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                                  </button>
                                  <span className={`text-[11px] font-bold truncate ${todo.isCompleted ? "line-through" : ""}`}>
                                    {todo.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {todo.isNotify && !todo.isCompleted && (
                                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                                  )}
                                  {atts.length > 0 && (
                                    <a
                                      href={atts[0].url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded text-emerald-650 hover:bg-white border-0 bg-transparent outline-none cursor-pointer transition-colors"
                                      title={`${atts.length} tài liệu đính kèm`}
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => openEditModal(todo)}
                                    className="p-1 rounded text-slate-450 hover:text-indigo-650 hover:bg-white border-0 bg-transparent outline-none cursor-pointer transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(todo.id)}
                                    className="p-1 rounded text-slate-455 hover:text-rose-600 hover:bg-white border-0 bg-transparent outline-none cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog Modal Panel */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingTodo(null)}
          />

          {/* Modal Container Card */}
          <div className="relative w-full max-w-md transform bg-white border border-slate-100 rounded-[32px] p-6 shadow-2xl transition-all duration-300 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setEditingTodo(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors border-0 bg-transparent outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-700 pb-3 border-b border-slate-50 mb-5 flex items-center gap-1.5 text-left">
              <Edit2 className="w-4 h-4 text-indigo-600" />
              Chỉnh sửa Lịch học
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest pl-0.5">Tiêu đề lịch học *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn thi..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/50 hover:bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 focus:border-indigo-600 transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest pl-0.5">Ghi chú / Mô tả</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Chi tiết tài liệu chuẩn bị..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/50 hover:bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 focus:border-indigo-600 transition-all font-semibold resize-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest pl-0.5">Thời gian hẹn học</label>
                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/50 hover:bg-slate-50/50 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650/20 focus:border-indigo-600 transition-all font-semibold"
                />
              </div>

              {/* Multi-attachment picker for edit modal */}
              {renderAttachmentPicker(editAttachments, (idx) => removeAttachment(idx, true), true)}

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/25 rounded-2xl text-left">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  {editIsCompleted ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                  Đã hoàn thành lịch học
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsCompleted}
                    onChange={(e) => setEditIsCompleted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/25 rounded-2xl text-left">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  {editIsNotify ? <Bell className="w-3.5 h-3.5 text-amber-500" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                  Nhận chuông báo (trước 15 phút)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsNotify}
                    onChange={(e) => setEditIsNotify(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-50 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-xl text-xs font-black border-0 cursor-pointer transition-colors active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updateTodoMutation.isPending || !editTitle.trim()}
                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black border-0 shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  {updateTodoMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoListPage;
