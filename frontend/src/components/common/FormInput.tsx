import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
}

/**
 * FormInput — bọc Input + Label + thông báo lỗi.
 * Dùng lại ở tất cả các form (Login, Register, ForgotPassword, Profile).
 */
const FormInput = ({ label, error, id, className, ...props }: FormInputProps) => {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
        {...props}
      />
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
