export type CardDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface IDeck {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  groupId?: string;
  group?: {
    id: string;
    name: string;
  };
  cards?: IFlashcard[];
  cardCount?: number;
  shares?: IDeckShare[];
  _count?: {
    cards: number;
  };
}

export interface IDeckShare {
  id: string;
  deckId: string;
  userId: string;
  canEdit: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface IFlashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;
  imageUrl?: string;
  tags: string[];
  difficulty: CardDifficulty;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  nextReviewAt?: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  deck?: {
    id: string;
    name: string;
    color?: string;
  };
}

export interface IReview {
  id: string;
  cardId: string;
  userId: string;
  quality: number;
  timeSpent?: number;
  createdAt: string;
}

export interface IStudyStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learnedCards: number;
}

export interface IStudySession {
  cards: IFlashcard[];
  stats: IStudyStats;
}

export interface IReviewResult {
  card: IFlashcard;
  nextReviewIn: number;
  easeFactor: number;
}

// API Response types
export interface IDecksResponse {
  decks: IDeck[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ICardsResponse {
  cards: IFlashcard[];
  total: number;
  page: number;
  totalPages: number;
}

// Form types
export interface ICreateDeckForm {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  groupId?: string;
}

export interface ICreateFlashcardForm {
  front: string;
  back: string;
  hint?: string;
  imageUrl?: string;
  tags?: string[];
  difficulty?: CardDifficulty;
}

export interface IBulkFlashcardForm {
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
    tags?: string[];
  }>;
}

export interface IReviewForm {
  quality: number; // 0-5
  timeSpent?: number;
}
