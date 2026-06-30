import { useState, useEffect, useCallback } from "react";
import { cn } from "../../../lib/utils";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import type { IFlashcard } from "../../../types/flashcard";
import {
  RotateCcw,
  Check,
  X,
  Eye,
  EyeOff,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";

// Icons
const FlipIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const AgainIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const HardIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const GoodIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const EasyIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

interface StudyCardProps {
  cards: IFlashcard[];
  currentIndex: number;
  isFlipped: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmitReview: (quality: number) => void;
  isSubmitting?: boolean;
}

export const StudyCard = ({
  cards,
  currentIndex,
  isFlipped,
  onFlip,
  onNext,
  onPrev,
  onSubmitReview,
  isSubmitting = false,
}: StudyCardProps) => {
  const [startTime, setStartTime] = useState<number>(Date.now());

  const currentCard = cards[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === cards.length - 1;
  const progress = ((currentIndex + 1) / cards.length) * 100;

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  const handleReview = (quality: number) => {
    const timeSpent = Date.now() - startTime;
    onSubmitReview(quality);
  };

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold">Hoàn thành!</h2>
        <p className="text-muted-foreground mt-2">
          Bạn đã học hết {cards.length} thẻ
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <span>{Math.round(progress)}% hoàn thành</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="w-full h-[360px] [perspective:1000px] select-none relative mb-6">
        <div
          className={cn(
            "relative w-full h-full transition-all duration-700 [transform-style:preserve-3d]",
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          )}
        >
          {/* FRONT SIDE (Câu hỏi) */}
          <Card
            className="absolute inset-0 w-full h-full flex flex-col justify-between cursor-pointer border-2 hover:shadow-xl [backface-visibility:hidden] bg-card text-card-foreground rounded-2xl"
            onClick={onFlip}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold">
                  Mặt trước - Câu hỏi (Nhấn để xem đáp án)
                </span>
              </div>
              
              <span
                className={cn(
                  "px-2 py-1 text-xs rounded-full font-semibold",
                  currentCard.difficulty === "EASY" && "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
                  currentCard.difficulty === "MEDIUM" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
                  currentCard.difficulty === "HARD" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                )}
              >
                {currentCard.difficulty === "EASY"
                  ? "Dễ"
                  : currentCard.difficulty === "MEDIUM"
                  ? "Trung bình"
                  : "Khó"}
              </span>
            </div>

            {/* Card Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <p className="text-xl font-bold whitespace-pre-wrap text-center max-w-md">
                {currentCard.front}
              </p>

              {currentCard.hint && (
                <p className="text-sm text-muted-foreground mt-4 italic bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  Gợi ý: {currentCard.hint}
                </p>
              )}
            </div>

            {/* Card Footer */}
            <div className="flex justify-center p-4 border-t bg-slate-50/50 dark:bg-slate-900/10 rounded-b-2xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                className="gap-2 text-primary"
              >
                <FlipIcon />
                Lật thẻ
              </Button>
            </div>
          </Card>

          {/* BACK SIDE (Đáp án) */}
          <Card
            className="absolute inset-0 w-full h-full flex flex-col justify-between cursor-pointer border-2 border-primary/20 hover:shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] bg-card text-card-foreground rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.05)]"
            onClick={onFlip}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-semibold">
                  Mặt sau - Đáp án
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                className="gap-1 text-muted-foreground h-7 px-2"
              >
                <FlipIcon />
                Lật lại
              </Button>
            </div>

            {/* Card Content */}
            <div className="flex-1 flex items-center justify-center p-6 bg-indigo-50/10 dark:bg-indigo-950/5">
              <p className="text-xl font-bold text-primary whitespace-pre-wrap text-center max-w-md">
                {currentCard.back}
              </p>
            </div>

            {/* Empty space aligning style with Front side */}
            <div className="h-[60px] rounded-b-2xl border-t border-transparent" />
          </Card>
        </div>
      </div>

      {/* Review Buttons - Only show when flipped */}
      {isFlipped && (
        <div className="mt-6">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Bạn nhớ câu trả lời này không?
          </p>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 bg-red-50 hover:bg-red-100 border-red-200"
              onClick={() => handleReview(0)}
              disabled={isSubmitting}
            >
              <AgainIcon />
              <span className="text-xs">Quên</span>
              <span className="text-[10px] text-muted-foreground">1 phút</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 bg-orange-50 hover:bg-orange-100 border-orange-200"
              onClick={() => handleReview(2)}
              disabled={isSubmitting}
            >
              <HardIcon />
              <span className="text-xs">Khó</span>
              <span className="text-[10px] text-muted-foreground">6 phút</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 bg-green-50 hover:bg-green-100 border-green-200"
              onClick={() => handleReview(3)}
              disabled={isSubmitting}
            >
              <GoodIcon />
              <span className="text-xs">Nhớ</span>
              <span className="text-[10px] text-muted-foreground">1 ngày</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => handleReview(5)}
              disabled={isSubmitting}
            >
              <EasyIcon />
              <span className="text-xs">Dễ</span>
              <span className="text-[10px] text-muted-foreground">4 ngày</span>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={isFirst}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Trước
        </Button>
        <Button
          variant="ghost"
          onClick={onNext}
          disabled={isLast}
          className="gap-2"
        >
          Sau
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
