import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { Settings, Check, Loader2, AlertCircle, Eye, Laptop, ShieldCheck } from 'lucide-react';

const AdminSettingsPage = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [webName, setWebName] = useState('');
  const [footer, setFooter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync state with fetched settings
  useEffect(() => {
    if (settings) {
      setWebName(settings.web_name);
      setFooter(settings.footer);
    }
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webName.trim()) {
      showToast('Tên hiển thị Website không được để trống', 'error');
      return;
    }
    if (!footer.trim()) {
      showToast('Nội dung Footer không được để trống', 'error');
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        web_name: webName,
        footer: footer,
      });
      showToast('Cập nhật cấu hình hệ thống thành công!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cấu hình', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left relative pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md animate-in slide-in-from-top duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/40' 
            : 'bg-rose-950/90 text-rose-300 border-rose-800/40'
        }`}>
          {toast.type === 'success' ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400 animate-bounce" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-450" />
          )}
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Decorative Glow Backgrounds */}
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[250px] h-[250px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      {/* Header Title Section */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cài đặt hệ thống
          </h1>
        </div>
        <p className="text-slate-400 text-xs font-semibold pl-14">
          Thay đổi thương hiệu hiển thị động như Tên ứng dụng trên thanh Sidebar, mobile header, trang Landing Page và văn bản Footer.
        </p>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-450 text-xs font-bold tracking-wide">Đang tải cấu hình hệ thống...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form Card */}
          <div className="bg-slate-900/45 border border-slate-800 rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.2)] backdrop-blur-md relative group">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-600" />
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-2 pb-3 border-b border-slate-800">
                <span>Cấu hình Thương hiệu</span>
              </h3>

              <div className="space-y-2.5">
                <label htmlFor="webName" className="block text-xs font-black text-slate-300 uppercase tracking-widest pl-0.5">
                  Tên hiển thị Website
                </label>
                <input
                  id="webName"
                  type="text"
                  value={webName}
                  onChange={(e) => setWebName(e.target.value)}
                  placeholder="Ví dụ: CollabBrain, Studifier..."
                  className="w-full px-4 py-3.5 text-sm bg-slate-950/70 border border-slate-800/80 rounded-2xl text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-650/30 focus:border-indigo-500 transition-all font-semibold shadow-inner"
                />
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Thay đổi Logo thương hiệu và từ khóa thay thế hiển thị trong hệ thống.
                </p>
              </div>

              <div className="space-y-2.5">
                <label htmlFor="footer" className="block text-xs font-black text-slate-300 uppercase tracking-widest pl-0.5">
                  Nội dung Footer
                </label>
                <textarea
                  id="footer"
                  rows={4}
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Nhập nội dung Footer..."
                  className="w-full px-4 py-3.5 text-sm bg-slate-950/70 border border-slate-800/80 rounded-2xl text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-650/30 focus:border-indigo-500 transition-all font-semibold resize-none shadow-inner leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Hiển thị dưới chân trang giới thiệu và màn hình Đăng ký / Đăng nhập. Bạn có thể sử dụng các ký tự đặc biệt HTML như <code>&amp;copy;</code> hoặc <code>&amp;bull;</code>.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-550 hover:to-violet-550 disabled:opacity-50 text-white rounded-2xl text-xs font-black border-0 shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 cursor-pointer flex items-center gap-2 transition-all duration-200 active:scale-95 transform tracking-wider uppercase animate-duration-150"
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Live Preview Card */}
          <div className="bg-slate-900/45 border border-slate-800 rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.2)] backdrop-blur-md p-8 space-y-6 relative group text-left">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />

            <h3 className="text-base font-extrabold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Xem trước trực tiếp (Live Preview)</span>
            </h3>

            {/* Sidebar Logo Mini View */}
            <div className="space-y-3">
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Logo trên Sidebar và Web Header</span>
              <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm select-none">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[20px] font-black text-indigo-600 tracking-tight leading-none">
                    {webName.trim() || 'Studifier'}
                  </span>
                  <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest pl-0.5">
                    AI LEARNING
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5 bg-slate-50">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" /> Bản Desktop
                </div>
              </div>
            </div>

            {/* Footer Mini View */}
            <div className="space-y-3">
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Dưới chân trang giới thiệu và Đăng nhập</span>
              <div className="p-6 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center min-h-[90px] shadow-inner text-center">
                <div 
                  className="text-xs font-semibold text-slate-400 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: footer.trim() || 'Studifier &copy; 2026 &bull; AI Learning Ecosystem' }}
                />
              </div>
            </div>
            
            {/* Guide Info Box */}
            <div className="bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl flex items-start gap-3 mt-4 text-left">
              <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-350 leading-none">Đặc tả hiển thị (Rendering Engine)</p>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Thay đổi được lưu vào cơ sở dữ liệu sẽ hiển thị đồng bộ trên toàn bộ nền tảng. Nhấn nút <strong>Lưu cấu hình</strong> ở phía bên trái để lưu thay đổi thực tế.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
