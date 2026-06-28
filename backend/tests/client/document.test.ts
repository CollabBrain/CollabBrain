import { describe, it, expect } from 'vitest';
import {
  createDocument,
  findDocumentById,
  findDocumentByIdRaw,
  findDocumentsByGroupId,
  findDocumentsByUserId,
  softDeleteDocument,
  restoreDocument,
} from '../../repositories/client/document.repo';
import { prismaMock } from '../setup';
import { DocumentType } from '@prisma/client';

describe('document.repo', () => {
  const userId = 'user-123';
  const groupId = 'group-456';
  const docId = 'doc-789';

  const mockDoc = {
    id: docId,
    name: 'Research Paper.pdf',
    type: DocumentType.PDF,
    url: 'https://supabase.com/file.pdf',
    size: 1024,
    mimeType: 'application/pdf',
    isEmbedded: false,
    isDeleted: false,
    groupId,
    conversationId: null,
    uploadedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createDocument', () => {
    it('nên tạo tài liệu mới thành công', async () => {
      prismaMock.document.create.mockResolvedValue(mockDoc as any);

      const result = await createDocument({
        name: 'Research Paper.pdf',
        type: DocumentType.PDF,
        url: 'https://supabase.com/file.pdf',
        size: 1024,
        mimeType: 'application/pdf',
        groupId,
        uploadedBy: userId,
      });

      expect(prismaMock.document.create).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findDocumentById', () => {
    it('nên tìm tài liệu theo ID (chỉ lấy tài liệu chưa bị xóa)', async () => {
      prismaMock.document.findFirst.mockResolvedValue(mockDoc as any);

      const result = await findDocumentById(docId);

      expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
        where: { id: docId, isDeleted: false },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findDocumentByIdRaw', () => {
    it('nên tìm tài liệu theo ID kể cả đã bị xóa', async () => {
      prismaMock.document.findFirst.mockResolvedValue(mockDoc as any);

      const result = await findDocumentByIdRaw(docId);

      expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
        where: { id: docId },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findDocumentsByGroupId', () => {
    it('nên lấy tài liệu theo groupId kèm phân trang và tìm kiếm', async () => {
      prismaMock.document.findMany.mockResolvedValue([mockDoc] as any);
      prismaMock.document.count.mockResolvedValue(1);

      const result = await findDocumentsByGroupId(groupId, {
        search: 'Research',
        type: DocumentType.PDF,
        page: 1,
        limit: 10,
        sort: 'newest',
      });

      expect(prismaMock.document.findMany).toHaveBeenCalled();
      expect(prismaMock.document.count).toHaveBeenCalled();
      expect(result.documents.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findDocumentsByUserId', () => {
    it('nên lấy tài liệu theo userId kèm phân trang và bộ lọc', async () => {
      prismaMock.document.findMany.mockResolvedValue([mockDoc] as any);
      prismaMock.document.count.mockResolvedValue(1);

      const result = await findDocumentsByUserId(userId, {
        page: 1,
        limit: 10,
      });

      expect(prismaMock.document.findMany).toHaveBeenCalled();
      expect(prismaMock.document.count).toHaveBeenCalled();
      expect(result.documents.length).toBe(1);
    });
  });

  describe('softDeleteDocument', () => {
    it('nên xóa mềm tài liệu', async () => {
      prismaMock.document.update.mockResolvedValue({ ...mockDoc, isDeleted: true } as any);

      const result = await softDeleteDocument(docId);

      expect(prismaMock.document.update).toHaveBeenCalledWith({
        where: { id: docId },
        data: { isDeleted: true },
      });
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('restoreDocument', () => {
    it('nên phục hồi tài liệu đã xóa mềm', async () => {
      prismaMock.document.update.mockResolvedValue({ ...mockDoc, isDeleted: false } as any);

      const result = await restoreDocument(docId);

      expect(prismaMock.document.update).toHaveBeenCalledWith({
        where: { id: docId },
        data: { isDeleted: false },
      });
      expect(result.isDeleted).toBe(false);
    });
  });
});
