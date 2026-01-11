import React, { ReactNode, Component } from 'react';
import type { ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public declare props: Readonly<Props>;
  public declare state: Readonly<State>;
  public declare setState: Component<Props, State>["setState"];
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 z-[9999]">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-10 shadow-2xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                <AlertTriangle size={48} className="text-rose-500" />
              </div>
            </div>
            
            <h2 className="text-3xl font-black mb-4 text-slate-900 dark:text-white">
              Oops! Something went wrong
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-8 font-bold leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <RefreshCw size={20} />
                Refresh Page
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex items-center justify-center gap-3 w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                <Home size={20} />
                Reset & Start Fresh
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
                  Error Details
                </summary>
                <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded-xl overflow-auto max-h-48 font-mono text-slate-600 dark:text-slate-400">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
