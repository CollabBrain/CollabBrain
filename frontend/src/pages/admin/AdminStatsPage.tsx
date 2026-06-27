import { useEffect, useState } from 'react';
import adminAxiosInstance from '../../services/adminAxiosInstance';
import { Users, Shield, MessageSquare, FileText, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';

interface StatUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface StatGroup {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface TrendPoint {
  date: string;
  count: number;
}

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  totalMessages: number;
  totalDocuments: number;
  recentUsers: StatUser[];
  recentGroups: StatGroup[];
  registrationTrend: TrendPoint[];
}

const AdminStatsPage = () => {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAxiosInstance.get('/stats/dashboard');
        setData(response.data.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Không thể tải thống kê hệ thống');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-6 max-w-md text-center">
          <p className="text-rose-400 font-bold mb-4">{error || 'Có lỗi xảy ra'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold border-0 cursor-pointer"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  // --- SVG Chart Calculations ---
  const trend = data.registrationTrend || [];
  const maxVal = Math.max(...trend.map(t => t.count), 5); // Minimum peak height
  const width = 600;
  const height = 150;
  const padding = 20;

  // Generate coordinates for registration trend points
  const points = trend.map((t, i) => {
    const x = padding + (i / (trend.length - 1)) * (width - padding * 2);
    const y = height - padding - (t.count / maxVal) * (height - padding * 2);
    return { x, y, ...t };
  });

  // SVG Line path
  const linePath = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') 
    : '';

  // SVG Fill path
  const fillPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Tổng quan Hệ thống
        </h1>
        <p className="text-slate-400 text-xs font-medium mt-1">
          Báo cáo thống kê hoạt động thời gian thực của dự án CollabBrain
        </p>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-indigo-950/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400">Tổng Người dùng</span>
            <div className="p-3 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/30">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{data.totalUsers}</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Hoạt động: <span className="text-emerald-400">{data.activeUsers}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Groups */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-purple-950/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400">Tổng Nhóm học</span>
            <div className="p-3 bg-purple-950/40 text-purple-400 rounded-xl border border-purple-900/30">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{data.totalGroups}</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Không gian cộng tác học tập
            </p>
          </div>
        </div>

        {/* Card 3: Messages */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-emerald-950/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400">Tổng Tin nhắn</span>
            <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-900/30">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{data.totalMessages}</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Trao đổi học thuật thời gian thực
            </p>
          </div>
        </div>

        {/* Card 4: Documents */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-sky-950/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400">Tổng Tài liệu</span>
            <div className="p-3 bg-sky-950/40 text-sky-400 rounded-xl border border-sky-900/30">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{data.totalDocuments}</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Tệp tin học liệu được tải lên
            </p>
          </div>
        </div>
      </div>

      {/* Row Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Xu hướng Đăng ký</h3>
            <p className="text-xs text-slate-400 mt-0.5">Biểu đồ lượt đăng ký tài khoản trong 7 ngày gần nhất</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 rounded-xl text-slate-400 text-xs font-bold border border-slate-800">
            <Calendar className="h-4 w-4 text-indigo-400" />
            7 ngày vừa qua
          </div>
        </div>

        {/* Interactive SVG Area Chart */}
        <div className="w-full overflow-x-auto select-none">
          <div className="min-w-[600px] h-[180px] relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="4" />
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="4" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

              {/* Area Path */}
              {fillPath && <path d={fillPath} fill="url(#gradient)" />}

              {/* Line Path */}
              {linePath && <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" />}

              {/* Data Points */}
              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" className="transition-all group-hover:r-7" />
                  
                  {/* Tooltip on Hover */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <rect x={p.x - 30} y={p.y - 32} width="60" height="22" rx="6" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1" />
                    <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#e0e7ff" fontSize="10" fontWeight="bold">
                      {p.count} user
                    </text>
                  </g>
                  
                  {/* Bottom Labels */}
                  <text x={p.x} y={height - 2} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Row Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Recent Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Thành viên Mới đăng ký</h3>
              <ArrowUpRight className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {data.recentUsers.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Chưa có người dùng nào đăng ký.</p>
              ) : (
                data.recentUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-4 p-3 bg-slate-950/40 rounded-2xl border border-slate-850 hover:border-slate-800 transition-colors">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-450 border border-indigo-900/30 flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-xs font-semibold text-slate-500 truncate">{user.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Groups */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nhóm học Mới thành lập</h3>
              <ArrowUpRight className="h-5 w-5 text-purple-400" />
            </div>
            <div className="space-y-4">
              {data.recentGroups.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Chưa có nhóm học tập nào được tạo.</p>
              ) : (
                data.recentGroups.map(group => (
                  <div key={group.id} className="flex items-center gap-4 p-3 bg-slate-950/40 rounded-2xl border border-slate-850 hover:border-slate-800 transition-colors">
                    {group.avatarUrl ? (
                      <img src={group.avatarUrl} alt={group.name} className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-950 text-purple-450 border border-purple-900/30 flex items-center justify-center font-bold text-sm">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{group.name}</p>
                      <p className="text-xs font-semibold text-slate-500">Nhóm làm việc chung</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                      {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminStatsPage;
