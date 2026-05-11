import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../../helpers/jwt";
import { findUserById } from "../../repositories/client/user.repo";

interface UserTokenPayload extends JwtPayload {
  id: string
}

const getToken = (req: Request) => {
  const authorization = req.headers.authorization;
  if (!authorization) return "";

  const [type, token] = authorization.split(" ");
  if (type !== "Bearer" || !token) return "";

  return token;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({
        code: 401,
        message: "Vui lòng đăng nhập"
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    if (typeof decoded === "string" || !decoded.id) {
      res.status(401).json({
        code: 401,
        message: "Token không hợp lệ"
      });
      return;
    }

    const payload = decoded as UserTokenPayload;
    const user = await findUserById(payload.id);
    if (!user) {
      res.status(401).json({
        code: 401,
        message: "Tài khoản không tồn tại hoặc đã bị khóa"
      });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({
      code: 401,
      message: "Token không hợp lệ hoặc đã hết hạn"
    });
  }
}
