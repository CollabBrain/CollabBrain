import { Request, Response } from "express";
import prisma from "../../config/prisma";
import moment from "moment";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGroups,
      totalMessages,
      totalDocuments,
      recentUsers,
      recentGroups
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false, isActive: true } }),
      prisma.group.count({ where: { isDeleted: false } }),
      prisma.message.count(),
      prisma.document.count({ where: { isDeleted: false } }),
      prisma.user.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true
        }
      }),
      prisma.group.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          createdAt: true
        }
      })
    ]);

    // Lấy thống kê đăng ký trong 7 ngày qua để vẽ biểu đồ
    const registrationTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, "days");
      const startOfDay = date.startOf("day").toDate();
      const endOfDay = date.endOf("day").toDate();

      const count = await prisma.user.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      registrationTrend.push({
        date: date.format("DD/MM"),
        count
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalGroups,
        totalMessages,
        totalDocuments,
        recentUsers,
        recentGroups,
        registrationTrend
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi tải thống kê hệ thống"
    });
  }
};
