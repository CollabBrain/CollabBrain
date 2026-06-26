import { useState, useEffect, useRef, useCallback } from 'react';
import { Smile, Search, X } from 'lucide-react';

// ——— Types ———
interface EmojiEntry {
  name: string;
  slug: string;
  group: string;
  skin_tone_support: boolean;
}

interface EmojiData {
  [emoji: string]: EmojiEntry;
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

// ——— Groups display config ———
const GROUP_LABELS: Record<string, { label: string; icon: string }> = {
  'Smileys & Emotion': { label: 'Cảm xúc', icon: '😀' },
  'People & Body': { label: 'Con người', icon: '👋' },
  'Animals & Nature': { label: 'Thiên nhiên', icon: '🐶' },
  'Food & Drink': { label: 'Thức ăn', icon: '🍎' },
  'Travel & Places': { label: 'Địa điểm', icon: '🌍' },
  'Activities': { label: 'Hoạt động', icon: '⚽' },
  'Objects': { label: 'Vật dụng', icon: '💡' },
  'Symbols': { label: 'Ký hiệu', icon: '❤️' },
  'Flags': { label: 'Cờ', icon: '🏳️' },
};

const GROUP_ORDER = Object.keys(GROUP_LABELS);

// ——— EmojiPicker ———
const EmojiPicker = ({ onEmojiSelect, onClose }: EmojiPickerProps) => {
  const [emojiData, setEmojiData] = useState<EmojiData>({});
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('Smileys & Emotion');
  const [isLoading, setIsLoading] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load data-by-emoji.json từ public/
  useEffect(() => {
    fetch('/data-by-emoji.json')
      .then(r => r.json())
      .then((data: EmojiData) => {
        setEmojiData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // Focus search on mount
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Grouped emojis
  const groupedEmojis = useCallback(() => {
    const result: Record<string, string[]> = {};

    for (const [emoji, data] of Object.entries(emojiData)) {
      // Bỏ qua skin tone variants
      if (data.skin_tone_support) continue;

      const group = data.group;
      if (!result[group]) result[group] = [];

      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          emoji.includes(q) ||
          data.name.toLowerCase().includes(q) ||
          data.slug.toLowerCase().includes(q)
        ) {
          result[group].push(emoji);
        }
      } else {
        result[group].push(emoji);
      }
    }

    return result;
  }, [emojiData, search]);

  const grouped = groupedEmojis();
  const searchResults = search.trim()
    ? Object.values(grouped).flat().slice(0, 60)
    : null;

  // Available groups (có emoji)
  const availableGroups = GROUP_ORDER.filter(g => grouped[g]?.length > 0);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-14 left-0 z-50 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-150"
      style={{ maxHeight: '420px' }}
    >
      {/* Search header */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm emoji..."
            className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Group tabs — chỉ hiện khi không tìm kiếm */}
      {!search.trim() && (
        <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto scrollbar-none">
          {availableGroups.map(group => {
            const cfg = GROUP_LABELS[group] || { icon: '❓' };
            return (
              <button
                key={group}
                title={cfg.label || group}
                onClick={() => setActiveGroup(group)}
                className={[
                  'shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-base border-0 cursor-pointer transition-all',
                  activeGroup === group
                    ? 'bg-indigo-100 shadow-sm scale-110'
                    : 'hover:bg-slate-100 opacity-70 hover:opacity-100'
                ].join(' ')}
              >
                {cfg.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-24 text-slate-400 text-xs">
            Đang tải...
          </div>
        ) : searchResults ? (
          /* Kết quả tìm kiếm */
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1 py-2">
              {searchResults.length} kết quả
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {searchResults.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onEmojiSelect(emoji); }}
                  title={emojiData[emoji]?.name}
                  className="h-9 w-full flex items-center justify-center text-xl rounded-lg hover:bg-indigo-50 hover:scale-110 transition-all border-0 bg-transparent cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
              {searchResults.length === 0 && (
                <p className="col-span-8 text-center text-xs text-slate-400 py-6">
                  Không tìm thấy emoji nào
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Hiển thị theo nhóm đang active */
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1 py-2">
              {GROUP_LABELS[activeGroup]?.label || activeGroup}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {(grouped[activeGroup] || []).map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onEmojiSelect(emoji); }}
                  title={emojiData[emoji]?.name}
                  className="h-9 w-full flex items-center justify-center text-xl rounded-lg hover:bg-indigo-50 hover:scale-110 transition-all border-0 bg-transparent cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ——— Emoji Trigger Button ———
interface EmojiButtonProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export const EmojiButton = ({ onEmojiSelect, className = '' }: EmojiButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  }, [onEmojiSelect]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={[
          'h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0 border-0 cursor-pointer',
          isOpen
            ? 'bg-indigo-100 text-indigo-600'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        ].join(' ')}
        title="Chèn emoji"
        aria-label="Chèn emoji"
      >
        <Smile className="h-5 w-5" />
      </button>

      {isOpen && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default EmojiPicker;
