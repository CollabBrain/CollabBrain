import prisma from "../../config/prisma";
import { CardDifficulty } from "@prisma/client";

// ============================================================
// ——— DECK OPERATIONS ———
// ============================================================

export const createDeck = async (
  userId: string,
  name: string,
  description?: string,
  color?: string,
  icon?: string,
  groupId?: string,
  isPublic?: boolean
) => {
  return prisma.deck.create({
    data: {
      name,
      description,
      color: color || "#3B82F6",
      icon,
      groupId,
      isPublic: isPublic ?? false,
      createdBy: userId
    },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true }
      },
      cards: {
        where: { isDeleted: false },
        select: { id: true }
      }
    }
  });
};

// Helper: check if user has access to a deck
const hasDeckAccess = async (deck: { id: string; createdBy: string; isPublic: boolean; groupId: string | null }, userId?: string) => {
  if (!userId) return deck.isPublic;
  if (deck.createdBy === userId) return true;
  
  const share = await prisma.deckShare.findFirst({
    where: { deckId: deck.id, userId }
  });
  if (share) return true;
  
  if (deck.groupId) {
    const member = await prisma.groupMember.findFirst({
      where: { groupId: deck.groupId, userId }
    });
    if (member) return true;
  }
  
  return false;
};

export const getDeckById = async (deckId: string, userId?: string) => {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true }
      },
      cards: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" }
      },
      group: {
        select: { id: true, name: true }
      }
    }
  });
  
  if (!deck) return null;
  if (!(await hasDeckAccess(deck, userId))) return null;
  
  return deck;
};

export const getUserDecks = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [decks, total] = await Promise.all([
    prisma.deck.findMany({
      where: {
        isDeleted: false,
        OR: [
          { createdBy: userId },
          { shares: { some: { userId } } }
        ]
      },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true }
        },
        cards: {
          where: { isDeleted: false },
          select: { id: true }
        },
        _count: {
          select: {
            cards: { where: { isDeleted: false } }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit
    }),
    prisma.deck.count({
      where: {
        isDeleted: false,
        OR: [
          { createdBy: userId },
          { shares: { some: { userId } } }
        ]
      }
    })
  ]);

  return {
    decks: decks.map(deck => ({
      ...deck,
      cardCount: deck._count.cards
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getPublicDecks = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [decks, total] = await Promise.all([
    prisma.deck.findMany({
      where: { isDeleted: false, isPublic: true },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true }
        },
        _count: {
          select: {
            cards: { where: { isDeleted: false } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.deck.count({
      where: { isDeleted: false, isPublic: true }
    })
  ]);

  return {
    decks: decks.map(deck => ({
      ...deck,
      cardCount: deck._count.cards
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const updateDeck = async (deckId: string, userId: string, data: {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}) => {
  // Check ownership
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false }
  });

  if (!deck) throw new Error("Không tìm thấy deck");
  if (deck.createdBy !== userId) throw new Error("Bạn không có quyền chỉnh sửa deck này");

  return prisma.deck.update({
    where: { id: deckId },
    data,
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true }
      }
    }
  });
};

export const deleteDeck = async (deckId: string, userId: string) => {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false }
  });

  if (!deck) throw new Error("Không tìm thấy deck");
  if (deck.createdBy !== userId) throw new Error("Bạn không có quyền xóa deck này");

  return prisma.deck.update({
    where: { id: deckId },
    data: { isDeleted: true }
  });
};

// ============================================================
// ——— FLASHCARD OPERATIONS ———
// ============================================================

export const createFlashcard = async (
  deckId: string,
  data: {
    front: string;
    back: string;
    hint?: string;
    imageUrl?: string;
    tags?: string[];
    difficulty?: CardDifficulty;
  }
) => {
  return prisma.flashcard.create({
    data: {
      deckId,
      front: data.front,
      back: data.back,
      hint: data.hint,
      imageUrl: data.imageUrl,
      tags: data.tags || [],
      difficulty: data.difficulty || "MEDIUM"
    },
    include: {
      deck: {
        select: { id: true, name: true }
      }
    }
  });
};

export const createMultipleFlashcards = async (
  deckId: string,
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
    tags?: string[];
    difficulty?: CardDifficulty;
  }>
) => {
  return prisma.flashcard.createMany({
    data: cards.map(card => ({
      deckId,
      front: card.front,
      back: card.back,
      hint: card.hint,
      tags: card.tags || [],
      difficulty: card.difficulty || "MEDIUM"
    }))
  });
};

export const getFlashcardsByDeck = async (deckId: string, page = 1, limit = 50, userId?: string) => {
  // Check access
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false },
    select: { id: true, createdBy: true, isPublic: true, groupId: true }
  });
  
  if (!deck || !(await hasDeckAccess(deck, userId))) {
    return { cards: [], total: 0, page, totalPages: 0 };
  }
  
  const skip = (page - 1) * limit;

  const [cards, total] = await Promise.all([
    prisma.flashcard.findMany({
      where: { deckId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.flashcard.count({
      where: { deckId, isDeleted: false }
    })
  ]);

  return {
    cards,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getFlashcardById = async (cardId: string) => {
  return prisma.flashcard.findFirst({
    where: { id: cardId, isDeleted: false },
    include: {
      deck: {
        select: { id: true, name: true, color: true }
      }
    }
  });
};

export const updateFlashcard = async (cardId: string, userId: string, data: {
  front?: string;
  back?: string;
  hint?: string;
  imageUrl?: string;
  tags?: string[];
  difficulty?: CardDifficulty;
}) => {
  // Check if user has permission to edit this card's deck
  const card = await prisma.flashcard.findFirst({
    where: { id: cardId, isDeleted: false },
    include: { deck: true }
  });

  if (!card) throw new Error("Không tìm thấy thẻ");
  
  const hasAccess = card.deck.createdBy === userId || 
    await prisma.deckShare.findFirst({
      where: { deckId: card.deckId, userId, canEdit: true }
    });

  if (!hasAccess) throw new Error("Bạn không có quyền chỉnh sửa thẻ này");

  return prisma.flashcard.update({
    where: { id: cardId },
    data
  });
};

export const deleteFlashcard = async (cardId: string, userId: string) => {
  const card = await prisma.flashcard.findFirst({
    where: { id: cardId, isDeleted: false },
    include: { deck: true }
  });

  if (!card) throw new Error("Không tìm thấy thẻ");
  if (card.deck.createdBy !== userId) throw new Error("Bạn không có quyền xóa thẻ này");

  return prisma.flashcard.update({
    where: { id: cardId },
    data: { isDeleted: true }
  });
};

// ============================================================
// ——— STUDY MODE (Spaced Repetition) ———
// ============================================================

export const getCardsForStudy = async (deckId: string, userId?: string, limit = 20) => {
  // Check access
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false },
    select: { id: true, createdBy: true, isPublic: true, groupId: true }
  });
  
  if (!deck || !(await hasDeckAccess(deck, userId))) {
    return [];
  }
  
  // Get cards that are due for review or new cards
  const cards = await prisma.flashcard.findMany({
    where: {
      deckId,
      isDeleted: false,
      OR: [
        { nextReviewAt: { lte: new Date() } },
        { nextReviewAt: null }
      ]
    },
    orderBy: [
      { nextReviewAt: "asc" },
      { createdAt: "asc" }
    ],
    take: limit
  });

  // If no due cards, get new cards
  if (cards.length === 0) {
    return prisma.flashcard.findMany({
      where: {
        deckId,
        isDeleted: false,
        nextReviewAt: null,
        repetitions: 0
      },
      orderBy: { createdAt: "asc" },
      take: limit
    });
  }

  return cards;
};

export const getStudyStats = async (deckId: string, userId?: string) => {
  // Check access
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false },
    select: { id: true, createdBy: true, isPublic: true, groupId: true }
  });
  
  if (!deck || !(await hasDeckAccess(deck, userId))) {
    return { totalCards: 0, dueCards: 0, newCards: 0, learnedCards: 0 };
  }
  
  const cards = await prisma.flashcard.findMany({
    where: { deckId, isDeleted: false },
    select: {
      id: true,
      nextReviewAt: true,
      repetitions: true,
      easeFactor: true,
      intervalDays: true
    }
  });

  const now = new Date();
  const dueCount = cards.filter(c => c.nextReviewAt && c.nextReviewAt <= now).length;
  const newCount = cards.filter(c => c.nextReviewAt === null).length;
  const learnedCount = cards.filter(c => c.repetitions > 0).length;

  return {
    totalCards: cards.length,
    dueCards: dueCount,
    newCards: newCount,
    learnedCards: learnedCount
  };
};

