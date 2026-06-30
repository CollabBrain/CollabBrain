import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../helpers/jwt";
import { findAccountById } from "../../repositories/admin/admin.repo";

interface AdminTokenPayload {
  id: string;
  role: string;
}

const getToken = (req: Request) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return "";
  }
  const [type, token] = authorization.split(" ");
  if (type !== "Bearer" || !token) {
    return "";
  }
  return token;
};

export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập admin"
      });
    }

    const decoded = verifyAccessToken(token);
    if (typeof decoded === "string" || !decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ"
      });
    }

    const payload = decoded as AdminTokenPayload;
    
    // Check if account exists and is active
    const account = await findAccountById(payload.id);
    if (!account || !account.isActive || account.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị khóa"
      });
    }

    // Check if role is admin/manager/staff (any authenticated account is allowed in base middleware)
    (req as any).admin = account;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn"
    });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn"
      });
    }

    if (!allowedRoles.includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này"
      });
    }

    next();
  };
};
