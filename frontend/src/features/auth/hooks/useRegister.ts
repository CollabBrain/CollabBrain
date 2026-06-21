import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { registerApi, verifyOtpRegisterApi } from '../services/auth.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../constants';

/** Bước 1: Gửi thông tin + nhận OTP qua email */
export const useSendRegisterOtp = () => {
  return useMutation({
    mutationFn: registerApi,
  });
};

/** Bước 2: Xác nhận OTP → tạo tài khoản + tự động đăng nhập */
export const useVerifyRegisterOtp = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: verifyOtpRegisterApi,
    onSuccess: ({ data }) => {
      const { accessToken, refreshToken } = data.data!;
      setAuth(accessToken, refreshToken);
      navigate(ROUTES.DASHBOARD);
    },
  });
};
