import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { ButtonProps } from '../ui/button';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * LoadingButton — hiển thị spinner khi đang xử lý.
 */
const LoadingButton = ({
  isLoading = false,
  loadingText = 'Đang xử lý...',
  children,
  disabled,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;
