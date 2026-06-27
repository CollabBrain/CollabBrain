import { useState, useRef } from 'react';
import { useProfile, useEditProfile, useUpdateStatus } from '../features/profile/hooks/useProfile';
import FormInput from '../components/common/FormInput';
import LoadingButton from '../components/common/LoadingButton';
import { Button } from '../components/ui/button';
import { Pencil, Calendar, Mail, User as UserIcon, Camera, Loader2, CheckCircle, AlertCircle, Smile, Clock, Bell } from 'lucide-react';
import AvatarUpload from '../components/common/AvatarUpload';
import RichTextEditor from '../components/common/RichTextEditor';
import axiosInstance from '../services/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationSettingsPanel } from '../components/NotificationSettingsPanel';

// ——— Quick status presets ———
const STATUS_PRESETS = [
  { emoji: '📚', text: 'Đang học' },
  { emoji: '🧠', text: 'Đang ôn thi' },
  { emoji: '😴', text: 'Buồn ngủ' },
  { emoji: '😪', text: 'Mệt mỏi' },
  { emoji: '😩', text: 'Lười biếng' },
  { emoji: '💪', text: 'Cố gắng nào!' },
  { emoji: '😰', text: 'Stress quá' },
  { emoji: '☕', text: 'Đang uống cà phê' },
  { emoji: '🎯', text: 'Tập trung cao độ' },
  { emoji: '😤', text: 'Chán thật sự' },
];

// ——— Status Badge Component ———
const StatusBadge = ({ status, statusExpiresAt }: { status: string | null; statusExpiresAt: string | null }) => {
  if (!status || !statusExpiresAt) return null;
  const expiresAt = new Date(statusExpiresAt);
  if (expiresAt <= new Date()) return null;

  const remaining = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const timeText = hoursLeft > 0 ? `${hoursLeft}h còn lại` : `${minutesLeft}p còn lại`;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mt-2">
      <span className="text-sm">{status}</span>
      <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold">
        <Clock className="w-3 h-3" />
        {timeText}
      </span>
    </div>
  );
};

