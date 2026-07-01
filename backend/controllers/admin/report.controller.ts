import { Request, Response } from "express";
import * as reportRepo from "../../repositories/admin/report.repo";
import { createNotification } from "../../repositories/client/notification.repo";
import { ReportStatus } from "@prisma/client";

export const getReports = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 10))));

    const result = await reportRepo.findReports(page, limit);

    res.status(200).json({
      success: true,
      data: result.reports,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách báo cáo vi phạm"
    });
  }
};

export const resolveReport = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, resolutionNotes } = req.body;

    if (!status || !Object.values(ReportStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ"
      });
    }

    const result = await reportRepo.updateReportStatus(id, status as ReportStatus, resolutionNotes);

    // If resolved and has a target user, create warning notification & push via socket
    if (status === ReportStatus.RESOLVED && result.targetUserId) {
      const notifTitle = "Cảnh báo vi phạm";
      const notifContent = resolutionNotes || "Tài khoản của bạn nhận được cảnh báo vi phạm chuẩn mực cộng đồng.";
      
      const newNotif = await createNotification(
        result.targetUserId,
        notifTitle,
        notifContent,
        "system"
      );

      const io = req.app.get("io");
      if (io) {
        io.to(result.targetUserId).emit("notification:new", {
          id: newNotif.id,
          title: newNotif.title,
          content: newNotif.content,
          type: newNotif.type,
          createdAt: newNotif.createdAt,
          isRead: newNotif.isRead
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái báo cáo thành công",
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi xử lý báo cáo vi phạm"
    });
  }
};
