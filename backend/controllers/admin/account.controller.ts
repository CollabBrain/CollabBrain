import { Request, Response } from "express";
import * as accountService from "../../services/admin/account.service";

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const result = await accountService.getAccounts(req.query as any);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách tài khoản"
    });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const account = await accountService.getAccountById(id);
    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error: any) {
    const statusCode = error.message === "Tài khoản không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const account = await accountService.createAccount(req.body);
    res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
      data: account
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const account = await accountService.updateAccount(id, req.body);
    res.status(200).json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      data: account
    });
  } catch (error: any) {
    const statusCode = error.message === "Tài khoản không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await accountService.deleteAccount(id);
    res.status(200).json({
      success: true,
      message: "Xóa tài khoản thành công",
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message === "Tài khoản không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const toggleAccountStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await accountService.toggleAccountStatus(id);
    res.status(200).json({
      success: true,
      message: result.isActive ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công",
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message === "Tài khoản không tồn tại" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};
