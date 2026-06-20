import { Request, Response } from "express";
import * as groupService from "../../services/admin/group.service";

export const getGroups = async (req: Request, res: Response) => {
  try {
    const result = await groupService.getGroups(req.query as any);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách nhóm"
    });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const group = await groupService.getGroupById(id);
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error: any) {
    const statusCode = error.message === "Nhóm không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const toggleGroupStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await groupService.toggleGroupStatus(id);
    res.status(200).json({
      success: true,
      message: result.isActive ? "Mở khóa nhóm thành công" : "Khóa nhóm thành công",
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message === "Nhóm không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await groupService.deleteGroup(id);
    res.status(200).json({
      success: true,
      message: "Xóa nhóm thành công",
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message === "Nhóm không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};
