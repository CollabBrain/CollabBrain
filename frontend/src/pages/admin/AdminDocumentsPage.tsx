import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminAxiosInstance from '../../services/adminAxiosInstance';
import { Search, Loader2, RefreshCw, Eye, Trash2, Check, ShieldAlert, X, FileText, Database } from 'lucide-react';

interface Uploader {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface Group {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface AdminDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  isEmbedded: boolean;
  createdAt: string;
  uploadedBy: string;
  groupId: string | null;
  uploader: Uploader;
  group: Group | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminDocumentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, embedded, pending
  const [typeFilter, setTypeFilter] = useState<string>('all'); // all, PDF, DOCX, XLSX, PPTX
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter by query parameters (from reports navigation)
  const groupIdFilter = searchParams.get('groupId') || '';
  const uploadedByFilter = searchParams.get('uploadedBy') || '';

  // Action states
  const [reIngestingId, setReIngestingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<AdminDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const isEmbeddedParam = statusFilter === 'embedded' ? 'true' : statusFilter === 'pending' ? 'false' : undefined;
      const response = await adminAxiosInstance.get('/documents', {
        params: {
          page,
          limit: 8,
          search: search.trim() || undefined,
          isEmbedded: isEmbeddedParam,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          groupId: groupIdFilter || undefined,
          uploadedBy: uploadedByFilter || undefined,
        },
      });
      setDocuments(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi tải danh sách tài liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, statusFilter, typeFilter, groupIdFilter, uploadedByFilter]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleReIngest = async (docId: string) => {
    setReIngestingId(docId);
    try {
      const response = await adminAxiosInstance.post(`/documents/${docId}/re-ingest`);
      showToast(response.data.message || 'Đã kích hoạt nhúng lại tài liệu', 'success');
      fetchDocuments();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Lỗi khi kích hoạt nhúng lại tài liệu', 'error');
    } finally {
      setReIngestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await adminAxiosInstance.delete(`/documents/${deletingDoc.id}`);
      showToast('Xóa tài liệu khỏi hệ thống thành công', 'success');
      setDeletingDoc(null);
      fetchDocuments();
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi xóa tài liệu', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPage(1);
    setSearchParams({});
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl border shadow-xl animate-in slide-in-from-top duration-350 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-350 border-emerald-800/40' 
            : 'bg-rose-950/90 text-rose-350 border-rose-800/40'
        }`}>
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6 text-indigo-400" />
          Quản lý Tài liệu & RAG
        </h1>
        <p className="text-slate-400 text-xs font-medium mt-1">
          Giám sát trạng thái học tập dữ liệu vector, xem trước tài liệu, nhúng lại các tệp tin lỗi hoặc xóa tài liệu vi phạm.
        </p>
      </div>

      {/* Active Filter Indication */}
      {(groupIdFilter || uploadedByFilter) && (
        <div className="p-4 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl flex items-center justify-between">
          <p className="text-xs text-indigo-300 font-medium">
            {groupIdFilter && `Đang lọc theo tài liệu của Nhóm (ID: ${groupIdFilter})`}
            {uploadedByFilter && `Đang lọc theo tài liệu của Thành viên (ID: ${uploadedByFilter})`}
          </p>
          <button 
            onClick={clearFilters} 
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 border-0 bg-transparent cursor-pointer flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Xóa bộ lọc ngoài
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold border-0 transition-colors cursor-pointer"
          >
            Tìm
          </button>
        </form>

        {/* Filter Selection groups */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-450 uppercase">Định dạng:</span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-850 rounded-xl text-xs font-semibold px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">Word (.docx)</option>
              <option value="XLSX">Excel (.xlsx)</option>
              <option value="PPTX">PowerPoint (.pptx)</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 bg-transparent'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => { setStatusFilter('embedded'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer ${
                statusFilter === 'embedded' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 bg-transparent'
              }`}
            >
              Đã nhúng vector
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer ${
                statusFilter === 'pending' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 bg-transparent'
              }`}
            >
              Đang chờ / Lỗi
            </button>
          </div>

          {/* Clear Filters button */}
          {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="px-3.5 py-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold border-0 bg-transparent cursor-pointer transition-colors"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Document table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
            <p className="text-slate-550 text-xs font-bold">Đang tải danh sách tài liệu...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-bold">
            Không tìm thấy tài liệu học tập nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-6">Tài liệu</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Định dạng / Size</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Người tải</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nhóm học</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái RAG</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/20">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-850/30 transition-colors">
                    {/* Document details */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/30">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 max-w-[280px]">
                          <p className="text-sm font-semibold text-white truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            ID: {doc.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Format / size */}
                    <td className="p-4">
                      <span className="text-xs font-semibold text-slate-300 block">
                        {doc.type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {formatSize(doc.size)}
                      </span>
                    </td>

                    {/* Uploader profile */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {doc.uploader.avatarUrl ? (
                          <img src={doc.uploader.avatarUrl} alt={doc.uploader.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-900/30 flex items-center justify-center font-semibold text-[10px]">
                            {doc.uploader.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-slate-350 max-w-[120px] truncate" title={doc.uploader.name}>
                          {doc.uploader.name}
                        </span>
                      </div>
                    </td>

                    {/* Group context */}
                    <td className="p-4">
                      {doc.group ? (
                        <div className="flex items-center gap-2">
                          {doc.group.avatarUrl ? (
                            <img src={doc.group.avatarUrl} alt={doc.group.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-950 text-purple-400 border border-purple-900/30 flex items-center justify-center font-semibold text-[10px]">
                              {doc.group.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-medium text-slate-355 max-w-[120px] truncate" title={doc.group.name}>
                            {doc.group.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-550 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-850">
                          Tài liệu cá nhân
                        </span>
                      )}
                    </td>

                    {/* RAG Status */}
                    <td className="p-4">
                      {doc.isEmbedded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/30">
                          Nhúng thành công
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-955/60 text-amber-405 border border-amber-850/20">
                          Chờ / Lỗi nhúng
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          title="Xem trước tài liệu"
                          className="p-2 text-slate-450 hover:text-white hover:bg-slate-800 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>

                        {/* Re-ingest button */}
                        <button
                          onClick={() => handleReIngest(doc.id)}
                          disabled={reIngestingId === doc.id}
                          title="Kích hoạt nhúng lại"
                          className="p-2 text-slate-450 hover:text-indigo-400 hover:bg-indigo-950/30 rounded-lg border-0 bg-transparent cursor-pointer transition-all active:rotate-180 disabled:opacity-50"
                        >
                          {reIngestingId === doc.id ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4.5 w-4.5" />
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => setDeletingDoc(doc)}
                          title="Xóa tài liệu vi phạm"
                          className="p-2 text-slate-455 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">
              Hiển thị trang {pagination.page}/{pagination.totalPages} (Tổng số {pagination.total} tệp tin)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-30 border border-slate-850 rounded-xl text-xs font-semibold text-slate-355 transition-colors border-0 cursor-pointer disabled:pointer-events-none"
              >
                Trang trước
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-30 border border-slate-850 rounded-xl text-xs font-semibold text-slate-355 transition-colors border-0 cursor-pointer disabled:pointer-events-none"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview File Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in scale-in duration-200">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white max-w-[600px] truncate" title={previewDoc.name}>
                  {previewDoc.name}
                </h3>
                <p className="text-xs text-slate-450 mt-0.5">
                  Định dạng: {previewDoc.type} &bull; Tải lên bởi: {previewDoc.uploader.name}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border-0 bg-transparent cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Viewer Iframe */}
            <div className="flex-1 bg-slate-950 relative">
              <iframe
                title="Google Docs Preview"
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewDoc.url)}&embedded=true`}
                className="w-full h-full border-0 absolute inset-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6 animate-in scale-in duration-200">
            <div className="flex items-center gap-3 text-rose-455">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Xác nhận xóa tài liệu</h3>
            </div>
            
            <p className="text-sm font-medium text-slate-350 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu <strong>"{deletingDoc.name}"</strong> khỏi hệ thống? 
              <br />
              Hành động này sẽ xóa file trên Supabase Cloud và toàn bộ vector nhúng RAG liên quan. Thao tác không thể khôi phục.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-semibold border border-slate-855 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold border-0 cursor-pointer flex items-center gap-1"
              >
                {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentsPage;
