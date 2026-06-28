import { useEffect, useState } from 'react';
import adminAxiosInstance from '../../services/adminAxiosInstance';
import { Search, Lock, Unlock, Trash2, ShieldAlert, Check, Loader2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE';
  isActive: boolean;
  createdAt: string;
  memberCount: number;
  documentCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminGroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, locked
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Action Confirmation State
  const [confirmAction, setConfirmAction] = useState<{
    groupId: string;
    actionType: 'delete' | 'toggle';
    message: string;
  } | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'active' ? 'true' : statusFilter === 'locked' ? 'false' : undefined;
      const response = await adminAxiosInstance.get('/groups', {
        params: {
          page,
          limit: 8,
          search: search.trim() || undefined,
          isActive: activeParam,
        },
      });
      setGroups(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi tải danh sách nhóm', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page, statusFilter]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGroups();
  };

  const handleToggleStatus = async (groupId: string) => {
    try {
      const response = await adminAxiosInstance.patch(`/groups/${groupId}/toggle-status`);
      showToast(response.data.message || 'Thay đổi trạng thái nhóm thành công', 'success');
      fetchGroups();
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi thay đổi trạng thái nhóm', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await adminAxiosInstance.delete(`/groups/${groupId}`);
      showToast('Xóa nhóm thành công', 'success');
      fetchGroups();
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi xóa nhóm', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;
    if (confirmAction.actionType === 'delete') {
      handleDeleteGroup(confirmAction.groupId);
    } else if (confirmAction.actionType === 'toggle') {
      handleToggleStatus(confirmAction.groupId);
    }
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
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Quản lý Nhóm học tập
        </h1>
        <p className="text-slate-400 text-xs font-medium mt-1">
          Giám sát danh sách nhóm học tập, khóa nhóm hoặc xóa các nhóm học tập vi phạm
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhóm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold border-0 transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Status filters */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850 self-start md:self-auto">
          <button
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${
              statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setStatusFilter('active'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${
              statusFilter === 'active' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            Đang hoạt động
          </button>
          <button
            onClick={() => { setStatusFilter('locked'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${
              statusFilter === 'locked' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            Bị khóa
          </button>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
            <p className="text-slate-550 text-xs font-bold">Đang tải danh sách nhóm học...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            Không tìm thấy nhóm học tập nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">Nhóm</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Chế độ hiển thị</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Thành viên</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Tài liệu</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pr-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/20">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {group.avatarUrl ? (
                          <img src={group.avatarUrl} alt={group.name} className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-950 text-purple-400 border border-purple-900/30 flex items-center justify-center font-bold text-sm">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-white">{group.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]" title={group.description || ''}>
                            {group.description || 'Chưa thiết lập mô tả'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {group.visibility === 'PUBLIC' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-955/60 text-blue-400 border border-blue-800/20">
                          Công khai (Public)
                        </span>
                      ) : group.visibility === 'PRIVATE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-955/60 text-amber-405 border border-amber-850/20">
                          Riêng tư (Private)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-955/60 text-purple-400 border border-purple-800/20">
                          Chỉ mời (Invite)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-350 text-center">{group.memberCount}</td>
                    <td className="p-4 text-sm font-semibold text-slate-350 text-center">{group.documentCount}</td>
                    <td className="p-4 text-sm text-slate-450">
                      {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4">
                      {group.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-955/60 text-emerald-400 border border-emerald-800/30">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-955/60 text-rose-450 border border-rose-800/30">
                          Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Lock / Unlock Toggle */}
                        <button
                          onClick={() => setConfirmAction({
                            groupId: group.id,
                            actionType: 'toggle',
                            message: `Bạn có chắc chắn muốn ${group.isActive ? 'Khóa' : 'Mở khóa'} hoạt động của nhóm "${group.name}"?`
                          })}
                          title={group.isActive ? 'Khóa nhóm' : 'Mở khóa nhóm'}
                          className={`p-2 rounded-lg border-0 bg-transparent cursor-pointer transition-colors ${
                            group.isActive 
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30' 
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                          }`}
                        >
                          {group.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setConfirmAction({
                            groupId: group.id,
                            actionType: 'delete',
                            message: `Bạn có chắc chắn muốn Xóa vĩnh viễn nhóm "${group.name}" (Xóa nhóm vi phạm)? Thành viên và tài liệu của nhóm này sẽ không thể truy cập.`
                          })}
                          title="Xóa nhóm vi phạm"
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
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
              Hiển thị trang {pagination.page}/{pagination.totalPages} (Tổng số {pagination.total} nhóm)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-30 border border-slate-850 rounded-xl text-xs font-bold text-slate-350 transition-colors border-0 cursor-pointer disabled:pointer-events-none"
              >
                Trang trước
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-30 border border-slate-850 rounded-xl text-xs font-bold text-slate-350 transition-colors border-0 cursor-pointer disabled:pointer-events-none"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6 animate-in scale-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Xác nhận hành động</h3>
            </div>
            
            <p className="text-sm font-medium text-slate-350 leading-relaxed">
              {confirmAction.message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-bold border border-slate-855 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold border-0 cursor-pointer"
              >
                Đồng ý thực hiện
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminGroupsPage;
