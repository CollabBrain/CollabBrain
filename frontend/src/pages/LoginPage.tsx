import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useLogin } from '../features/auth/hooks/useLogin';
import FormInput from '../components/common/FormInput';
import LoadingButton from '../components/common/LoadingButton';
import { ROUTES } from '../constants';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});

  const loginMutation = useLogin();

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email không hợp lệ';
    if (!password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) errs.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setErrors({});
    try {
      await loginMutation.mutateAsync({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng nhập thất bại';
      setErrors({ global: msg });
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Chào mừng trở lại 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link to={ROUTES.REGISTER} className="font-semibold text-primary hover:underline underline-offset-4">
            Đăng ký miễn phí
          </Link>
        </p>
      </div>

      {/* Global error */}
      {errors.global && (
        <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
          {errors.global}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormInput
          id="login-email"
          label="Email"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium">
              Mật khẩu
            </label>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-primary font-medium hover:underline underline-offset-4"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow ${
                errors.password ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive" role="alert">{errors.password}</p>
          )}
        </div>

        <LoadingButton
          type="submit"
          className="w-full h-10 font-semibold"
          isLoading={loginMutation.isPending}
          loadingText="Đang đăng nhập..."
        >
          <LogIn className="h-4 w-4 mr-2" />
          Đăng nhập
        </LoadingButton>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">hoặc</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        <Link to={ROUTES.REGISTER} className="font-semibold text-primary hover:underline underline-offset-4">
          Tạo tài khoản mới →
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
