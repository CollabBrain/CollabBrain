import axiosInstance from '../../../services/axiosInstance';
import type { ApiResponse } from '../../../types';
import type {
  IDeck,
  IDecksResponse,
  IFlashcard,
  ICardsResponse,
  IStudySession,
  IStudyStats,
  IReviewResult,
  IDeckShare,
  CardDifficulty
} from '../../../types/flashcard';

// ============================================================
// ——— DECK APIs ———
// ============================================================

/** POST /flashcard/decks — Tạo deck mới */
export const createDeckApi = (data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  groupId?: string;
}) =>
  axiosInstance.post<ApiResponse<IDeck>>('/flashcard/decks', data);

/** GET /flashcard/decks — Lấy danh sách deck của user */
export const getMyDecksApi = (page = 1, limit = 20) =>
  axiosInstance.get<ApiResponse<IDecksResponse>>('/flashcard/decks', {
    params: { page, limit },
  });

/** GET /flashcard/decks/explore — Khám phá deck công khai */
export const getExploreDecksApi = (page = 1, limit = 20) =>
  axiosInstance.get<ApiResponse<IDecksResponse>>('/flashcard/decks/explore', {
    params: { page, limit },
  });

/** GET /flashcard/decks/:deckId — Lấy chi tiết deck */
export const getDeckByIdApi = (deckId: string) =>
  axiosInstance.get<ApiResponse<IDeck>>(`/flashcard/decks/${deckId}`);

/** PATCH /flashcard/decks/:deckId — Cập nhật deck */
export const updateDeckApi = (
  deckId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    isPublic?: boolean;
  }
) =>
  axiosInstance.patch<ApiResponse<IDeck>>(`/flashcard/decks/${deckId}`, data);

/** DELETE /flashcard/decks/:deckId — Xóa deck */
export const deleteDeckApi = (deckId: string) =>
  axiosInstance.delete<ApiResponse<null>>(`/flashcard/decks/${deckId}`);

// ============================================================
// ——— FLASHCARD APIs ———
// ============================================================

/** POST /flashcard/decks/:deckId/cards — Tạo flashcard */
export const createFlashcardApi = (
  deckId: string,
  data: {
    front: string;
    back: string;
    hint?: string;
    imageUrl?: string;
    tags?: string[];
    difficulty?: CardDifficulty;
  }
) =>
  axiosInstance.post<ApiResponse<IFlashcard>>(
    `/flashcard/decks/${deckId}/cards`,
    data
  );

/** POST /flashcard/decks/:deckId/cards/bulk — Tạo nhiều flashcards */
export const createBulkFlashcardsApi = (
  deckId: string,
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
    tags?: string[];
  }>
) =>
  axiosInstance.post<ApiResponse<{ count: number }>>(
    `/flashcard/decks/${deckId}/cards/bulk`,
    { cards }
  );

/** GET /flashcard/decks/:deckId/cards — Lấy danh sách cards trong deck */
export const getDeckCardsApi = (deckId: string, page = 1, limit = 50) =>
  axiosInstance.get<ApiResponse<ICardsResponse>>(
    `/flashcard/decks/${deckId}/cards`,
    { params: { page, limit } }
  );

/** GET /flashcard/cards/:cardId — Lấy chi tiết card */
export const getFlashcardByIdApi = (cardId: string) =>
  axiosInstance.get<ApiResponse<IFlashcard>>(`/flashcard/cards/${cardId}`);

/** PATCH /flashcard/cards/:cardId — Cập nhật flashcard */
export const updateFlashcardApi = (
  cardId: string,
  data: {
    front?: string;
    back?: string;
    hint?: string;
    imageUrl?: string;
    tags?: string[];
    difficulty?: CardDifficulty;
  }
) =>
  axiosInstance.patch<ApiResponse<IFlashcard>>(
    `/flashcard/cards/${cardId}`,
    data
  );

/** DELETE /flashcard/cards/:cardId — Xóa flashcard */
export const deleteFlashcardApi = (cardId: string) =>
  axiosInstance.delete<ApiResponse<null>>(`/flashcard/cards/${cardId}`);

// ============================================================
// ——— STUDY MODE APIs ———
// ============================================================

/** GET /flashcard/decks/:deckId/study — Lấy cards để học */
export const getStudyCardsApi = (deckId: string, limit = 20) =>
  axiosInstance.get<ApiResponse<IStudySession>>(
    `/flashcard/decks/${deckId}/study`,
    { params: { limit } }
  );

/** GET /flashcard/decks/:deckId/stats — Lấy thống kê deck */
export const getDeckStatsApi = (deckId: string) =>
  axiosInstance.get<ApiResponse<IStudyStats>>(
    `/flashcard/decks/${deckId}/stats`
  );

/** POST /flashcard/cards/:cardId/review — Submit review */
export const submitReviewApi = (
  cardId: string,
  data: { quality: number; timeSpent?: number }
) =>
  axiosInstance.post<ApiResponse<IReviewResult>>(
    `/flashcard/cards/${cardId}/review`,
    data
  );

// ============================================================
// ——— SHARING APIs ———
// ============================================================

/** POST /flashcard/decks/:deckId/share — Chia sẻ deck */
export const shareDeckApi = (
  deckId: string,
  data: { userId: string; canEdit?: boolean }
) =>
  axiosInstance.post<ApiResponse<null>>(
    `/flashcard/decks/${deckId}/share`,
    data
  );

/** GET /flashcard/decks/:deckId/shares — Lấy danh sách chia sẻ */
export const getDeckSharesApi = (deckId: string) =>
  axiosInstance.get<ApiResponse<IDeckShare[]>>(
    `/flashcard/decks/${deckId}/shares`
  );

/** DELETE /flashcard/decks/:deckId/share/:targetUserId — Hủy chia sẻ */
export const removeDeckShareApi = (deckId: string, targetUserId: string) =>
  axiosInstance.delete<ApiResponse<null>>(
    `/flashcard/decks/${deckId}/share/${targetUserId}`
  );
