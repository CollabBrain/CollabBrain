import { useState } from 'react';
import { Search, SlidersHorizontal, FileText, UploadCloud, MoreVertical, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * DocumentsPage — Giao diện quản lý tài liệu học tập Studifier (Mockup 3).
 * Thiết kế lưới tài liệu với chi tiết kích thước, ngày đăng, trạng thái sẵn sàng
 * và tiến trình xử lý tự động của AI (AI Indexing).
 */
const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pdf' | 'note' | 'image'>('all');

  const initialDocs = [
    {
      id: 'd1',
      name: 'Advanced Machine Learning Notes',
      type: 'pdf',
      size: '4.2 MB',
      date: 'Added 2 days ago',
      status: 'ready',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      id: 'd2',
      name: 'History 101: Midterm Study Guide',
      type: 'note',
      size: '1.1 MB',
      date: 'Added 1 week ago',
      status: 'ready',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'd3',
      name: 'Biology Chapter 4 - Cell Division',
      type: 'pdf',
      size: '8.4 MB',
      date: 'Just now',
      status: 'indexing',
      progress: 45,
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  const [documents, setDocuments] = useState(initialDocs);

  const filteredDocs = documents.filter((doc) => {
    // Lọc theo search
    if (searchQuery.trim() && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Lọc theo tabs
    if (activeFilter === 'all') return true;
    return doc.type === activeFilter;
  });

  const triggerUpload = () => {
    // Giả lập thêm file mới khi click Upload
    const newDoc = {
      id: Date.now().toString(),
      name: 'New Study Material ' + (documents.length + 1),
      type: 'pdf',
      size: '2.5 MB',
      date: 'Just now',
      status: 'indexing',
      progress: 10,
      color: 'bg-violet-50 text-violet-600',
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // Giả lập tiến trình chạy AI Indexing
    let currentProg = 10;
    const interval = setInterval(() => {
      currentProg += 15;
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === newDoc.id) {
            if (currentProg >= 100) {
              clearInterval(interval);
              return { ...d, status: 'ready', progress: undefined };
            }
            return { ...d, progress: currentProg };
          }
          return d;
        })
      );
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Page Title & Subtitle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Documents</h1>
          <p className="text-slate-400 text-sm font-semibold">
            Manage and analyze your study materials with AI.
          </p>
        </div>

        {/* Search and Action Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100/60 border border-slate-200/20 focus:bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold placeholder:text-slate-400"
            />
          </div>
          <button className="p-3 text-slate-500 bg-slate-100/60 hover:bg-slate-100 hover:text-slate-700 rounded-2xl transition-all border-0 cursor-pointer active:scale-95">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Selection Pills Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none border-b border-slate-100 pb-2">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'All Files' },
              { id: 'pdf', label: 'PDFs' },
              { id: 'note', label: 'Notes' },
              { id: 'image', label: 'Images' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={[
                'px-5 py-2 text-xs font-extrabold rounded-full transition-all border-0 cursor-pointer active:scale-95 outline-none',
                activeFilter === id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  : 'bg-white border border-slate-200/60 text-slate-400 hover:bg-slate-50 hover:text-slate-600',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-slate-400 text-left sm:text-right">
          Showing {filteredDocs.length} documents
        </span>
      </div>

      {/* Main Documents Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Document Cards */}
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.02)] flex flex-col justify-between min-h-[200px] group hover:shadow-[0_12px_36px_rgba(99,102,241,0.06)] hover:border-slate-200/50 transition-all duration-300 relative select-none"
          >
            {/* Top header details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {/* File icon block with custom HSL theme coloring */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${doc.color}`}>
                  <FileText className="w-5.5 h-5.5" />
                </div>
                
                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg border-0 bg-transparent cursor-pointer">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Title and date */}
              <div className="space-y-1 text-left">
                <h3 className="font-extrabold text-sm text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {doc.name}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <span>{doc.size}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{doc.date}</span>
                </p>
              </div>
            </div>

            {/* Bottom status badge container */}
            <div className="pt-4 border-t border-slate-50 flex items-center select-none">
              {doc.status === 'ready' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready
                </span>
              ) : (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      AI Indexing
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600">{doc.progress}%</span>
                  </div>
                  {/* Progress tracker bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${doc.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Click/Drag Upload Container Card */}
        <div
          onClick={triggerUpload}
          className="border-2 border-dashed border-indigo-100 hover:border-indigo-300 bg-indigo-50/5 hover:bg-indigo-50/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50/60 group-hover:bg-indigo-100 flex items-center justify-center mb-4 transition-all group-hover:scale-110 shadow-sm border border-indigo-100/10">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-800 tracking-tight mb-1">
            Upload Document
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold leading-normal max-w-[150px]">
            Drag & drop or click to browse
          </p>
        </div>

      </div>

    </div>
  );
};

export default DocumentsPage;
