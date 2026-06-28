import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDeckByIdApi,
  getDeckCardsApi,
  createFlashcardApi,
  deleteFlashcardApi,
  getStudyCardsApi,
} from "../services/flashcard.service";
import { useFlashcardStore } from "../store/flashcard.store";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { StudyCard } from "../components/StudyCard";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import type { IDeck, IFlashcard } from "../../../types/flashcard";

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const DeckDetailPage = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<IDeck | null>(null);
  const [cards, setCards] = useState<IFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Study mode
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<IFlashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { addCard, removeCard } = useFlashcardStore();

  // Load deck and cards
  useEffect(() => {
    const loadData = async () => {
      if (!deckId) return;
      setIsLoading(true);
      try {
        const [deckRes, cardsRes] = await Promise.all([
          getDeckByIdApi(deckId),
          getDeckCardsApi(deckId),
        ]);
        if (deckRes.data.code === 200) setDeck(deckRes.data.data);
        if (cardsRes.data.code === 200) {
          setCards(cardsRes.data.data.cards);
        }
      } catch (error) {
        console.error("Failed to load deck:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [deckId]);

  // Filter cards
  const filteredCards = cards.filter(
    (card) =>
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleCreateCard = async (data: { front: string; back: string; hint?: string }) => {
    if (!deckId) return;
    setIsSubmitting(true);
    try {
      const res = await createFlashcardApi(deckId, data);
      if (res.data.code === 201) {
        setCards((prev) => [res.data.data, ...prev]);
        addCard(res.data.data);
      }
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create card:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Xóa thẻ này?")) return;
    try {
      const res = await deleteFlashcardApi(cardId);
      if (res.data.code === 200) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        removeCard(cardId);
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  const handleStartStudy = async () => {
    if (!deckId) return;
    try {
      const res = await getStudyCardsApi(deckId);
      if (res.data.code === 200) {
        if (res.data.data.cards.length === 0) {
          alert("Không có thẻ nào cần học!");
          return;
        }
        setStudyCards(res.data.data.cards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setStudyMode(true);
      }
    } catch (error) {
      console.error("Failed to start study:", error);
    }
  };

  // Study mode
  if (studyMode) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setStudyMode(false)} className="gap-2">
              <XIcon />
              Thoát
            </Button>
            <h1 className="text-xl font-bold">{deck?.name}</h1>
            <div className="w-20" />
          </div>
          <StudyCard
            cards={studyCards}
            currentIndex={currentCardIndex}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
            onNext={() => {
              setCurrentCardIndex((prev) => Math.min(prev + 1, studyCards.length - 1));
              setIsFlipped(false);
            }}
            onPrev={() => {
              setCurrentCardIndex((prev) => Math.max(prev - 1, 0));
              setIsFlipped(false);
            }}
            onSubmitReview={(quality) => {
              if (currentCardIndex < studyCards.length - 1) {
                setCurrentCardIndex((prev) => prev + 1);
                setIsFlipped(false);
              } else {
                setStudyMode(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy deck</h2>
          <Button onClick={() => navigate("/flashcard")}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-card border-b"
        style={{ borderTopColor: deck.color, borderTopWidth: "4px" }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/flashcard")} className="gap-2">
                <ArrowLeftIcon />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{deck.name}</h1>
                {deck.description && (
                  <p className="text-muted-foreground mt-1">{deck.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {cards.length} thẻ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cards.length > 0 && (
                <Button onClick={handleStartStudy} className="gap-2">
                  <PlayIcon />
                  Học ngay
                </Button>
              )}
              <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                <PlusIcon />
                Thêm thẻ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon />
          </div>
          <Input
            placeholder="Tìm kiếm trong deck..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Empty state */}
        {cards.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <CardIcon />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chưa có thẻ nào</h3>
            <p className="text-muted-foreground mb-6">
              Thêm thẻ đầu tiên để bắt đầu học
            </p>
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <PlusIcon />
              Thêm thẻ đầu tiên
            </Button>
          </div>
        )}

        {/* Cards list */}
        {cards.length > 0 && (
          <div className="space-y-3">
            {filteredCards.map((card) => (
              <Card key={card.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Câu hỏi
                      </span>
                    </div>
                    <p className="font-medium">{card.front}</p>
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs font-medium text-muted-foreground">
                        Đáp án
                      </span>
                      <p className="text-muted-foreground mt-1">{card.back}</p>
                    </div>
                    {card.hint && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Gợi ý: {card.hint}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Card Modal */}
      <CreateFlashcardModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateCard}
        isLoading={isSubmitting}
      />
    </div>
  );
};
