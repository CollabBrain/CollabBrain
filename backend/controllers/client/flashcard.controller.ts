import { Request, Response } from "express";
import { CardDifficulty } from "@prisma/client";
import {
  createDeckService,
  getDeckByIdService,
  getMyDecksService,
  getExploreDecksService,
  updateDeckService,
  deleteDeckService,
  createFlashcardService,
  createMultipleFlashcardsService,
  getDeckCardsService,
  getFlashcardByIdService,
  updateFlashcardService,
  deleteFlashcardService,
  getStudyCardsService,
  getDeckStatsService,
  submitReviewService,
  shareDeckService,
  removeShareService,
  getSharesService
} from "../../services/client/flashcard.service";

// Helper to ensure string params
const str = (val: string | string[] | undefined): string => {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
};

// ============================================================
// ——— DECK CONTROLLERS ———
// ============================================================

//[POST] /flashcard/decks
export const createDeck = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, color, icon, groupId } = req.body;

    const result = await createDeckService(userId, name, description, color, icon, groupId);
    return res.status(201).json({
      code: 201,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /flashcard/decks
export const getMyDecks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await getMyDecksService(userId, page, limit);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /flashcard/decks/explore
export const getExploreDecks = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await getExploreDecksService(page, limit);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /flashcard/decks/:deckId
export const getDeckById = async (req: Request, res: Response) => {
  try {
    const deckId = str(req.params.deckId);
    const result = await getDeckByIdService(deckId);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[PATCH] /flashcard/decks/:deckId
export const updateDeck = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);
    const { name, description, color, icon, isPublic } = req.body;

    const result = await updateDeckService(deckId, userId, {
      name,
      description,
      color,
      icon,
      isPublic
    });
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[DELETE] /flashcard/decks/:deckId
export const deleteDeck = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);

    const result = await deleteDeckService(deckId, userId);
    return res.status(200).json({
      code: 200,
      message: result.message
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

// ============================================================
// ——— FLASHCARD CONTROLLERS ———
// ============================================================

//[POST] /flashcard/decks/:deckId/cards
export const createFlashcard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);
    const { front, back, hint, imageUrl, tags, difficulty } = req.body;

    const result = await createFlashcardService(deckId, userId, {
      front,
      back,
      hint,
      imageUrl,
      tags,
      difficulty
    });
    return res.status(201).json({
      code: 201,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[POST] /flashcard/decks/:deckId/cards/bulk
export const createBulkFlashcards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);
    const { cards } = req.body;

    const result = await createMultipleFlashcardsService(deckId, userId, cards);
    return res.status(201).json({
      code: 201,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /flashcard/decks/:deckId/cards
export const getDeckCards = async (req: Request, res: Response) => {
  try {
    const deckId = str(req.params.deckId);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const result = await getDeckCardsService(deckId, page, limit);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /flashcard/cards/:cardId
export const getFlashcardById = async (req: Request, res: Response) => {
  try {
    const cardId = str(req.params.cardId);
    const result = await getFlashcardByIdService(cardId);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[PATCH] /flashcard/cards/:cardId
export const updateFlashcard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cardId = str(req.params.cardId);
    const { front, back, hint, imageUrl, tags, difficulty } = req.body;

    const result = await updateFlashcardService(cardId, userId, {
      front,
      back,
      hint,
      imageUrl,
      tags,
      difficulty
    });
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[DELETE] /flashcard/cards/:cardId
export const deleteFlashcard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cardId = str(req.params.cardId);

    const result = await deleteFlashcardService(cardId, userId);
    return res.status(200).json({
      code: 200,
      message: result.message
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

// ============================================================
// ——— STUDY MODE CONTROLLERS ———
// ============================================================

//[GET] /flashcard/decks/:deckId/study
export const getStudyCards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await getStudyCardsService(deckId, userId, limit);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /flashcard/decks/:deckId/stats
export const getDeckStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);

    const result = await getDeckStatsService(deckId, userId);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[POST] /flashcard/cards/:cardId/review
export const submitReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cardId = str(req.params.cardId);
    const { quality, timeSpent } = req.body;

    const result = await submitReviewService(cardId, userId, quality, timeSpent);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

// ============================================================
// ——— SHARING CONTROLLERS ———
// ============================================================

//[POST] /flashcard/decks/:deckId/share
export const shareDeck = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);
    const { userId: targetUserId, canEdit } = req.body;

    const result = await shareDeckService(deckId, userId, targetUserId, canEdit);
    return res.status(200).json({
      code: 200,
      message: result.message
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[DELETE] /flashcard/decks/:deckId/share/:targetUserId
export const removeShare = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = str(req.params.deckId);
    const targetUserId = str(req.params.targetUserId);

    const result = await removeShareService(deckId, userId, targetUserId);
    return res.status(200).json({
      code: 200,
      message: result.message
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /flashcard/decks/:deckId/shares
export const getShares = async (req: Request, res: Response) => {
  try {
    const deckId = str(req.params.deckId);
    const result = await getSharesService(deckId);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};
