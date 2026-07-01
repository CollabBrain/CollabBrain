import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../services/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  type: string; // 'system', 'chat', 'friend', 'group'
  createdAt: string;
  updatedAt: string;
}

export const useNotifications = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<SystemNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axiosInstance.get('/notifications/list');
      if (response.data && response.data.code === 200) {
        return response.data.data;
      }
      return [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
