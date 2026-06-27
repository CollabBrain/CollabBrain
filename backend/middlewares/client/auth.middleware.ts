import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../../helpers/jwt";
import { findUserById } from "../../repositories/client/user.repo";
import fs from 'fs';
import path from 'path';

interface UserTokenPayload extends JwtPayload {
  id: string
}

const getToken = (req: Request) => {
  const authorization = req.headers.authorization

  if (authorization) {
    const [type, token] = authorization.split(" ")
    if (type === "Bearer" && token) {
      return token
    }
  }

  const cookieToken = req.cookies?.accessToken
  if (cookieToken) {
    return cookieToken
  }

  return ""
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const logPath = path.join(__dirname, '../../request_log.txt');
  try {
    const token = getToken(req);
    const logDetails = `[AUTH_DEBUG] URL: ${req.url} - Method: ${req.method} - Header Auth: ${req.headers.authorization ? req.headers.authorization.slice(0, 50) + '...' : 'NONE'} - Cookie Token: ${req.cookies?.accessToken ? 'YES' : 'NO'} - Selected Token: ${token ? token.slice(0, 30) + '...' : 'NONE'}\n`;
    try { fs.appendFileSync(logPath, logDetails); } catch (e) {}

    if (!token) {
      console.log('[AUTH] No token found, returning 401');
      return res.status(401).json({
        code: 401,
        message: "Vui lòng đăng nhập"
      })
    }
    
    let decoded;
    try {
      decoded = verifyAccessToken(token);
      console.log('[AUTH] Token decoded successfully:', decoded);
    } catch (verifyErr: any) {
      console.log('[AUTH] Token verify failed:', verifyErr.message);
      throw verifyErr;
    }
    
    if (typeof decoded === "string" || !decoded.id) {
      console.log('[AUTH] Decoded token missing id:', decoded);
      return res.status(401).json({
        code: 401,
        message: "Token không hợp lệ"
      })
    }
    const payload = decoded as UserTokenPayload;
    const user = await findUserById(payload.id)
    if (!user) {
      console.log('[AUTH] User not found for id:', payload.id);
      return res.status(401).json({
        code: 401,
        message: "Tài khoản không tồn tại hoặc đã bị khóa"
      })
    }
    (req as any).user = user
    console.log('[AUTH] Success! User:', user.email);
    next()
  } catch (error: any) {
    const logError = `[AUTH_ERROR] URL: ${req.url} - Error: ${error.message}\n`;
    try { fs.appendFileSync(logPath, logError); } catch (e) {}
    console.log('[AUTH] Caught error:', error.message);
    res.status(401).json({
      code: 401,
      message: "Token không hợp lệ hoặc đã hết hạn"
    })
  }
}