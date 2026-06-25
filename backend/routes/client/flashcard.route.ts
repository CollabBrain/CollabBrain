import { Router } from "express";
import { authMiddleware } from "../../middlewares/client/auth.middleware";
import {
  createDeck,
  getMyDecks,
  getExploreDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
  createFlashcard,
  createBulkFlashcards,
  getDeckCards,
  getFlashcardById,
  updateFlashcard,
  deleteFlashcard,
  getStudyCards,
  getDeckStats,
  submitReview,
  shareDeck,
  removeShare,
  getShares
} from "../../controllers/client/flashcard.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// ——— DECK ROUTES ———
// ============================================================

//[POST] /flashcard/decks - Create a new deck
router.post("/decks", createDeck);

//[GET] /flashcard/decks - Get user's decks
router.get("/decks", getMyDecks);

//[GET] /flashcard/decks/explore - Get public decks
router.get("/decks/explore", getExploreDecks);

//[GET] /flashcard/decks/:deckId - Get deck by ID
router.get("/decks/:deckId", getDeckById);

//[PATCH] /flashcard/decks/:deckId - Update deck
router.patch("/decks/:deckId", updateDeck);

//[DELETE] /flashcard/decks/:deckId - Delete deck
router.delete("/decks/:deckId", deleteDeck);

// ============================================================
// ——— FLASHCARD ROUTES ———
// ============================================================

//[POST] /flashcard/decks/:deckId/cards - Create a flashcard
router.post("/decks/:deckId/cards", createFlashcard);

//[POST] /flashcard/decks/:deckId/cards/bulk - Create multiple flashcards
router.post("/decks/:deckId/cards/bulk", createBulkFlashcards);

//[GET] /flashcard/decks/:deckId/cards - Get all cards in a deck
router.get("/decks/:deckId/cards", getDeckCards);

//[GET] /flashcard/cards/:cardId - Get flashcard by ID
router.get("/cards/:cardId", getFlashcardById);

//[PATCH] /flashcard/cards/:cardId - Update flashcard
router.patch("/cards/:cardId", updateFlashcard);

//[DELETE] /flashcard/cards/:cardId - Delete flashcard
router.delete("/cards/:cardId", deleteFlashcard);

// ============================================================
// ——— STUDY MODE ROUTES ———
// ============================================================

//[GET] /flashcard/decks/:deckId/study - Get cards for study
router.get("/decks/:deckId/study", getStudyCards);

//[GET] /flashcard/decks/:deckId/stats - Get deck statistics
router.get("/decks/:deckId/stats", getDeckStats);

//[POST] /flashcard/cards/:cardId/review - Submit a review
router.post("/cards/:cardId/review", submitReview);

// ============================================================
// ——— SHARING ROUTES ———
// ============================================================

//[POST] /flashcard/decks/:deckId/share - Share a deck
router.post("/decks/:deckId/share", shareDeck);

//[GET] /flashcard/decks/:deckId/shares - Get deck shares
router.get("/decks/:deckId/shares", getShares);

//[DELETE] /flashcard/decks/:deckId/share/:targetUserId - Remove a share
router.delete("/decks/:deckId/share/:targetUserId", removeShare);

export const flashcardRoutes = router;
