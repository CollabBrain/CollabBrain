import { describe, it, expect } from 'vitest';
import {
  findReports,
  updateReportStatus,
} from '../../repositories/admin/report.repo';
import { prismaMock } from '../setup';
import { ReportStatus } from '@prisma/client';

describe('admin report.repo', () => {
  const reportId = 'report-123';
  const mockReport = {
    id: reportId,
    reporterId: 'user-reporter',
    targetUserId: 'user-reported',
    targetGroupId: null,
    reason: 'Spamming in public chat',
    status: ReportStatus.PENDING,
    resolutionNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findReports', () => {
    it('nên lấy danh sách các báo cáo vi phạm phân trang', async () => {
      prismaMock.report.findMany.mockResolvedValue([mockReport] as any);
      prismaMock.report.count.mockResolvedValue(1);

      const result = await findReports(1, 10);

      expect(prismaMock.report.findMany).toHaveBeenCalled();
      expect(prismaMock.report.count).toHaveBeenCalled();
      expect(result.reports.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('updateReportStatus', () => {
    it('nên xử lý báo cáo vi phạm và cập nhật trạng thái', async () => {
      prismaMock.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
        resolutionNotes: 'Banned user',
        reporter: { name: 'Reporter User' },
      } as any);

      const result = await updateReportStatus(reportId, ReportStatus.RESOLVED, 'Banned user');

      expect(prismaMock.report.update).toHaveBeenCalledWith({
        where: { id: reportId },
        data: {
          status: ReportStatus.RESOLVED,
          resolutionNotes: 'Banned user',
        },
        include: {
          reporter: { select: { name: true } },
        },
      });
      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(result.resolutionNotes).toBe('Banned user');
    });
  });
});
