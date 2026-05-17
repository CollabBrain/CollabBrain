import { useRef } from 'react';
import { cn } from '../../lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  length?: number;
}

/**
 * OtpInput — 6 ô nhập OTP riêng biệt, tự động focus ô tiếp theo.
 */
const OtpInput = ({ value, onChange, error, length = 6 }: OtpInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return; // Chỉ cho phép 1 chữ số hoặc rỗng

    // Tạo mảng ký tự hiện tại
    const digits = value.padEnd(length, ' ').split('');
    digits[index] = char || ' ';
    onChange(digits.join('').trimEnd());

    // Auto-focus ô tiếp theo khi nhập
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        // Xoá ký tự tại ô hiện tại
        const digits = value.padEnd(length, ' ').split('');
        digits[index] = ' ';
        onChange(digits.join('').trimEnd());
      } else if (index > 0) {
        // Focus ô trước nếu ô hiện tại đã rỗng
        inputsRef.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    // Focus vào ô cuối cùng đã điền
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] && value[i] !== ' ' ? value[i] : ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              'w-11 h-12 text-center text-lg font-semibold rounded-md border border-input bg-background',
              'focus:outline-none focus:ring-2 focus:ring-ring transition-all',
              error && 'border-destructive focus:ring-destructive'
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-destructive text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default OtpInput;
