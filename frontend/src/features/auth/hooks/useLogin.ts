import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/auth.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../constants';

export const useLogin = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: ({ data }) => {
      const { accessToken, refreshToken } = data.data!;
      setAuth(accessToken, refreshToken);
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: any) => {
      // error.response.data.message từ backend
      throw error;
    },
  });
};
