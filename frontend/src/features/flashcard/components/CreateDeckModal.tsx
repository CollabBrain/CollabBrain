import { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import type { IDeck } from "../../../types/flashcard";

// Color presets
const COLOR_PRESETS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
  { name: "Red", value: "#EF4444" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Indigo", value: "#6366F1" },
];

// Icon presets
const ICON_OPTIONS = [
  {
    name: "Book",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    name: "Language",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    name: "Science",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 3h6v5l4 9H5l4-9V3z" />
        <path d="M9 3h6" />
        <circle cx="12" cy="15" r="2" />
      </svg>
    ),
  },
  {
    name: "Math",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="6" y1="18" x2="18" y2="6" />
      </svg>
    ),
  },
  {
    name: "History",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    name: "Code",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    name: "Music",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    name: "Art",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="13.5" cy="6.5" r=".5" />
        <circle cx="17.5" cy="10.5" r=".5" />
        <circle cx="8.5" cy="7.5" r=".5" />
        <circle cx="6.5" cy="12.5" r=".5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
      </svg>
    ),
  },
];

interface CreateDeckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    color: string;
    icon?: string;
    isPublic?: boolean;
  }) => void;
  editDeck?: IDeck | null;
  isLoading?: boolean;
}

export const CreateDeckModal = ({
  open,
  onOpenChange,
  onSubmit,
  editDeck,
  isLoading = false,
}: CreateDeckModalProps) => {
  const [name, setName] = useState(editDeck?.name || "");
  const [description, setDescription] = useState(editDeck?.description || "");
  const [color, setColor] = useState(editDeck?.color || COLOR_PRESETS[0].value);
  const [icon, setIcon] = useState(editDeck?.icon || "");
  const [isPublic, setIsPublic] = useState(editDeck?.isPublic || false);

  // Reset form when modal opens/closes or editDeck changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(editDeck?.name || "");
      setDescription(editDeck?.description || "");
      setColor(editDeck?.color || COLOR_PRESETS[0].value);
      setIcon(editDeck?.icon || "");
      setIsPublic(editDeck?.isPublic || false);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon: icon || undefined,
      isPublic,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editDeck ? "Chỉnh sửa Deck" : "Tạo Deck mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên Deck *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Từ vựng Tiếng Anh"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về nội dung deck..."
              rows={3}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Màu sắc</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Biểu tượng</Label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setIcon(opt.name)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all flex items-center justify-center",
                    icon === opt.name
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted hover:bg-muted/80"
                  )}
                  style={{ color }}
                  title={opt.name}
                >
                  {opt.svg}
                </button>
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isPublic ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isPublic ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <Label className="cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
              Công khai cho mọi người
            </Label>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Xem trước</Label>
            <div
              className="p-4 rounded-xl border bg-card"
              style={{ borderTopColor: color, borderTopWidth: "4px" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {icon && ICON_OPTIONS.find((i) => i.name === icon)?.svg}
                </div>
                <div>
                  <p className="font-semibold">{name || "Tên Deck"}</p>
                  <p className="text-sm text-muted-foreground">
                    {description || "Mô tả deck"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading
                ? "Đang xử lý..."
                : editDeck
                ? "Lưu thay đổi"
                : "Tạo Deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
