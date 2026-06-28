import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../services/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';

export interface NotificationSettings {
  enableAll: boolean;
  enableChat: boolean;
  enableFriend: boolean;
  enableGroup: boolean;
  enableSystem: boolean;
  enableSound: boolean;
  enableVibrate: boolean;
  chatPriority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const defaultNotificationSettings: NotificationSettings = {
  enableAll: true,
  enableChat: true,
  enableFriend: true,
  enableGroup: true,
  enableSystem: true,
  enableSound: true,
  enableVibrate: true,
  chatPriority: 'HIGH',
};

export const useNotificationSettings = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<NotificationSettings>({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const response = await axiosInstance.get('/notifications');
      if (response.data && response.data.code === 200) {
        return response.data.data;
      }
      return defaultNotificationSettings;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const response = await axiosInstance.put('/notifications', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
};
