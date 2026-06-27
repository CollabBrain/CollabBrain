import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/auth.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../constants';

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[useLogin]', ...args);
const err = (...args: any[]) => console.error('[useLogin ERROR]', ...args);

export const useLogin = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      log('loginApi called with:', credentials.email);
      const response = await loginApi(credentials);
      log('loginApi response:', response.data);
      return response;
    },
    onSuccess: (response) => {
      log('onSuccess called, full response:', JSON.stringify(response.data, null, 2));
      const result = response.data;
      const tokens = result?.data;

      log('tokens extracted:', tokens);

      if (!tokens?.accessToken || !tokens?.refreshToken) {
        err('Login response missing tokens! result:', result);
        throw new Error('Đăng nhập thất bại: không nhận được token');
      }

      log('Calling setAuth with tokens');
      setAuth(tokens.accessToken, tokens.refreshToken);

      log('Calling navigate to DASHBOARD');
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: any) => {
      err('Login error:', error.message, error.response?.data);
      throw error;
    },
  });
};
