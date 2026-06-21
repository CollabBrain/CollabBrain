import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

// Cấu hình QueryClient mặc định
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 phút — data coi là "fresh" trong 5 phút
      gcTime: 1000 * 60 * 10,     // 10 phút — giữ cache trong 10 phút
      retry: 1,                    // Thử lại 1 lần nếu thất bại
      refetchOnWindowFocus: false, // Không refetch khi focus lại tab
    },
    mutations: {
      retry: 0,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Bọc toàn bộ app với các Providers cần thiết
 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Chỉ hiện DevTools trong môi trường development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
