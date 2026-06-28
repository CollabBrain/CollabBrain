import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('nên khởi tạo với các giá trị mặc định là null', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('nên thiết lập thông tin xác thực với setAuth', () => {
    const { setAuth } = useAuthStore.getState();
    
    setAuth('mock-access-token-123', 'mock-refresh-token-456');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('mock-access-token-123');
    expect(state.refreshToken).toBe('mock-refresh-token-456');
    expect(state.isAuthenticated).toBe(true);

    expect(localStorage.getItem(TOKEN_KEY)).toBe('mock-access-token-123');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('mock-refresh-token-456');
  });

  it('nên xóa thông tin xác thực khi logout', () => {
    const { setAuth, logout } = useAuthStore.getState();
    
    setAuth('mock-access-token-123', 'mock-refresh-token-456');
    logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
