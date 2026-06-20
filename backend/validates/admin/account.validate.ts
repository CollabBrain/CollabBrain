import { Request, Response, NextFunction } from "express";

const VALID_ROLES = ["ADMIN", "MANAGER", "STAFF"];
const VALID_SORT_FIELDS = ["createdAt", "updatedAt", "username"];

export const validateGetAccounts = (req: Request, res: Response, next: NextFunction) => {
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

  if (sortBy !== undefined && !VALID_SORT_FIELDS.includes(String(sortBy))) {
    return res.status(400).json({
      success: false,
      message: `SortBy phải là một trong: ${VALID_SORT_FIELDS.join(", ")}`
    });
  }

  if (req.query.role !== undefined && !VALID_ROLES.includes(String(req.query.role))) {
    return res.status(400).json({
      success: false,
      message: `Role phải là một trong: ${VALID_ROLES.join(", ")}`
    });
  }

  next();
};

export const validateAccountId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || id.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "ID tài khoản không hợp lệ"
    });
  }

  next();
};

export const validateCreateAccount = (req: Request, res: Response, next: NextFunction) => {
  const { username, password, role } = req.body;
  const errors: string[] = [];

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    errors.push("Username phải có ít nhất 3 ký tự");
  }
  if (username && username.length > 50) {
    errors.push("Username không được vượt quá 50 ký tự");
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push("Password phải có ít nhất 6 ký tự");
  }
  if (password && password.length > 100) {
    errors.push("Password không được vượt quá 100 ký tự");
  }

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    errors.push(`Role phải là một trong: ${VALID_ROLES.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(", ")
    });
  }

  next();
};

export const validateUpdateAccount = (req: Request, res: Response, next: NextFunction) => {
  const { username, role, password } = req.body;
  const errors: string[] = [];

  if (username !== undefined) {
    if (typeof username !== "string" || username.trim().length < 3) {
      errors.push("Username phải có ít nhất 3 ký tự");
    }
    if (username.length > 50) {
      errors.push("Username không được vượt quá 50 ký tự");
    }
  }

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    errors.push(`Role phải là một trong: ${VALID_ROLES.join(", ")}`);
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 6) {
      errors.push("Password phải có ít nhất 6 ký tự");
    }
    if (password.length > 100) {
      errors.push("Password không được vượt quá 100 ký tự");
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
