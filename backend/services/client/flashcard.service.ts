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
  getDeckShares
} from "../../repositories/client/flashcard.repo";
import { CardDifficulty } from "@prisma/client";

// ============================================================
// ——— DECK SERVICES ———
// ============================================================

export const createDeckService = async (
  userId: string,
  name: string,
  description?: string,
  color?: string,
  icon?: string,
  groupId?: string,
  isPublic?: boolean
) => {
  if (!name || name.trim().length === 0) {
    throw new Error("Tên deck không được để trống");
  }

  const deck = await createDeck(userId, name.trim(), description?.trim(), color, icon, groupId, isPublic);
  return {
    data: deck,
    message: "Tạo deck thành công"
  };
};

export const getDeckByIdService = async (deckId: string, userId?: string) => {
  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Không tìm thấy deck hoặc bạn không có quyền truy cập");

  return {
    data: deck,
    message: "Lấy thông tin deck thành công"
  };
};

export const getMyDecksService = async (userId: string, page = 1, limit = 20) => {
  const result = await getUserDecks(userId, page, limit);
  return {
    data: result,
    message: "Lấy danh sách deck thành công"
  };
};

export const getExploreDecksService = async (page = 1, limit = 20) => {
  const result = await getPublicDecks(page, limit);
  return {
    data: result,
    message: "Lấy danh sách deck công khai thành công"
  };
};

export const updateDeckService = async (
  deckId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    isPublic?: boolean;
  }
) => {
  if (data.name !== undefined && data.name.trim().length === 0) {
    throw new Error("Tên deck không được để trống");
  }

  const deck = await updateDeck(deckId, userId, {
    ...data,
    name: data.name?.trim(),
    description: data.description?.trim()
  });

  return {
    data: deck,
    message: "Cập nhật deck thành công"
  };
};

export const deleteDeckService = async (deckId: string, userId: string) => {
  await deleteDeck(deckId, userId);
  return {
    message: "Xóa deck thành công"
  };
};

// ============================================================
// ——— FLASHCARD SERVICES ———
// ============================================================

export const createFlashcardService = async (
  deckId: string,
  userId: string,
  data: {
    front: string;
    back: string;
    hint?: string;
    imageUrl?: string;
    tags?: string[];
    difficulty?: CardDifficulty;
  }
) => {
  if (!data.front?.trim()) throw new Error("Mặt trước không được để trống");
  if (!data.back?.trim()) throw new Error("Mặt sau không được để trống");

  const card = await createFlashcard(deckId, {
    front: data.front.trim(),
    back: data.back.trim(),
    hint: data.hint?.trim(),
    imageUrl: data.imageUrl,
    tags: data.tags,
    difficulty: data.difficulty
  });

  return {
    data: card,
    message: "Tạo flashcard thành công"
  };
};

export const createMultipleFlashcardsService = async (
  deckId: string,
  userId: string,
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
    tags?: string[];
  }>
) => {
  if (!cards || cards.length === 0) throw new Error("Danh sách thẻ trống");

  // Filter valid cards
  const validCards = cards
    .filter(c => c.front?.trim() && c.back?.trim())
    .map(c => ({
      front: c.front.trim(),
      back: c.back.trim(),
      hint: c.hint?.trim(),
      tags: c.tags || []
    }));

  if (validCards.length === 0) throw new Error("Không có thẻ hợp lệ");

  const result = await createMultipleFlashcards(deckId, validCards);

  return {
    data: { count: result.count },
    message: `Đã tạo ${result.count} flashcard`
  };
};

export const getDeckCardsService = async (deckId: string, userId?: string, page = 1, limit = 50) => {
  const result = await getFlashcardsByDeck(deckId, page, limit, userId);
  return {
    data: result,
    message: "Lấy danh sách thẻ thành công"
  };
};

export const getFlashcardByIdService = async (cardId: string) => {
  const card = await getFlashcardById(cardId);
  if (!card) throw new Error("Không tìm thấy thẻ");

  return {
    data: card,
    message: "Lấy thông tin thẻ thành công"
  };
};

export const updateFlashcardService = async (
  cardId: string,
  userId: string,
  data: {
    front?: string;
    back?: string;
    hint?: string;
    imageUrl?: string;
    tags?: string[];
    difficulty?: CardDifficulty;
  }
) => {
  if (data.front !== undefined && data.front.trim().length === 0) {
    throw new Error("Mặt trước không được để trống");
  }
  if (data.back !== undefined && data.back.trim().length === 0) {
    throw new Error("Mặt sau không được để trống");
  }

  const card = await updateFlashcard(cardId, userId, {
    ...data,
    front: data.front?.trim(),
    back: data.back?.trim(),
    hint: data.hint?.trim()
  });

  return {
    data: card,
    message: "Cập nhật thẻ thành công"
  };
};

export const deleteFlashcardService = async (cardId: string, userId: string) => {
  await deleteFlashcard(cardId, userId);
  return {
    message: "Xóa thẻ thành công"
  };
};

// ============================================================
// ——— STUDY MODE SERVICES ———
// ============================================================

export const getStudyCardsService = async (deckId: string, userId?: string, limit = 20) => {
  const [cards, stats] = await Promise.all([
    getCardsForStudy(deckId, userId, limit),
    getStudyStats(deckId, userId)
  ]);

  return {
    data: {
      cards,
      stats
    },
    message: "Lấy thẻ để học thành công"
  };
};

export const getDeckStatsService = async (deckId: string, userId?: string) => {
  const stats = await getStudyStats(deckId, userId);
  return {
    data: stats,
    message: "Lấy thống kê thành công"
  };
};

export const submitReviewService = async (
  cardId: string,
  userId: string,
  quality: number,
  timeSpent?: number
) => {
  if (quality < 0 || quality > 5) {
    throw new Error("Chất lượng phải từ 0 đến 5");
  }

  const result = await submitReview(cardId, userId, quality, timeSpent);

  let qualityText = "";
  switch (quality) {
    case 0: qualityText = "Bạn đã quên thẻ này"; break;
    case 1: qualityText = "Rất khó nhớ"; break;
    case 2: qualityText = "Khó nhớ"; break;
    case 3: qualityText = "Nhớ được"; break;
    case 4: qualityText = "Dễ nhớ"; break;
    case 5: qualityText = "Rất dễ nhớ"; break;
  }

  return {
    data: result,
    message: qualityText
  };
};

// ============================================================
// ——— SHARING SERVICES ———
// ============================================================

export const shareDeckService = async (deckId: string, userId: string, shareUserId: string, canEdit = false) => {
  if (deckId === shareUserId) throw new Error("Không thể chia sẻ cho chính mình");

  await shareDeck(deckId, userId, shareUserId, canEdit);
  return {
    message: canEdit ? "Đã chia sẻ quyền chỉnh sửa deck" : "Đã chia sẻ deck thành công"
  };
};

export const removeShareService = async (deckId: string, userId: string, shareUserId: string) => {
  await removeDeckShare(deckId, userId, shareUserId);
  return {
    message: "Đã hủy chia sẻ deck"
  };
};

export const getSharesService = async (deckId: string) => {
  const shares = await getDeckShares(deckId);
  return {
    data: shares,
    message: "Lấy danh sách chia sẻ thành công"
  };
};
