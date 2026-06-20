import prisma from "../../config/prisma";
import { ReportStatus } from "@prisma/client";

export const findReports = async (
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isActive: true
          }
        },
        targetGroup: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.report.count()
  ]);

  return { reports, total };
};

export const updateReportStatus = async (id: string, status: ReportStatus) => {
  return prisma.report.update({
    where: { id },
    data: { status },
    include: {
      reporter: { select: { name: true } }
    }
  });
};
