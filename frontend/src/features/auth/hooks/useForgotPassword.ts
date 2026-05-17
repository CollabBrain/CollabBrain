import { useMutation } from '@tanstack/react-query';
import { forgotPasswordApi, verifyOtpForgotApi, resetPasswordApi } from '../services/auth.service';

/** Bước 1: Nhập email → gửi OTP */
export const useForgotPasswordSendOtp = () => {
  return useMutation({
    mutationFn: forgotPasswordApi,
  });
};

/** Bước 2: Xác nhận OTP */
export const useForgotPasswordVerifyOtp = () => {
  return useMutation({
    mutationFn: verifyOtpForgotApi,
  });
};

/** Bước 3: Đặt lại mật khẩu */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPasswordApi,
  });
};
