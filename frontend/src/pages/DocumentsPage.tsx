import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, FileText, UploadCloud, RefreshCw, Trash2, Download, Image as ImageIcon, File as FileIcon, FileSpreadsheet, FileIcon as FilePowerpoint, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getPersonalDocumentsApi,
  uploadPersonalDocumentApi,
  softDeleteDocumentApi,
  downloadDocumentApi,
} from '../features/group/services/document.service';
import type { DocumentData } from '../features/group/services/document.service';

/**
 * Helper to group documents by day
 */
const groupDocumentsByDay = (docs: DocumentData[]) => {
  const groups: { [key: string]: DocumentData[] } = {};
  
  docs.forEach(doc => {
    const d = new Date(doc.createdAt);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const title = `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    
    if (!groups[title]) groups[title] = [];
    groups[title].push(doc);
  });
  
  return Object.entries(groups).map(([title, documents]) => ({ title, documents }));
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'PDF': return <FileText className="w-5 h-5" />;
    case 'DOCX': return <FileIcon className="w-5 h-5" />;
    case 'PPTX': return <FilePowerpoint className="w-5 h-5" />;
    case 'XLSX': return <FileSpreadsheet className="w-5 h-5" />;
    case 'IMAGE': return <ImageIcon className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
};

const getFileColor = (type: string) => {
  switch (type) {
    case 'PDF': return 'bg-rose-50 text-rose-600';
    case 'DOCX': return 'bg-blue-50 text-blue-600';
    case 'PPTX': return 'bg-orange-50 text-orange-600';
    case 'XLSX': return 'bg-emerald-50 text-emerald-600';
    case 'IMAGE': return 'bg-purple-50 text-purple-600';
    default: return 'bg-slate-50 text-slate-600';
  }
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const handleDownload = async (docId: string, url: string, filename: string) => {
  try {
    const response = await downloadDocumentApi(docId);
    const blob = new Blob([response.data as any]);
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download proxy failed, using fallback", error);
    if (url.includes('/image/upload/') && filename.toLowerCase().endsWith('.pdf')) {
      alert("⚠️ CẢNH BÁO: File PDF này là dữ liệu cũ bị lưu sai định dạng. Server Cloud đã chặn quyền truy cập.\n\n👉 GIẢI PHÁP: Bạn vui lòng XÓA file này đi và TẢI LÊN LẠI file PDF đó nhé!");
      return;
    }
    const fallbackUrl = url.includes('/upload/') 
      ? url.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(filename)}/`)
      : url;
    window.open(fallbackUrl, '_blank');
  }
};

const handlePreview = async (e: React.MouseEvent, docId: string, url: string, type: string) => {
  e.preventDefault();
  if (type === 'PDF') {
    try {
      const response = await downloadDocumentApi(docId);
      const blob = new Blob([response.data as any], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error("Preview proxy failed, using fallback", error);
      if (url.includes('/image/upload/')) {
        alert("⚠️ CẢNH BÁO: File PDF này là dữ liệu cũ bị lưu sai định dạng. Server Cloud đã chặn quyền xem.\n\n👉 GIẢI PHÁP: Bạn vui lòng XÓA file này đi và TẢI LÊN LẠI file PDF đó nhé!");
        return;
      }
      window.open(url, '_blank');
    }
  } else if (['DOCX', 'PPTX', 'XLSX'].includes(type)) {
    window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}`, '_blank');
  } else {
    window.open(url, '_blank');
  }
};

const DocumentRow = ({ title, documents, onDelete }: { title: string; documents: DocumentData[]; onDelete: (id: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h3 className="text-[11px] font-bold text-slate-500 tracking-wider">{title}</h3>
      </div>
      
      <div className="relative group/row">
        {documents.length > 4 && (
          <button 
            onClick={() => scroll('left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-indigo-600 opacity-0 group-hover/row:opacity-100 transition-opacity border border-slate-100 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-2 pt-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {documents.map(doc => (
            <div key={doc.id} className="min-w-[280px] max-w-[280px] shrink-0 snap-start bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getFileColor(doc.type)}`}>
                  {getFileIcon(doc.type)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownload(doc.id, doc.url, doc.name)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer bg-transparent border-0" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(doc.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors bg-transparent border-0 cursor-pointer" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 mt-2">
                <a href={doc.url} onClick={(e) => handlePreview(e, doc.id, doc.url, doc.type)} className="font-bold text-sm text-slate-800 line-clamp-2 hover:text-indigo-600 transition-colors text-decoration-none cursor-pointer">
                  {doc.name}
                </a>
                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mt-2">
                  <span>{formatSize(doc.size)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>Uploaded {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {documents.length > 4 && (
          <button 
            onClick={() => scroll('right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-indigo-600 opacity-0 group-hover/row:opacity-100 transition-opacity border border-slate-100 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [sectionsPerPage] = useState(7);
  const [allSections, setAllSections] = useState<{ title: string; documents: DocumentData[] }[]>([]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPersonalDocumentsApi({
        search: searchQuery || undefined,
        type: activeFilter !== 'all' ? activeFilter : undefined,
        page: 1, // We fetch all to group locally for now
        limit: 500,
        sort: sortOrder
      });
      const docs = res.data?.data?.data || [];
      const grouped = groupDocumentsByDay(docs);
      setAllSections(grouped);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, sortOrder]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Reset page when search, filter or sort changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter, sortOrder]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      alert("File size must not exceed 30MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadPersonalDocumentApi(file, (progress) => {
        setUploadProgress(progress);
      });
      fetchDocuments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await softDeleteDocumentApi(docId);
      fetchDocuments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const totalPages = Math.ceil(allSections.length / sectionsPerPage);
  const currentSections = allSections.slice((page - 1) * sectionsPerPage, page * sectionsPerPage);

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      
      {/* Header aligned with mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Documents</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-sm py-2 pl-4 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600/20 cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="all">All Types</option>
            <option value="PDF">PDFs</option>
            <option value="DOCX">Word Docs</option>
            <option value="PPTX">PowerPoints</option>
            <option value="XLSX">Excel Sheets</option>
            <option value="IMAGE">Images</option>
          </select>

          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-sm py-2 pl-9 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600/20 cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload button area */}
      <div className="flex justify-start">
        <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-200">
          <UploadCloud className="w-4 h-4" />
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload File'}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileChange} 
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" 
            disabled={uploading}
          />
        </label>
      </div>

      {/* Sections Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 bg-slate-50 border border-slate-100 rounded-3xl">
          <FileText className="w-10 h-10 text-slate-300" />
          <span className="text-sm font-semibold text-slate-500">No documents found. Try uploading one!</span>
        </div>
      ) : (
        <div>
          {currentSections.map(({ title, documents }) => (
            <DocumentRow key={title} title={title} documents={documents} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-0 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-full text-sm font-semibold transition-all border-0 cursor-pointer ${
                page === i + 1 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-100'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-0 cursor-pointer transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
