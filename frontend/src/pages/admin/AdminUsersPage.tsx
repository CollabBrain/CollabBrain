import { useEffect, useState } from 'react';
import adminAxiosInstance from '../../services/adminAxiosInstance';
import { Search, Edit2, Lock, Unlock, Trash2, ShieldAlert, X, Check, Loader2 } from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, locked
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Action Confirmation State
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    actionType: 'delete' | 'toggle';
    message: string;
  } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'active' ? 'true' : statusFilter === 'locked' ? 'false' : undefined;
      const response = await adminAxiosInstance.get('/users', {
        params: {
          page,
          limit: 8,
          search: search.trim() || undefined,
          isActive: activeParam,
        },
      });
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditBio(user.bio || '');
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim()) {
      showToast('Tên không được để trống', 'error');
      return;
    }

    setEditSaving(true);
    try {
      await adminAxiosInstance.patch(`/users/${editingUser.id}`, {
        name: editName.trim(),
        bio: editBio.trim() || null,
      });
      showToast('Cập nhật người dùng thành công', 'success');
      closeEditModal();
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật người dùng', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const response = await adminAxiosInstance.patch(`/users/${userId}/toggle-status`);
      showToast(response.data.message || 'Thay đổi trạng thái tài khoản thành công', 'success');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi thay đổi trạng thái tài khoản', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminAxiosInstance.delete(`/users/${userId}`);
      showToast('Xóa người dùng thành công', 'success');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi xóa người dùng', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;
    if (confirmAction.actionType === 'delete') {
      handleDeleteUser(confirmAction.userId);
    } else if (confirmAction.actionType === 'toggle') {
      handleToggleStatus(confirmAction.userId);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Quản lý Người dùng
          </h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            Xem danh sách, chỉnh sửa thông tin, khóa hoặc xóa tài khoản sinh viên
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
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

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
            <p className="text-slate-550 text-xs font-bold">Đang tải danh sách người dùng...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            Không tìm thấy người dùng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">Người dùng</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày tham gia</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pr-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/20">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-900/30 flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]" title={user.bio || ''}>
                            {user.bio || 'Chưa thiết lập mô tả'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-350">{user.email}</td>
                    <td className="p-4 text-sm text-slate-450">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/30">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/60 text-rose-450 border border-rose-800/30">
                          Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(user)}
                          title="Sửa thông tin"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        
                        {/* Lock / Unlock Toggle */}
                        <button
                          onClick={() => setConfirmAction({
                            userId: user.id,
                            actionType: 'toggle',
                            message: `Bạn có chắc chắn muốn ${user.isActive ? 'Khóa' : 'Mở khóa'} tài khoản người dùng "${user.name}"?`
                          })}
                          title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`p-2 rounded-lg border-0 bg-transparent cursor-pointer transition-colors ${
                            user.isActive 
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30' 
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                          }`}
                        >
                          {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setConfirmAction({
                            userId: user.id,
                            actionType: 'delete',
                            message: `Bạn có chắc chắn muốn Xóa tài khoản người dùng "${user.name}"? Hành động này không thể hoàn tác.`
                          })}
                          title="Xóa người dùng"
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
              Hiển thị trang {pagination.page}/{pagination.totalPages} (Tổng số {pagination.total} user)
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Chỉnh sửa thông tin</h3>
              <button
                onClick={closeEditModal}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border-0 bg-transparent cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Họ và tên</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Tiểu sử (Bio)</label>
                <RichTextEditor
                  value={editBio}
                  onChange={(content) => setEditBio(content)}
                  placeholder="Nhập giới thiệu..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-sm font-bold border border-slate-855 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold border-0 cursor-pointer disabled:opacity-50"
                >
                  {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default AdminUsersPage;
