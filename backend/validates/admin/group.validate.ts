import { Request, Response, NextFunction } from "express";

const VALID_SORT_FIELDS = ["createdAt", "updatedAt", "name"];

export const validateGetGroups = (req: Request, res: Response, next: NextFunction) => {
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

  if (req.query.isPublic !== undefined && !["true", "false"].includes(String(req.query.isPublic))) {
    return res.status(400).json({
      success: false,
      message: "isPublic phải là true hoặc false"
    });
  }

  next();
};

export const validateGroupId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || id.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "ID nhóm không hợp lệ"
    });
  }

  next();
};
