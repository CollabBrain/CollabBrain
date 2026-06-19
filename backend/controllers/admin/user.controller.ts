import { Request, Response } from "express";
import * as userService from "../../services/admin/user.service";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await userService.getUsers(req.query as any);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách người dùng"
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await userService.getUserById(id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    const statusCode = error.message === "Người dùng không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await userService.updateUser(id, req.body);
    res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: user
    });
  } catch (error: any) {
    const statusCode = error.message === "Người dùng không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await userService.deleteUser(id);
    res.status(200).json({
      success: true,
      message: "Xóa người dùng thành công",
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message === "Người dùng không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await userService.toggleUserStatus(id);
    res.status(200).json({
      success: true,
      message: result.isActive ? "Mở khóa người dùng thành công" : "Khóa người dùng thành công",
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message === "Người dùng không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};
