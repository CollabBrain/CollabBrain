import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import adminAxiosInstance from '../services/adminAxiosInstance';

export interface SiteSettings {
  web_name: string;
  footer: string;
}

const SETTINGS_BASE = import.meta.env.VITE_API_BASE_URL_ROOT || 'http://localhost:3000';

export const defaultSettings: SiteSettings = {
  web_name: 'Studifier',
  footer: 'Studifier &copy; 2026 &bull; AI Learning Ecosystem'
};

export const useSettings = () => {
  return useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${SETTINGS_BASE}/settings`);
        if (response.data && response.data.code === 200) {
          return response.data.data;
        }
        return defaultSettings;
      } catch (e) {
        return defaultSettings;
      }
    },
    placeholderData: defaultSettings,
    staleTime: 1000 * 60 * 10,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<SiteSettings>) => {
      const response = await adminAxiosInstance.put('/settings', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    }
  });
};
