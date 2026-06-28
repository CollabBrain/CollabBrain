import { describe, it, expect } from 'vitest';
import {
  findDocumentsAdmin,
  deleteDocumentAdmin,
} from '../../repositories/admin/document.repo';
import { prismaMock } from '../setup';
import { DocumentType } from '@prisma/client';

describe('admin document.repo', () => {
  const docId = 'doc-123';
  const mockDoc = {
    id: docId,
    name: 'Lecture.pdf',
    type: DocumentType.PDF,
    isEmbedded: true,
    isDeleted: false,
    uploadedBy: 'user-1',
    groupId: 'group-1',
    createdAt: new Date(),
  };

  describe('findDocumentsAdmin', () => {
    it('nên lấy danh sách tài liệu toàn hệ thống kèm theo các bộ lọc cho admin', async () => {
      prismaMock.document.findMany.mockResolvedValue([mockDoc] as any);
      prismaMock.document.count.mockResolvedValue(1);

      const result = await findDocumentsAdmin(1, 10, {
        search: 'Lecture',
        isEmbedded: true,
        type: DocumentType.PDF,
        uploadedBy: 'user-1',
        groupId: 'group-1',
      });

      expect(prismaMock.document.findMany).toHaveBeenCalled();
      expect(prismaMock.document.count).toHaveBeenCalled();
      expect(result.documents.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('deleteDocumentAdmin', () => {
    it('nên xóa vĩnh viễn tài liệu ở cấp admin', async () => {
      prismaMock.document.delete.mockResolvedValue(mockDoc as any);

      const result = await deleteDocumentAdmin(docId);

      expect(prismaMock.document.delete).toHaveBeenCalledWith({
        where: { id: docId },
      });
      expect(result.id).toBe(docId);
    });
  });
});
