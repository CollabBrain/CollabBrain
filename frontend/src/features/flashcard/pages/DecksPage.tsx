import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFlashcardStore } from "../store/flashcard.store";
import {
  getMyDecksApi,
  getExploreDecksApi,
  createDeckApi,
  updateDeckApi,
  deleteDeckApi,
  getStudyCardsApi,
} from "../services/flashcard.service";
import { DeckCard } from "../components/DeckCard";
import { CreateDeckModal } from "../components/CreateDeckModal";
import { StudyCard } from "../components/StudyCard";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card } from "../../../components/ui/card";
import type { IDeck, IFlashcard } from "../../../types/flashcard";

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const LayoutGridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const BookOpenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const LayersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type TabType = "my" | "explore";
type ViewMode = "grid" | "list";

export const DecksPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("my");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<IDeck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Study mode state
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<IFlashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const {
    decks,
    setDecks,
    addDeck,
    updateDeck: updateDeckStore,
    removeDeck,
    setLoadingDecks,
    isLoadingDecks,
  } = useFlashcardStore();

  // Load decks
  useEffect(() => {
    const loadDecks = async () => {
      setIsLoading(true);
      setLoadingDecks(true);
      try {
        const res =
          activeTab === "my"
            ? await getMyDecksApi()
            : await getExploreDecksApi();
        if (res.data.code === 200) {
          setDecks(
            res.data.data.decks,
            res.data.data.total,
            res.data.data.page,
            res.data.data.totalPages
          );
        }
      } catch (error) {
        console.error("Failed to load decks:", error);
      } finally {
        setIsLoading(false);
        setLoadingDecks(false);
      }
    };
    loadDecks();
  }, [activeTab]);

  // Filter decks by search
  const filteredDecks = decks.filter(
    (deck) =>
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleCreateDeck = async (data: {
    name: string;
    description?: string;
    color: string;
    icon?: string;
    isPublic?: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingDeck) {
        const res = await updateDeckApi(editingDeck.id, data);
        if (res.data.code === 200) {
          updateDeckStore(editingDeck.id, res.data.data);
          setEditingDeck(null);
        }
      } else {
        const res = await createDeckApi(data);
        if (res.data.code === 201) {
          addDeck(res.data.data);
        }
      }
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to save deck:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Bạn có chắc muốn xóa deck này?")) return;
    try {
      const res = await deleteDeckApi(deckId);
      if (res.data.code === 200) {
        removeDeck(deckId);
      }
    } catch (error) {
      console.error("Failed to delete deck:", error);
    }
  };

  const handleStudy = async (deckId: string) => {
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

  const handleViewDeck = (deckId: string) => {
    navigate(`/flashcard/decks/${deckId}`);
  };

  const handleSubmitReview = async (quality: number) => {
    // Move to next card after review
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // End of study
      setStudyMode(false);
    }
  };

  // Study mode
  if (studyMode) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => setStudyMode(false)}
              className="gap-2"
            >
              <XIcon />
              Thoát
            </Button>
            <h1 className="text-xl font-bold">Chế độ học</h1>
            <div className="w-20" />
          </div>

          {/* Study Card */}
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
            onSubmitReview={handleSubmitReview}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpenIcon />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Flashcard</h1>
                <p className="text-sm text-muted-foreground">
                  Học và ôn tập với flashcards
                </p>
              </div>
            </div>
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <PlusIcon />
              Tạo Deck
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b">
            <button
              onClick={() => setActiveTab("my")}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === "my"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Deck của tôi
              {activeTab === "my" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("explore")}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === "explore"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Khám phá
              {activeTab === "explore" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Tìm kiếm deck..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <SearchIcon />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <LayoutGridIcon />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredDecks.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <LayersIcon />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery
                ? "Không tìm thấy deck nào"
                : activeTab === "my"
                ? "Chưa có deck nào"
                : "Chưa có deck công khai"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Thử tìm kiếm với từ khóa khác"
                : activeTab === "my"
                ? "Tạo deck đầu tiên để bắt đầu học"
                : "Hãy là người đầu tiên chia sẻ deck!"}
            </p>
            {activeTab === "my" && !searchQuery && (
              <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                <PlusIcon />
                Tạo Deck đầu tiên
              </Button>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Deck Grid/List */}
        {!isLoading && filteredDecks.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filteredDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onEdit={(d) => {
                  setEditingDeck(d);
                  setCreateModalOpen(true);
                }}
                onDelete={handleDeleteDeck}
                onStudy={handleStudy}
                onView={handleViewDeck}
                isOwner={activeTab === "my"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateDeckModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setEditingDeck(null);
        }}
        onSubmit={handleCreateDeck}
        editDeck={editingDeck}
        isLoading={isSubmitting}
      />
    </div>
  );
};
