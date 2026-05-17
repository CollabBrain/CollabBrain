import { useState } from 'react';
import { useProfile, useEditProfile } from '../features/profile/hooks/useProfile';
import FormInput from '../components/common/FormInput';
import LoadingButton from '../components/common/LoadingButton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Pencil, X } from 'lucide-react';

const ProfilePage = () => {
  const { data: user, isLoading, isError } = useProfile();
  const editMutation = useEditProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '' });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [successMsg, setSuccessMsg] = useState('');

  const startEditing = () => {
    setForm({ name: user?.name || '', bio: user?.bio || '' });
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
      await editMutation.mutateAsync({ name: form.name.trim(), bio: form.bio.trim() || undefined });
      setIsEditing(false);
      setSuccessMsg('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrors({ name: err?.response?.data?.message || 'Cập nhật thất bại' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="text-center text-destructive py-12">
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
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>

      {successMsg && (
        <div className="rounded-md bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-2.5">
          {successMsg}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                {initials}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* View mode */}
          {!isEditing && (
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Bio</p>
                <p className="text-sm">{user.bio || <span className="text-muted-foreground italic">Chưa có mô tả</span>}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Ngày tham gia</p>
                <p className="text-sm">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {isEditing && (
            <form onSubmit={handleSave} className="space-y-4" noValidate>
              <FormInput
                id="profile-name"
                label="Họ và tên"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
              />

              <div className="space-y-1.5">
                <label htmlFor="profile-bio" className="text-sm font-medium">
                  Bio
                </label>
                <textarea
                  id="profile-bio"
                  rows={3}
                  placeholder="Giới thiệu về bản thân..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <LoadingButton
                  type="submit"
                  isLoading={editMutation.isPending}
                  loadingText="Đang lưu..."
                  className="flex-1"
                >
                  Lưu thay đổi
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Hủy
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
