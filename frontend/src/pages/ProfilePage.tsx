import { useState } from 'react';
import { useProfile, useEditProfile } from '../features/profile/hooks/useProfile';
import FormInput from '../components/common/FormInput';
import LoadingButton from '../components/common/LoadingButton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Pencil, X, Calendar, Mail, User as UserIcon } from 'lucide-react';
import AvatarUpload from '../components/common/AvatarUpload';
import RichTextEditor from '../components/common/RichTextEditor';

const ProfilePage = () => {
  const { data: user, isLoading, isError } = useProfile();
  const editMutation = useEditProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '' });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [successMsg, setSuccessMsg] = useState('');

  const startEditing = () => {
    setForm({
      name: user?.name || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Hồ sơ cá nhân
        </h1>
        {!isEditing && (
          <Button
            onClick={startEditing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200"
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Chỉnh sửa hồ sơ
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm px-4 py-3 font-medium shadow-sm animate-in fade-in duration-300">
          {successMsg}
        </div>
      )}

      <Card className="border border-border/80 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
        
        <CardContent className="relative pt-0 px-6 pb-6 space-y-6">
          {/* Avatar and Primary details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10 sm:-mt-12 mb-4">
            {isEditing ? (
              <AvatarUpload
                value={form.avatarUrl}
                onChange={(url) => setForm({ ...form, avatarUrl: url })}
                nameInitial={initials}
                className="h-24 w-24 border-4 border-white dark:border-slate-900 shadow-lg"
              />
            ) : user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg ring-1 ring-border/20"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-white font-bold text-3xl">
                {initials}
              </div>
            )}

            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                {user.name}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* View mode */}
          {!isEditing && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Giới thiệu bản thân (Bio)
                </p>
                {user.bio ? (
                  <div
                    className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-border/80 prose dark:prose-invert max-w-none break-words min-h-[100px]"
                    dangerouslySetInnerHTML={{ __html: user.bio }}
                  />
                ) : (
                  <div className="text-sm text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-border/80 text-center py-6">
                    Chưa có mô tả bản thân. Hãy thêm giới thiệu để mọi người hiểu bạn hơn!
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 px-4 py-3 rounded-lg border border-border/40">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <span>Thành viên từ: </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
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
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Lưu thay đổi
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 order-first sm:order-none"
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
