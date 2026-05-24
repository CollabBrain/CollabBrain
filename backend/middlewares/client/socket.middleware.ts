import { Socket } from "socket.io";
import * as repo from "../../repositories/client/user.repo"
import { verifyAccessToken } from "../../helpers/jwt";
export const socketAuthMiddleware = async (socket: Socket, next: Function) => {
  try {
    const cookieString = socket.handshake.headers.cookie;
    if (!cookieString) return next(new Error("Không có cookie"))
    
    const cookies: Record<string, string> = {}
    cookieString.split("; ").forEach(cookie => {
      const [key, value] = cookie.split("=")
      cookies[key] = value
    })

    const token = cookies.accessToken
    if (!token) return next(new Error("Không có access token"))

    const decoded = verifyAccessToken(token)
    if (typeof decoded === 'string' || !decoded.id) return next(new Error("Không có token"))
    
    const user = await repo.findUserById(decoded.id)
    if (!user) return next(new Error("User không tồn tại"))
      
    socket.data.user = user
    next()
  } catch (error) {
    next(new Error("Lỗi xác thực socket"))
  }
}