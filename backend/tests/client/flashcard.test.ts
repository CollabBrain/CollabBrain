import { describe, it, expect, vi } from 'vitest';
import {
  createDeck,
  getDeckById,
  getUserDecks,
  getPublicDecks,
  updateDeck,
  deleteDeck,
  createFlashcard,
  createMultipleFlashcards,
  getFlashcardsByDeck,
  getFlashcardById,
  updateFlashcard,
  deleteFlashcard,
  getCardsForStudy,
  getStudyStats,
  submitReview,
  shareDeck,
  removeDeckShare,
  getDeckShares,
} from '../../repositories/client/flashcard.repo';
import { prismaMock } from '../setup';
import { CardDifficulty } from '@prisma/client';

describe('flashcard.repo', () => {
  const userId = 'user-123';
  const deckId = 'deck-456';
  const cardId = 'card-789';

  const baseDeck = {
    id: deckId,
    name: 'Sample Deck',
    description: 'Description',
    color: '#3B82F6',
    icon: 'book',
    isPublic: false,
    isDeleted: false,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseCard = {
    id: cardId,
    deckId,
    front: 'Question',
    back: 'Answer',
    hint: null,
    imageUrl: null,
    tags: [],
    difficulty: CardDifficulty.MEDIUM,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    nextReviewAt: null,
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
  };

  describe('Deck Operations', () => {
    it('nên tạo deck mới thành công', async () => {
      prismaMock.deck.create.mockResolvedValue(baseDeck as any);

      const result = await createDeck(userId, 'Sample Deck', 'Description', '#3B82F6', 'book');

      expect(prismaMock.deck.create).toHaveBeenCalledWith({
        data: {
          name: 'Sample Deck',
          description: 'Description',
          color: '#3B82F6',
          icon: 'book',
          groupId: undefined,
          createdBy: userId,
        },
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          cards: { where: { isDeleted: false }, select: { id: true } },
        },
      });
      expect(result).toEqual(baseDeck);
    });

    it('nên lấy deck theo ID', async () => {
      prismaMock.deck.findFirst.mockResolvedValue(baseDeck as any);

      const result = await getDeckById(deckId);

      expect(prismaMock.deck.findFirst).toHaveBeenCalledWith({
        where: { id: deckId, isDeleted: false },
        include: expect.any(Object),
      });
      expect(result).toEqual(baseDeck);
    });

    it('nên lấy danh sách deck của user', async () => {
      const mockResult = [{ ...baseDeck, _count: { cards: 5 } }];
      prismaMock.deck.findMany.mockResolvedValue(mockResult as any);
      prismaMock.deck.count.mockResolvedValue(1);

      const result = await getUserDecks(userId, 1, 10);

      expect(prismaMock.deck.findMany).toHaveBeenCalled();
      expect(prismaMock.deck.count).toHaveBeenCalled();
      expect(result.decks.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('nên lấy danh sách public deck', async () => {
      const mockResult = [{ ...baseDeck, _count: { cards: 5 } }];
      prismaMock.deck.findMany.mockResolvedValue(mockResult as any);
      prismaMock.deck.count.mockResolvedValue(1);

      const result = await getPublicDecks(1, 10);

      expect(prismaMock.deck.findMany).toHaveBeenCalled();
      expect(prismaMock.deck.count).toHaveBeenCalled();
      expect(result.total).toBe(1);
    });

    it('nên cập nhật thông tin deck nếu là chủ sở hữu', async () => {
      prismaMock.deck.findFirst.mockResolvedValue(baseDeck as any);
      prismaMock.deck.update.mockResolvedValue({ ...baseDeck, name: 'New Name' } as any);

      const result = await updateDeck(deckId, userId, { name: 'New Name' });

      expect(prismaMock.deck.update).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });

    it('nên ném lỗi khi cập nhật deck không tồn tại hoặc không có quyền', async () => {
      prismaMock.deck.findFirst.mockResolvedValue(null);

      await expect(updateDeck(deckId, userId, { name: 'New' })).rejects.toThrow("Không tìm thấy deck");
    });

    it('nên xóa mềm deck nếu là chủ sở hữu', async () => {
      prismaMock.deck.findFirst.mockResolvedValue(baseDeck as any);
      prismaMock.deck.update.mockResolvedValue({ ...baseDeck, isDeleted: true } as any);

      const result = await deleteDeck(deckId, userId);

      expect(prismaMock.deck.update).toHaveBeenCalledWith({
        where: { id: deckId },
        data: { isDeleted: true },
      });
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('Flashcard Operations', () => {
    it('nên tạo flashcard mới thành công', async () => {
      prismaMock.flashcard.create.mockResolvedValue(baseCard as any);

      const result = await createFlashcard(deckId, { front: 'Q', back: 'A' });

      expect(prismaMock.flashcard.create).toHaveBeenCalled();
      expect(result).toEqual(baseCard);
    });

    it('nên tạo nhiều flashcards bằng createMany', async () => {
      prismaMock.flashcard.createMany.mockResolvedValue({ count: 2 });

      const result = await createMultipleFlashcards(deckId, [
        { front: 'Q1', back: 'A1' },
        { front: 'Q2', back: 'A2' },
      ]);

      expect(prismaMock.flashcard.createMany).toHaveBeenCalled();
      expect(result.count).toBe(2);
    });

    it('nên lấy flashcard bằng ID', async () => {
      prismaMock.flashcard.findFirst.mockResolvedValue(baseCard as any);

      const result = await getFlashcardById(cardId);

      expect(prismaMock.flashcard.findFirst).toHaveBeenCalledWith({
        where: { id: cardId, isDeleted: false },
        include: expect.any(Object),
      });
      expect(result).toEqual(baseCard);
    });

    it('nên cập nhật flashcard nếu có quyền', async () => {
      prismaMock.flashcard.findFirst.mockResolvedValue({ ...baseCard, deck: { createdBy: userId } } as any);
      prismaMock.flashcard.update.mockResolvedValue({ ...baseCard, front: 'New Q' } as any);

      const result = await updateFlashcard(cardId, userId, { front: 'New Q' });

      expect(prismaMock.flashcard.update).toHaveBeenCalled();
      expect(result.front).toBe('New Q');
    });

    it('nên xóa mềm flashcard nếu là chủ sở hữu deck', async () => {
      prismaMock.flashcard.findFirst.mockResolvedValue({ ...baseCard, deck: { createdBy: userId } } as any);
      prismaMock.flashcard.update.mockResolvedValue({ ...baseCard, isDeleted: true } as any);

      const result = await deleteFlashcard(cardId, userId);

      expect(prismaMock.flashcard.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { isDeleted: true },
      });
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('Study Mode (Spaced Repetition)', () => {
    it('nên lấy các thẻ đến hạn học', async () => {
      prismaMock.flashcard.findMany.mockResolvedValue([baseCard] as any);

      const result = await getCardsForStudy(deckId, userId);

      expect(prismaMock.flashcard.findMany).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('nên lấy thống kê học tập chính xác', async () => {
      prismaMock.flashcard.findMany.mockResolvedValue([
        { ...baseCard, nextReviewAt: null, repetitions: 0 },
        { ...baseCard, nextReviewAt: new Date(Date.now() - 10000), repetitions: 1 },
      ] as any);

      const stats = await getStudyStats(deckId, userId);

      expect(stats.totalCards).toBe(2);
      expect(stats.newCards).toBe(1);
      expect(stats.dueCards).toBe(1);
    });
  });

  describe('submitReview (Spaced Repetition SM-2 Algorithm)', () => {
    it('nên quăng lỗi nếu không tìm thấy thẻ', async () => {
      prismaMock.flashcard.findFirst.mockResolvedValue(null);
      await expect(submitReview(cardId, userId, 4)).rejects.toThrow("Không tìm thấy thẻ");
    });

    it('nên reset repetitions về 0 và intervalDays về 1 khi quality < 3', async () => {
      const oldCard = { ...baseCard, repetitions: 3, intervalDays: 12, easeFactor: 2.6 };
      prismaMock.flashcard.findFirst.mockResolvedValue(oldCard);
      prismaMock.flashcard.update.mockImplementation(async ({ data }) => ({ ...oldCard, ...data } as any));
      prismaMock.review.create.mockResolvedValue({} as any);

      const result = await submitReview(cardId, userId, 2);

      expect(result.nextReviewIn).toBe(1);
      expect(result.easeFactor).toBe(2.6);
    });
  });

  describe('Deck Sharing', () => {
    it('nên tạo chia sẻ deck thành công', async () => {
      prismaMock.deck.findFirst.mockResolvedValue(baseDeck as any);
      prismaMock.deckShare.create.mockResolvedValue({ deckId, userId: 'share-user', canEdit: true } as any);

      const result = await shareDeck(deckId, userId, 'share-user', true);

      expect(prismaMock.deckShare.create).toHaveBeenCalledWith({
        data: { deckId, userId: 'share-user', canEdit: true },
      });
      expect(result.userId).toBe('share-user');
    });

    it('nên xóa chia sẻ deck thành công', async () => {
      prismaMock.deck.findFirst.mockResolvedValue(baseDeck as any);
      prismaMock.deckShare.delete.mockResolvedValue({ deckId, userId: 'share-user' } as any);

      const result = await removeDeckShare(deckId, userId, 'share-user');

      expect(prismaMock.deckShare.delete).toHaveBeenCalled();
      expect(result.userId).toBe('share-user');
    });

    it('nên lấy danh sách những người được chia sẻ deck', async () => {
      prismaMock.deckShare.findMany.mockResolvedValue([
        { deckId, userId: 'share-user', user: { id: 'share-user', name: 'Shared' } },
      ] as any);

      const result = await getDeckShares(deckId);

      expect(prismaMock.deckShare.findMany).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });
  });
});
