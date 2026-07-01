import { Request, Response } from "express";
import * as notificationRepo from "../../repositories/client/notification.repo";

export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ code: 401, message: "Unauthorized" });
    }

    const settings = await notificationRepo.getNotificationSettings(userId);

    res.status(200).json({
      code: 200,
      message: "Lấy cài đặt thông báo thành công",
      data: settings
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi lấy cài đặt thông báo"
    });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ code: 401, message: "Unauthorized" });
    }

    const settings = await notificationRepo.updateNotificationSettings(userId, req.body);

    res.status(200).json({
      code: 200,
      message: "Cập nhật cài đặt thông báo thành công",
      data: settings
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi cập nhật cài đặt thông báo"
    });
  }
};

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ code: 401, message: "Unauthorized" });
    }

    const notifications = await notificationRepo.getNotifications(userId);

    res.status(200).json({
      code: 200,
      message: "Lấy danh sách thông báo thành công",
      data: notifications
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi lấy danh sách thông báo"
    });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const id = req.params.id as string;

    if (!userId) {
      return res.status(401).json({ code: 401, message: "Unauthorized" });
    }

    const notification = await notificationRepo.markAsRead(id, userId);

    res.status(200).json({
      code: 200,
      message: "Đánh dấu thông báo đã đọc thành công",
      data: notification
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi cập nhật trạng thái thông báo"
    });
  }
};

