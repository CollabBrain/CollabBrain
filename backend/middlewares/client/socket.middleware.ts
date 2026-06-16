import { Socket } from "socket.io";
import * as repo from "../../repositories/client/user.repo"
import { verifyAccessToken } from "../../helpers/jwt";

export const socketAuthMiddleware = async (socket: Socket, next: Function) => {
  try {
    // Ưu tiên token từ auth (frontend gửi qua auth: { token })
    let token: string | undefined = socket.handshake.auth?.token;

    // Fallback: thử đọc từ cookie
    if (!token) {
      const cookieString = socket.handshake.headers.cookie;
      if (cookieString) {
        const cookies: Record<string, string> = {}
        cookieString.split("; ").forEach(cookie => {
          const eqIdx = cookie.indexOf("=");
          if (eqIdx > -1) {
            cookies[cookie.substring(0, eqIdx)] = cookie.substring(eqIdx + 1);
          }
        });
        token = cookies.accessToken;
      }
    }

    if (!token) return next(new Error("Không có access token"));

    const decoded = verifyAccessToken(token);
    if (typeof decoded === 'string' || !decoded.id) return next(new Error("Token không hợp lệ"));

    const user = await repo.findUserById(decoded.id);
    if (!user) return next(new Error("User không tồn tại"));

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error("Lỗi xác thực socket"));
  }
};