import { describe, it, expect } from 'vitest';
import {
  savedChunks,
  getPendingChunks,
  updateChunkEmbedding,
  searchSimilarChunks,
} from '../../repositories/client/documentChunk.repo';
import { prismaMock } from '../setup';

describe('documentChunk.repo', () => {
  const documentId = 'doc-123';
  const mockChunks = [
    { id: 'chunk-1', documentId, chunkIndex: 0, content: 'Text 1', isEmbedded: false },
    { id: 'chunk-2', documentId, chunkIndex: 1, content: 'Text 2', isEmbedded: false },
  ];

  describe('savedChunks', () => {
    it('nên xóa các chunk cũ và lưu các chunk mới', async () => {
      prismaMock.documentChunk.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.documentChunk.createMany.mockResolvedValue({ count: 2 });

      const result = await savedChunks(documentId, [
        { documentId, chunkIndex: 0, content: 'Text 1' },
        { documentId, chunkIndex: 1, content: 'Text 2' },
      ]);

      expect(prismaMock.documentChunk.deleteMany).toHaveBeenCalledWith({
        where: { documentId },
      });
      expect(prismaMock.documentChunk.createMany).toHaveBeenCalledWith({
        data: [
          { documentId, chunkIndex: 0, content: 'Text 1' },
          { documentId, chunkIndex: 1, content: 'Text 2' },
        ],
      });
      expect(result.count).toBe(2);
    });
  });

  describe('getPendingChunks', () => {
    it('nên lấy các chunk chưa được tạo embedding', async () => {
      prismaMock.documentChunk.findMany.mockResolvedValue(mockChunks as any);

      const result = await getPendingChunks();

      expect(prismaMock.documentChunk.findMany).toHaveBeenCalledWith({
        where: { isEmbedded: false },
      });
      expect(result).toEqual(mockChunks);
    });
  });

  describe('updateChunkEmbedding', () => {
    it('nên gọi executeRawUnsafe để cập nhật embedding vector', async () => {
      prismaMock.$executeRawUnsafe.mockResolvedValue(1);

      await updateChunkEmbedding('chunk-1', [0.1, 0.2, 0.3]);

      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE document_chunks'),
        '[0.1,0.2,0.3]',
        'chunk-1'
      );
    });
  });

  describe('searchSimilarChunks', () => {
    const vector = [0.1, 0.2];
    const mockDbResults = [
      { id: 'chunk-1', content: 'Text 1', chunkIndex: 0, documentName: 'Doc A', documentUrl: 'url1' },
      { id: 'chunk-2', content: 'Text 2', chunkIndex: 1, documentName: 'Doc A', documentUrl: 'url1' },
    ];

    it('nên thực hiện tìm kiếm vector tương tự khi không có text query', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValue(mockDbResults);

      const result = await searchSimilarChunks(vector, {
        limit: 2,
        userId: 'user-1',
      });

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual(mockDbResults);
    });

    it('nên thực hiện tìm kiếm kết hợp Hybrid Search (Vector + Keyword) khi có textQuery', async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValue(mockDbResults);

      const result = await searchSimilarChunks(vector, {
        limit: 2,
        userId: 'user-1',
        groupId: 'group-1',
        textQuery: 'Text',
      });

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledTimes(2); // 1 cho vector, 1 cho keyword
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });
});
