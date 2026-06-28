import { cn } from "../../../lib/utils";
import { Card, CardContent } from "../../../components/ui/card";
import type { IDeck } from "../../../types/flashcard";
import { Button } from "../../../components/ui/button";
import { MoreHorizontal, Users, BookOpen, Clock, Trash2, Edit, Eye } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

// SVG Icons
const DeckIcon = ({ color }: { color: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h6" />
  </svg>
);

const FireIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-orange-500"
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

interface DeckCardProps {
  deck: IDeck;
  onEdit?: (deck: IDeck) => void;
  onDelete?: (deckId: string) => void;
  onStudy?: (deckId: string) => void;
  onView?: (deckId: string) => void;
  isOwner?: boolean;
}

export const DeckCard = ({
  deck,
  onEdit,
  onDelete,
  onStudy,
  onView,
  isOwner = true,
}: DeckCardProps) => {
  const cardCount = deck._count?.cards || deck.cardCount || 0;

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
      style={{ borderTopColor: deck.color, borderTopWidth: "4px" }}
      onClick={() => onView?.(deck.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${deck.color}20` }}
          >
            <DeckIcon color={deck.color} />
          </div>

          {/* Middle: Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{deck.name}</h3>
              {deck.isPublic && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              )}
            </div>

            {deck.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {deck.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{cardCount} thẻ</span>
              </div>
              {cardCount > 0 && (
                <div className="flex items-center gap-1">
                  <FireIcon />
                  <span>{Math.floor(Math.random() * cardCount)} due</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {cardCount > 0 && (
                  <DropdownMenuItem onClick={() => onStudy?.(deck.id)}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mr-2"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Học ngay
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onView?.(deck.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(deck)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(deck.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Creator info */}
        {deck.creator && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <div className="w-5 h-5 rounded-full bg-muted overflow-hidden">
              {deck.creator.avatarUrl ? (
                <img
                  src={deck.creator.avatarUrl}
                  alt={deck.creator.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs">
                  {deck.creator.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {deck.creator.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
