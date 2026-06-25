import { create } from "zustand";
import type { IDeck, IFlashcard, IStudyStats } from "../../types/flashcard";

interface FlashcardState {
  // Decks
  decks: IDeck[];
  currentDeck: IDeck | null;
  totalDecks: number;
  currentPage: number;
  totalPages: number;

  // Cards
  cards: IFlashcard[];
  totalCards: number;
  cardsPage: number;
  cardsTotalPages: number;

  // Study mode
  studyCards: IFlashcard[];
  currentCardIndex: number;
  isFlipped: boolean;
  studyStats: IStudyStats | null;
  isStudying: boolean;

  // Loading states
  isLoadingDecks: boolean;
  isLoadingCards: boolean;
  isStudyingLoading: boolean;

  // Actions
  setDecks: (decks: IDeck[], total: number, page: number, totalPages: number) => void;
  setCurrentDeck: (deck: IDeck | null) => void;
  addDeck: (deck: IDeck) => void;
  updateDeck: (deckId: string, data: Partial<IDeck>) => void;
  removeDeck: (deckId: string) => void;

  setCards: (cards: IFlashcard[], total: number, page: number, totalPages: number) => void;
  addCard: (card: IFlashcard) => void;
  updateCard: (cardId: string, data: Partial<IFlashcard>) => void;
  removeCard: (cardId: string) => void;

  // Study mode actions
  startStudySession: (cards: IFlashcard[], stats: IStudyStats) => void;
  nextCard: () => void;
  flipCard: () => void;
  resetStudySession: () => void;
  setStudyStats: (stats: IStudyStats) => void;

  // Loading
  setLoadingDecks: (loading: boolean) => void;
  setLoadingCards: (loading: boolean) => void;
  setStudyingLoading: (loading: boolean) => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  // Initial state
  decks: [],
  currentDeck: null,
  totalDecks: 0,
  currentPage: 1,
  totalPages: 1,

  cards: [],
  totalCards: 0,
  cardsPage: 1,
  cardsTotalPages: 1,

  studyCards: [],
  currentCardIndex: 0,
  isFlipped: false,
  studyStats: null,
  isStudying: false,

  isLoadingDecks: false,
  isLoadingCards: false,
  isStudyingLoading: false,

  // Deck actions
  setDecks: (decks, total, page, totalPages) =>
    set({ decks, totalDecks: total, currentPage: page, totalPages }),

  setCurrentDeck: (deck) => set({ currentDeck: deck }),

  addDeck: (deck) =>
    set((state) => ({
      decks: [deck, ...state.decks],
      totalDecks: state.totalDecks + 1,
    })),

  updateDeck: (deckId, data) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, ...data } : d
      ),
      currentDeck:
        state.currentDeck?.id === deckId
          ? { ...state.currentDeck, ...data }
          : state.currentDeck,
    })),

  removeDeck: (deckId) =>
    set((state) => ({
      decks: state.decks.filter((d) => d.id !== deckId),
      totalDecks: state.totalDecks - 1,
      currentDeck:
        state.currentDeck?.id === deckId ? null : state.currentDeck,
    })),

  // Card actions
  setCards: (cards, total, page, totalPages) =>
    set({
      cards,
      totalCards: total,
      cardsPage: page,
      cardsTotalPages: totalPages,
    }),

  addCard: (card) =>
    set((state) => ({
      cards: [card, ...state.cards],
      totalCards: state.totalCards + 1,
    })),

  updateCard: (cardId, data) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, ...data } : c
      ),
    })),

  removeCard: (cardId) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== cardId),
      totalCards: state.totalCards - 1,
    })),

  // Study mode actions
  startStudySession: (cards, stats) =>
    set({
      studyCards: cards,
      currentCardIndex: 0,
      isFlipped: false,
      studyStats: stats,
      isStudying: true,
    }),

  nextCard: () =>
    set((state) => ({
      currentCardIndex: state.currentCardIndex + 1,
      isFlipped: false,
    })),

  flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

  resetStudySession: () =>
    set({
      studyCards: [],
      currentCardIndex: 0,
      isFlipped: false,
      studyStats: null,
      isStudying: false,
    }),

  setStudyStats: (stats) => set({ studyStats: stats }),

  // Loading actions
  setLoadingDecks: (loading) => set({ isLoadingDecks: loading }),
  setLoadingCards: (loading) => set({ isLoadingCards: loading }),
  setStudyingLoading: (loading) => set({ isStudyingLoading: loading }),
}));
