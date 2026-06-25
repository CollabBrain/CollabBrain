import { useState } from "react";
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

interface CreateFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    front: string;
    back: string;
    hint?: string;
  }) => void;
  isLoading?: boolean;
}

export const CreateFlashcardModal = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateFlashcardModalProps) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [hint, setHint] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    onSubmit({ front: front.trim(), back: back.trim(), hint: hint.trim() || undefined });
    setFront("");
    setBack("");
    setHint("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFront("");
      setBack("");
      setHint("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Flashcard mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Mặt trước (Câu hỏi) *</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Nhập câu hỏi..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="back">Mặt sau (Đáp án) *</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Nhập đáp án..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hint">Gợi ý (tùy chọn)</Label>
            <Input
              id="hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Gợi ý để nhớ câu trả lời..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!front.trim() || !back.trim() || isLoading}>
              {isLoading ? "Đang thêm..." : "Thêm thẻ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
