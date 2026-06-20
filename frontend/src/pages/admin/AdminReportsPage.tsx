import { useEffect, useState } from 'react';
import adminAxiosInstance from '../../services/adminAxiosInstance';
import { ShieldAlert, Check, Flag, ArrowRight, CornerDownRight, ShieldCheck, Loader2, UserX, UserCheck } from 'lucide-react';

interface Reporter {
  id: string;
  name: string;
  email: string;
}

interface TargetUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
}

interface TargetGroup {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Report {
  id: string;
  reporterId: string;
  targetUserId: string | null;
  targetGroupId: string | null;
  reason: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  reporter: Reporter;
  targetUser: TargetUser | null;
  targetGroup: TargetGroup | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Quick Action Modal/Action State
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} tài khoản người dùng này?`)) {
      return;
    }
    setTogglingUserId(userId);
    try {
      await adminAxiosInstance.patch(`/${userId}/toggle-status`);
      showToast(
        currentStatus ? 'Đã khóa tài khoản thành công' : 'Đã mở khóa tài khoản thành công',
        'success'
      );
      fetchReports();
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi cập nhật trạng thái tài khoản', 'error');
    } finally {
      setTogglingUserId(null);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await adminAxiosInstance.get('/reports', {
        params: {
          page,
          limit: 8,
        },
      });
      setReports(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi tải danh sách báo cáo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleResolveReport = async (reportId: string) => {
    setResolvingId(reportId);
    try {
      await adminAxiosInstance.patch(`/reports/${reportId}/resolve`, {
        status: 'RESOLVED',
      });
      showToast('Đã đánh dấu giải quyết báo cáo', 'success');
      fetchReports();
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi cập nhật trạng thái báo cáo', 'error');
    } finally {
      setResolvingId(null);
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
        <h1 className="text-3xl font-black text-white tracking-tight">
          Quản lý Báo cáo Vi phạm
        </h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Xem xét các báo cáo nội dung hoặc hành vi vi phạm chuẩn mực cộng đồng từ các thành viên
        </p>
      </div>

      {/* Reports List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
            <p className="text-slate-550 text-xs font-bold">Đang tải danh sách báo cáo...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center text-slate-550 font-bold">
            Hệ thống an toàn. Chưa có báo cáo vi phạm nào!
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className={`p-6 transition-all duration-200 hover:bg-slate-850/20 flex flex-col md:flex-row md:items-start justify-between gap-6 ${
                  report.status === 'RESOLVED' ? 'opacity-65' : ''
                }`}
              >
                {/* Left Side: Report Details */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-900/30 px-2.5 py-1 rounded-lg">
                      Từ: {report.reporter.name}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    {report.targetUser ? (
                      <span className="text-xs font-bold text-rose-400 bg-rose-950/50 border border-rose-900/30 px-2.5 py-1 rounded-lg">
                        Báo cáo User: {report.targetUser.name}
                      </span>
                    ) : report.targetGroup ? (
                      <span className="text-xs font-bold text-amber-400 bg-amber-950/50 border border-amber-900/30 px-2.5 py-1 rounded-lg">
                        Báo cáo Group: {report.targetGroup.name}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                        Đối tượng không xác định
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-slate-500 ml-auto md:ml-0">
                      {new Date(report.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* Reason Text */}
                  <div className="flex gap-2.5 items-start">
                    <CornerDownRight className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-200 leading-relaxed bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850/50 w-full max-w-3xl">
                      {report.reason}
                    </p>
                  </div>
                </div>

                {/* Right Side: Status badge & Action buttons */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 self-stretch md:self-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                  {report.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800/30 animate-pulse animate-duration-1000">
                      Đang chờ xử lý
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-450 border border-emerald-800/30">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Đã giải quyết
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Khóa/Mở khóa tài khoản trực tiếp nếu là báo cáo User */}
                    {report.targetUser && (
                      <button
                        onClick={() => handleToggleUserStatus(report.targetUser!.id, report.targetUser!.isActive)}
                        disabled={togglingUserId === report.targetUser.id}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-md ${
                          report.targetUser.isActive
                            ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-900/30'
                            : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-900/30'
                        }`}
                        title={report.targetUser.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      >
                        {togglingUserId === report.targetUser.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : report.targetUser.isActive ? (
                          <UserX className="h-3.5 w-3.5" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        {report.targetUser.isActive ? 'Khóa User' : 'Mở khóa User'}
                      </button>
                    )}

                    {report.status === 'PENDING' && (
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        disabled={resolvingId === report.id}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold border-0 shadow-lg shadow-indigo-650/10 cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Giải quyết
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">
              Hiển thị trang {pagination.page}/{pagination.totalPages} (Tổng số {pagination.total} báo cáo)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-30 border border-slate-855 rounded-xl text-xs font-bold text-slate-350 transition-colors border-0 cursor-pointer disabled:pointer-events-none"
              >
                Trang trước
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-30 border border-slate-855 rounded-xl text-xs font-bold text-slate-350 transition-colors border-0 cursor-pointer disabled:pointer-events-none"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminReportsPage;