export const submitReview = async (
  cardId: string,
  userId: string,
  quality: number, // 0-5
  timeSpent?: number
) => {
  const card = await prisma.flashcard.findFirst({
    where: { id: cardId, isDeleted: false }
  });

  if (!card) throw new Error("Không tìm thấy thẻ");

  // SM-2 Algorithm
  let newEaseFactor = card.easeFactor;
  let newInterval = card.intervalDays;
  let newRepetitions = card.repetitions;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Success
    newRepetitions = card.repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.intervalDays * newEaseFactor);
    }

    // Update ease factor
    newEaseFactor = Math.max(
      1.3,
      newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  }

  // Cap interval at 365 days
  newInterval = Math.min(newInterval, 365);

  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  // Update card
  const updatedCard = await prisma.flashcard.update({
    where: { id: cardId },
    data: {
      easeFactor: newEaseFactor,
      intervalDays: newInterval,
      nextReviewAt,
      repetitions: newRepetitions
    }
  });

  // Create review record
  await prisma.review.create({
    data: {
      cardId,
      userId,
      quality,
      timeSpent
    }
  });

  return {
    card: updatedCard,
    nextReviewIn: newInterval,
    easeFactor: newEaseFactor
  };
};

// ============================================================
// ——— DECK SHARING ———
// ============================================================

export const shareDeck = async (deckId: string, userId: string, shareUserId: string, canEdit = false) => {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false }
  });

  if (!deck) throw new Error("Không tìm thấy deck");
  if (deck.createdBy !== userId) throw new Error("Bạn không có quyền chia sẻ deck này");

  return prisma.deckShare.create({
    data: {
      deckId,
      userId: shareUserId,
      canEdit
    }
  });
};

export const removeDeckShare = async (deckId: string, userId: string, shareUserId: string) => {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isDeleted: false }
  });

  if (!deck) throw new Error("Không tìm thấy deck");
  if (deck.createdBy !== userId) throw new Error("Bạn không có quyền");

  return prisma.deckShare.delete({
    where: {
      deckId_userId: {
        deckId,
        userId: shareUserId
      }
    }
  });
};

export const getDeckShares = async (deckId: string) => {
  return prisma.deckShare.findMany({
    where: { deckId },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true }
      }
    }
  });
};
