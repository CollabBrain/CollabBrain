import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import {
  useForgotPasswordSendOtp,
  useForgotPasswordVerifyOtp,
  useResetPassword,
} from '../features/auth/hooks/useForgotPassword';
import FormInput from '../components/common/FormInput';
import OtpInput from '../components/common/OtpInput';
import LoadingButton from '../components/common/LoadingButton';
import { ROUTES } from '../constants';

type Step = 1 | 2 | 3 | 4;

const stepConfig = [
  { icon: Mail, label: 'Nhập email' },
  { icon: ShieldCheck, label: 'Xác minh OTP' },
  { icon: KeyRound, label: 'Mật khẩu mới' },
];

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');

  const sendOtpMutation = useForgotPasswordSendOtp();
  const verifyOtpMutation = useForgotPasswordVerifyOtp();
  const resetPasswordMutation = useResetPassword();

  const clearErrors = () => { setEmailError(''); setOtpError(''); setPasswordError(''); setGlobalError(''); };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!email.trim()) { setEmailError('Vui lòng nhập email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Email không hợp lệ'); return; }
    try {
      await sendOtpMutation.mutateAsync({ email: email.trim().toLowerCase() });
      setStep(2);
    } catch (err: any) {
      setGlobalError(err?.response?.data?.message || 'Không tìm thấy tài khoản với email này');
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (otp.length !== 6) { setOtpError('Vui lòng nhập đủ 6 chữ số'); return; }
    try {
      await verifyOtpMutation.mutateAsync({ email: email.trim().toLowerCase(), otp });
      setStep(3);
    } catch (err: any) {
      setGlobalError(err?.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn');
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!password) { setPasswordError('Vui lòng nhập mật khẩu mới'); return; }
    if (password.length < 6) { setPasswordError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    try {
      await resetPasswordMutation.mutateAsync({ email: email.trim().toLowerCase(), otp, password });
      setStep(4);
    } catch (err: any) {
      setGlobalError(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    }
  };

  if (step === 4) {
    return (
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <div className="h-20 w-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Thành công! 🎉</h1>
            <p className="text-sm text-muted-foreground">
              Mật khẩu của bạn đã được đặt lại thành công.
              <br />Hãy đăng nhập bằng mật khẩu mới.
            </p>
          </div>
        </div>
        <LoadingButton className="w-full h-10 font-semibold" onClick={() => navigate(ROUTES.LOGIN)}>
          Đến trang đăng nhập
        </LoadingButton>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <Link to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại đăng nhập
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Quên mật khẩu 🔑</h1>
        <p className="text-sm text-muted-foreground">Đặt lại mật khẩu chỉ trong 3 bước đơn giản</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {stepConfig.map(({ icon: Icon, label }, i) => {
          const s = i + 1;
          const isDone = s < step;
          const isActive = s === step;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone ? 'bg-primary text-white' :
                  isActive ? 'bg-primary text-white ring-4 ring-primary/20' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {i < stepConfig.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors duration-300 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Global error */}
      {globalError && (
        <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
          {globalError}
        </div>
      )}

      {/* Step 1: Email */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4" noValidate>
          <FormInput id="forgot-email" label="Email tài khoản" type="email"
            placeholder="example@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} error={emailError} autoComplete="email"
          />
          <LoadingButton type="submit" className="w-full h-10 font-semibold"
            isLoading={sendOtpMutation.isPending} loadingText="Đang gửi OTP...">
            <Mail className="h-4 w-4 mr-2" />
            Gửi mã xác minh
          </LoadingButton>
        </form>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6" noValidate>
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Nhập mã <strong>6 chữ số</strong> gửi đến{' '}
              <strong className="text-foreground">{email}</strong>
            </p>
            <OtpInput value={otp} onChange={setOtp} error={otpError} />
          </div>
          <LoadingButton type="submit" className="w-full h-10 font-semibold"
            isLoading={verifyOtpMutation.isPending} loadingText="Đang xác nhận...">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Xác nhận OTP
          </LoadingButton>
        </form>
      )}

      {/* Step 3: New password */}
      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-4" noValidate>
          <FormInput id="new-password" label="Mật khẩu mới" type="password"
            placeholder="Ít nhất 6 ký tự" value={password}
            onChange={(e) => setPassword(e.target.value)} error={passwordError}
            autoComplete="new-password"
          />
          {password && (
            <p className={`text-xs ${password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}`}>
              {password.length >= 6 ? '✓ Đủ độ dài tối thiểu' : `Còn thiếu ${6 - password.length} ký tự`}
            </p>
          )}
          <LoadingButton type="submit" className="w-full h-10 font-semibold"
            isLoading={resetPasswordMutation.isPending} loadingText="Đang cập nhật...">
            <KeyRound className="h-4 w-4 mr-2" />
            Đặt lại mật khẩu
          </LoadingButton>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
