import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfileApi, editProfileApi } from '../services/profile.service';

export const PROFILE_QUERY_KEY = ['profile'] as const;

/** Lấy thông tin profile hiện tại */
export const useProfile = () => {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const res = await getProfileApi();
      return res.data.data!;
    },
    retry: false,
  });
};

/** Cập nhật thông tin profile */
export const useEditProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editProfileApi,
    onSuccess: ({ data }) => {
      // Cập nhật cache ngay lập tức — UI phản hồi nhanh
      queryClient.setQueryData(PROFILE_QUERY_KEY, data.data);
    },
  });
};
