import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../../helpers/jwt";
import { findUserById } from "../../repositories/client/user.repo";

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
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: "Vui lòng đăng nhập"
      })
    }
    
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (verifyErr: any) {
      throw verifyErr;
    }
    
    if (typeof decoded === "string" || !decoded.id) {
      return res.status(401).json({
        code: 401,
        message: "Token không hợp lệ"
      })
    }
    const payload = decoded as UserTokenPayload;
    const user = await findUserById(payload.id)
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: "Tài khoản không tồn tại hoặc đã bị khóa"
      })
    }
    (req as any).user = user
    next()
  } catch (error: any) {
    res.status(401).json({
      code: 401,
      message: "Token không hợp lệ hoặc đã hết hạn"
    })
  }
}