import { useState, useRef } from 'react';
import { useProfile, useEditProfile } from '../features/profile/hooks/useProfile';
import FormInput from '../components/common/FormInput';
import LoadingButton from '../components/common/LoadingButton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Pencil, X, Calendar, Mail, User as UserIcon, Camera, Loader2 } from 'lucide-react';
import AvatarUpload from '../components/common/AvatarUpload';
import RichTextEditor from '../components/common/RichTextEditor';
import axiosInstance from '../services/axiosInstance';

const ProfilePage = () => {
  const { data: user, isLoading, isError } = useProfile();
  const editMutation = useEditProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '', coverUrl: '' });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [successMsg, setSuccessMsg] = useState('');

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  const handleCoverClick = () => {
    if (!isUploadingCover) {
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
      const response = await axiosInstance.post<{ url: string }>(
        "/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.url) {
        setForm(prev => ({ ...prev, coverUrl: response.data.url }));
        setSuccessMsg('Tải ảnh bìa lên thành công!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error("Không nhận được URL ảnh từ server");
      }
    } catch (err: any) {
      console.error("Lỗi upload ảnh bìa:", err);
      setCoverUploadError(err?.response?.data?.message || err.message || "Tải ảnh bìa lên thất bại");
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = "";
      }
    }
  };

  const startEditing = () => {
    setForm({
      name: user?.name || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      coverUrl: user?.coverUrl || '',
    });
    setErrors({});
    setSuccessMsg('');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Tên không được để trống' });
      return;
    }
    try {
      await editMutation.mutateAsync({
        name: form.name.trim(),
        bio: form.bio.trim() || '',
        avatarUrl: form.avatarUrl || '',
        coverUrl: form.coverUrl || '',
      });
      setIsEditing(false);
      setSuccessMsg('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrors({ name: err?.response?.data?.message || 'Cập nhật thất bại' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="text-center text-destructive py-12 font-medium">
        Không thể tải thông tin hồ sơ. Vui lòng thử lại.
      </div>
    );
  }

  // Tạo avatar placeholder từ tên
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Hồ sơ cá nhân
        </h1>
        {!isEditing && (
          <Button
            onClick={startEditing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa hồ sơ
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-sm px-4 py-3.5 font-medium shadow-sm animate-in fade-in duration-300 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {successMsg}
        </div>
      )}

      <Card className="border border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Cover Banner */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 relative overflow-hidden group">
          {isEditing ? (
            form.coverUrl ? (
              <img src={form.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-black/10" />
            )
          ) : user.coverUrl ? (
            <img src={user.coverUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
          )}

          {/* Edit Cover Overlay Button */}
          {isEditing && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={handleCoverClick}
                disabled={isUploadingCover}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploadingCover ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                {form.coverUrl ? 'Thay đổi ảnh bìa' : 'Tải lên ảnh bìa'}
              </button>
              <input
                type="file"
                ref={coverFileInputRef}
                onChange={handleCoverChange}
                accept="image/*"
                className="hidden"
                disabled={isUploadingCover}
              />
            </div>
          )}
          
          {coverUploadError && (
            <div className="absolute bottom-2 left-2 right-2 bg-rose-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs text-center font-semibold">
              {coverUploadError}
            </div>
          )}
        </div>
        
        <CardContent className="relative px-6 pb-8 space-y-6">
          {/* Avatar and Primary details Row */}
          <div className="relative pt-16 sm:pt-0 sm:pl-36 min-h-[5rem] sm:min-h-[5.5rem] flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            {/* Absolute Avatar Wrapper */}
            <div className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 z-10">
              {isEditing ? (
                <AvatarUpload
                  value={form.avatarUrl}
                  onChange={(url) => setForm({ ...form, avatarUrl: url })}
                  nameInitial={initials}
                  className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-white dark:border-slate-900 shadow-xl"
                />
              ) : user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl ring-1 ring-border/20"
                />
              ) : (
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-white font-bold text-4xl">
                  {initials}
                </div>
              )}
            </div>

            {/* Text details wrapper */}
            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {user.name}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <Mail className="h-4 w-4 text-indigo-500" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800/60" />

          {/* View mode */}
          {!isEditing && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-indigo-500" />
                  Giới thiệu bản thân (Bio)
                </h3>
                {user.bio ? (
                  <div
                    className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 prose dark:prose-invert max-w-none break-words min-h-[100px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: user.bio }}
                  />
                ) : (
                  <div className="text-sm text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-8">
                    Chưa có mô tả bản thân. Hãy thêm giới thiệu để mọi người hiểu bạn hơn!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/60 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 shadow-sm shadow-slate-100/10 dark:shadow-none">
                  <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Địa chỉ Email</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/60 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 shadow-sm shadow-slate-100/10 dark:shadow-none">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thành viên từ</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {isEditing && (
            <form onSubmit={handleSave} className="space-y-5 animate-in fade-in duration-300" noValidate>
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
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Giới thiệu bản thân (Bio)
                  </label>
                  <RichTextEditor
                    value={form.bio}
                    onChange={(content) => setForm({ ...form, bio: content })}
                    placeholder="Giới thiệu đôi nét về bản thân, sở thích hay chuyên môn của bạn..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <LoadingButton
                  type="submit"
                  isLoading={editMutation.isPending}
                  loadingText="Đang lưu thay đổi..."
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all duration-200"
                >
                  Lưu thay đổi
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 order-first sm:order-none rounded-lg border-slate-200 dark:border-slate-800"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Hủy bỏ
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
