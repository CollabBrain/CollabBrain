import { io, Socket } from 'socket.io-client';

// URL socket: chỉ cần host + port, không cần path /user
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');

let socket: Socket | null = null;

/**
 * Khởi tạo kết nối socket với token xác thực
 */
export const initSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  // Nếu đã có socket nhưng chưa kết nối, hủy để tạo mới
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
};

/**
 * Lấy instance socket hiện tại
 */
export const getSocket = (): Socket | null => socket;

/**
 * Ngắt kết nối socket (dùng khi logout)
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and cleaned up.');
  }
};
