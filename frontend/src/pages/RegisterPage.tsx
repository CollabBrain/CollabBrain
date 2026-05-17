import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { useSendRegisterOtp, useVerifyRegisterOtp } from '../features/auth/hooks/useRegister';
import FormInput from '../components/common/FormInput';
import OtpInput from '../components/common/OtpInput';
import LoadingButton from '../components/common/LoadingButton';
import { ROUTES } from '../constants';

type Step = 1 | 2;

const steps = ['Thông tin tài khoản', 'Xác minh email'];

const RegisterPage = () => {
  const [step, setStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [errors1, setErrors1] = useState<Partial<typeof form> & { global?: string }>({});
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [globalOtpError, setGlobalOtpError] = useState('');

  const sendOtpMutation = useSendRegisterOtp();
  const verifyOtpMutation = useVerifyRegisterOtp();

  const validate1 = () => {
    const errs: typeof errors1 = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) errs.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    setErrors1(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate1()) return;
    setErrors1({});
    try {
      await sendOtpMutation.mutateAsync({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
      });
      setStep(2);
    } catch (err: any) {
      setErrors1({ global: err?.response?.data?.message || 'Đã xảy ra lỗi, thử lại' });
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError('Vui lòng nhập đủ 6 chữ số OTP'); return; }
    setOtpError('');
    setGlobalOtpError('');
    try {
      await verifyOtpMutation.mutateAsync({
        email: form.email.trim().toLowerCase(),
        otp,
        password: form.password,
        name: form.name.trim(),
      });
    } catch (err: any) {
      setGlobalOtpError(err?.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn');
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">
          {step === 1 ? 'Tạo tài khoản ✨' : 'Xác minh email 📬'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 ? (
            <>
              Đã có tài khoản?{' '}
              <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline underline-offset-4">
                Đăng nhập
              </Link>
            </>
          ) : (
            <>Mã OTP đã gửi đến <strong className="text-foreground">{form.email}</strong></>
          )}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((label, i) => {
          const s = i + 1;
          const isActive = s === step;
          const isDone = s < step;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-2 ${i === 0 ? '' : ''}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  isDone ? 'bg-primary text-white' :
                  isActive ? 'bg-primary text-white ring-4 ring-primary/20' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <>
          {errors1.global && (
            <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
              {errors1.global}
            </div>
          )}
          <form onSubmit={handleStep1} className="space-y-4" noValidate>
            <FormInput
              id="reg-name"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors1.name}
              autoComplete="name"
            />
            <FormInput
              id="reg-email"
              label="Email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors1.email}
              autoComplete="email"
            />
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium">Mật khẩu</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ít nhất 6 ký tự"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow ${
                    errors1.password ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors1.password && <p className="text-xs text-destructive" role="alert">{errors1.password}</p>}
              {/* Password strength hint */}
              {form.password && (
                <p className={`text-xs ${form.password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {form.password.length >= 6 ? '✓ Đủ độ dài tối thiểu' : `Còn thiếu ${6 - form.password.length} ký tự`}
                </p>
              )}
            </div>
            <LoadingButton type="submit" className="w-full h-10 font-semibold"
              isLoading={sendOtpMutation.isPending} loadingText="Đang gửi OTP...">
              <UserPlus className="h-4 w-4 mr-2" />
              Tiếp tục
            </LoadingButton>
          </form>
        </>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6" noValidate>
          {globalOtpError && (
            <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
              {globalOtpError}
            </div>
          )}
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Nhập mã <strong>6 chữ số</strong> trong email của bạn
              <br/>
              <span className="text-xs">(Có hiệu lực trong 5 phút)</span>
            </p>
            <OtpInput value={otp} onChange={setOtp} error={otpError} />
          </div>
          <LoadingButton type="submit" className="w-full h-10 font-semibold"
            isLoading={verifyOtpMutation.isPending} loadingText="Đang xác nhận...">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Xác nhận & Tạo tài khoản
          </LoadingButton>
          <p className="text-center">
            <button type="button" onClick={() => setStep(1)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Quay lại chỉnh sửa thông tin
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

export default RegisterPage;
