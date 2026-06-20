import { Request, Response } from "express";
import prisma from "../../config/prisma";

export const createReport = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { targetUserId, targetGroupId, reason } = req.body;

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        code: 400,
        message: "Lý do báo cáo không được để trống",
      });
    }

    if (!targetUserId && !targetGroupId) {
      return res.status(400).json({
        code: 400,
        message: "Cần cung cấp đối tượng bị báo cáo (User hoặc Group)",
      });
    }

    // Xác minh người dùng bị báo cáo
    if (targetUserId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: targetUserId, isDeleted: false },
      });
      if (!targetUser) {
        return res.status(404).json({
          code: 404,
          message: "Người dùng bị báo cáo không tồn tại hoặc đã bị xóa",
        });
      }
    }

    // Xác minh nhóm bị báo cáo
    if (targetGroupId) {
      const targetGroup = await prisma.group.findFirst({
        where: { id: targetGroupId, isDeleted: false },
      });
      if (!targetGroup) {
        return res.status(404).json({
          code: 404,
          message: "Nhóm bị báo cáo không tồn tại hoặc đã bị xóa",
        });
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetUserId: targetUserId || null,
        targetGroupId: targetGroupId || null,
        reason: reason.trim(),
        status: "PENDING",
      },
    });

    res.status(200).json({
      code: 200,
      data: report,
      message: "Gửi báo cáo vi phạm thành công",
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi gửi báo cáo vi phạm",
    });
  }
};
