import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — Bắt lỗi render trong component tree.
 * Nếu có lỗi, hiển thị thông báo thay vì trang trắng.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-8 text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="font-bold text-slate-800 text-base">
              {this.props.fallbackLabel ?? 'Đã xảy ra lỗi'}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed font-mono bg-slate-50 rounded-lg p-2 text-left break-all">
              {this.state.error?.message ?? 'Unknown error'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer border-0 outline-none"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