// ——— Status Editor ———
const StatusEditor = ({
  currentStatus,
  onSave,
  onClear,
  isSaving,
}: {
  currentStatus: string | null;
  onSave: (status: string) => void;
  onClear: () => void;
  isSaving: boolean;
}) => {
  const [statusInput, setStatusInput] = useState(currentStatus || '');
  const MAX_LEN = 80;
  const remaining = MAX_LEN - statusInput.length;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
          <Smile className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Trạng thái</p>
          <p className="text-xs text-slate-400">Hiển thị trong 24 giờ · Tối đa 80 ký tự</p>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        {STATUS_PRESETS.map(preset => (
          <button
            key={preset.text}
            type="button"
            onClick={() => setStatusInput(`${preset.emoji} ${preset.text}`)}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-all',
              statusInput === `${preset.emoji} ${preset.text}`
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
            ].join(' ')}
          >
            <span>{preset.emoji}</span>
            {preset.text}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="relative">
        <input
          type="text"
          value={statusInput}
          onChange={e => setStatusInput(e.target.value.slice(0, MAX_LEN))}
          placeholder="Hoặc nhập trạng thái của bạn..."
          className="w-full px-4 py-2.5 pr-16 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
        />
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${remaining < 10 ? 'text-rose-500' : 'text-slate-400'}`}>
          {remaining}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!statusInput.trim() || isSaving}
          onClick={() => onSave(statusInput.trim())}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 border-0"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smile className="w-4 h-4" />}
          Đặt trạng thái
        </button>
        {currentStatus && (
          <button
            type="button"
            disabled={isSaving}
            onClick={onClear}
            className="px-4 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all border-0 disabled:opacity-50"
          >
            Xóa trạng thái
          </button>
        )}
      </div>
    </div>
  );
};

// ——— Main ProfilePage ———
const ProfilePage = () => {
  const { data: user, isLoading, isError } = useProfile();
  const editMutation = useEditProfile();
  const statusMutation = useUpdateStatus();
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  const [isEditing, setIsEditing] = useState(false);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '', coverUrl: '' });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [successMsg, setSuccessMsg] = useState('');

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  const handleCoverClick = () => {
    if (!isUploadingCover && isEditing) {
      coverFileInputRef.current?.click();
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.value ? e.target.files : null;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setCoverUploadError("Vui lòng chọn một tệp hình ảnh hợp lệ.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCoverUploadError("Kích thước ảnh không được vượt quá 10MB.");
      return;
    }

    setIsUploadingCover(true);
    setCoverUploadError(null);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axiosInstance.post<{ url: string }>("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.url) {
        setForm(prev => ({ ...prev, coverUrl: response.data.url }));
        setSuccessMsg('Tải ảnh bìa lên thành công!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error("Không nhận được URL ảnh từ server");
      }
    } catch (err: any) {
      setCoverUploadError(err?.response?.data?.message || err.message || "Tải ảnh bìa lên thất bại");
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }
  };

  const startEditing = () => {
    setForm({ name: user?.name || '', bio: user?.bio || '', avatarUrl: user?.avatarUrl || '', coverUrl: user?.coverUrl || '' });
    setErrors({});
    setSuccessMsg('');
    setIsEditing(true);
    setShowStatusEditor(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Tên không được để trống' }); return; }
    try {
      await editMutation.mutateAsync({ name: form.name.trim(), bio: form.bio.trim() || '', avatarUrl: form.avatarUrl || '', coverUrl: form.coverUrl || '' });
      setIsEditing(false);
      setSuccessMsg('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrors({ name: err?.response?.data?.message || 'Cập nhật thất bại' });
    }
  };

  const handleStatusSave = async (status: string) => {
    try {
      await statusMutation.mutateAsync({ status });
      setShowStatusEditor(false);
      setSuccessMsg('Đã đặt trạng thái thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {}
  };

  const handleStatusClear = async () => {
    try {
      await statusMutation.mutateAsync({ status: null });
      setShowStatusEditor(false);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <div className="text-center text-rose-500 py-12 font-medium">Không thể tải thông tin hồ sơ. Vui lòng thử lại.</div>;
  }

  const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const currentCoverUrl = isEditing ? form.coverUrl : user.coverUrl;

  return (
    <div className="min-h-screen bg-slate-50 font-sans -mt-8 -mx-8 pb-12">
      {/* ——— Cover Banner ——— */}
      <div className="h-52 md:h-64 relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 group">
        {currentCoverUrl ? (
          <img src={currentCoverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

        {isEditing && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button type="button" onClick={handleCoverClick} disabled={isUploadingCover}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 backdrop-blur-md text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
              {isUploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {currentCoverUrl ? 'Thay đổi ảnh bìa' : 'Tải lên ảnh bìa'}
            </button>
            <input type="file" ref={coverFileInputRef} onChange={handleCoverChange} accept="image/*" className="hidden" disabled={isUploadingCover} />
          </div>
        )}
      </div>

      {/* ——— Header Info ——— */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <div className="flex flex-col sm:flex-row gap-4 relative sm:items-start">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shrink-0 border-4 border-white shadow-xl ring-2 ring-white -mt-10 sm:-mt-14 z-10 overflow-hidden">
              {isEditing ? (
                <AvatarUpload value={form.avatarUrl} onChange={(url) => setForm({ ...form, avatarUrl: url })} nameInitial={initials} className="w-full h-full rounded-full" />
              ) : user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-3 sm:pt-4 pb-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{user.name}</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
              {/* Status Badge */}
              <StatusBadge status={user.status} statusExpiresAt={user.statusExpiresAt} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 sm:pt-4 sm:pb-3">
              {!isEditing && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStatusEditor(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-slate-200 cursor-pointer"
                  >
                    <Smile className="h-4 w-4 text-indigo-500" />
                    {user.status ? 'Đổi trạng thái' : 'Đặt trạng thái'}
                  </Button>
                  <Button
                    onClick={startEditing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200"
                  >
                    <Pencil className="h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-8 space-y-6">
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Status Editor */}
        {showStatusEditor && !isEditing && (
          <StatusEditor
            currentStatus={user.status}
            onSave={handleStatusSave}
            onClear={handleStatusClear}
            isSaving={statusMutation.isPending}
          />
        )}

        {/* Notification Settings - only show when authenticated */}
        {isAuthenticated && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <button
              type="button"
              onClick={() => setShowStatusEditor(false)}
              className="w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-800">Cài đặt thông báo</h3>
                  <p className="text-xs text-slate-500 font-medium">Quản lý cách bạn nhận thông báo</p>
                </div>
              </div>
            </button>
            <NotificationSettingsPanel />
          </div>
        )}

        {/* View mode */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <UserIcon className="h-4 w-4 text-indigo-500" />
                  Giới thiệu bản thân
                </h3>
                {user.bio ? (
                  <div className="text-sm text-slate-700 prose max-w-none break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: user.bio }} />
                ) : (
                  <div className="text-sm text-slate-400 italic text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chưa có mô tả bản thân. Hãy thêm giới thiệu để mọi người hiểu bạn hơn!
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Thông tin thêm</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Mail className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Calendar className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tham gia từ</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Cập nhật thông tin</h3>
            <form onSubmit={handleSave} className="space-y-5" noValidate>
              <div className="space-y-4">
                <FormInput
                  id="profile-name"
                  label="Họ và tên"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  placeholder="Nhập họ và tên của bạn..."
                />
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Giới thiệu bản thân (Bio)</label>
                  <RichTextEditor value={form.bio} onChange={(content) => setForm({ ...form, bio: content })} placeholder="Giới thiệu đôi nét về bản thân, sở thích hay chuyên môn của bạn..." />
                </div>
              </div>

              {coverUploadError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {coverUploadError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <LoadingButton type="submit" isLoading={editMutation.isPending} loadingText="Đang lưu..."
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all py-2.5 font-bold">
                  Lưu thay đổi
                </LoadingButton>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}
                  className="flex-1 order-first sm:order-none rounded-xl border-slate-200 py-2.5 font-bold">
                  Hủy bỏ
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
