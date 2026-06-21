import { Request, Response, NextFunction } from "express";

export const validateGetUsers = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, sortBy, order } = req.query;

  if (page !== undefined && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page phải là số nguyên dương"
    });
  }

  if (limit !== undefined && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: "Limit phải từ 1 đến 100"
    });
  }

  if (order !== undefined && !["asc", "desc"].includes(String(order).toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: "Order phải là asc hoặc desc"
    });
  }

  if (sortBy !== undefined && !["createdAt", "updatedAt", "name", "email"].includes(String(sortBy))) {
    return res.status(400).json({
      success: false,
      message: "SortBy không hợp lệ"
    });
  }

  next();
};

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || id.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "ID người dùng không hợp lệ"
    });
  }

  next();
};

export const validateUpdateUser = (req: Request, res: Response, next: NextFunction) => {
  const { name, avatarUrl, bio } = req.body;
  const errors: string[] = [];

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 1) {
      errors.push("Name không được để trống");
    }
    if (name.length > 100) {
      errors.push("Name không được vượt quá 100 ký tự");
    }
  }

  if (avatarUrl !== undefined && typeof avatarUrl !== "string") {
    errors.push("AvatarUrl phải là chuỗi");
  }

  if (bio !== undefined) {
    if (typeof bio !== "string") {
      errors.push("Bio phải là chuỗi");
    }
    if (bio.length > 500) {
      errors.push("Bio không được vượt quá 500 ký tự");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(", ")
    });
  }

  next();
};
