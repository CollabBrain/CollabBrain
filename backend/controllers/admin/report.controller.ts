import { Request, Response } from "express";
import * as reportRepo from "../../repositories/admin/report.repo";
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
