import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    const isChunkError =
      error.name === 'ChunkLoadError' ||
      /loading chunk/i.test(error.message) ||
      /Failed to fetch dynamically imported module/i.test(error.message);

    if (isChunkError) {
      // Reload the page after a brief delay to allow the updating screen to render
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const isChunkError =
        error &&
        (error.name === 'ChunkLoadError' ||
          /loading chunk/i.test(error.message) ||
          /Failed to fetch dynamically imported module/i.test(error.message));

      if (isChunkError) {
        return (
          <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-16 w-16 animate-spin items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-glow">
              <RefreshCcw className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Updating Titan...</h2>
            <p className="mt-4 max-w-md text-sm font-medium text-slate-500 leading-relaxed">
              A newer version of Titan is being loaded. Refreshing to complete the update...
            </p>
          </div>
        );
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-glow-red">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Something went wrong
          </h2>
          <p className="mt-4 max-w-md text-sm font-medium text-slate-500 leading-relaxed">
            {this.props.featureName ? `${this.props.featureName} failed to load. ` : ''}
            An unexpected error occurred locally. To protect your privacy, no data was sent
            automatically.
          </p>
          {this.state.error && (
            <pre className="mt-6 max-w-full overflow-auto rounded-xl bg-red-500/5 p-4 text-left text-[10px] font-mono text-red-400/60 border border-red-500/10">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-8 py-4 text-sm font-bold text-white border border-white/10 transition-all hover:bg-white/10 active:scale-95"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={() => {
                const report = {
                  error: this.state.error?.message,
                  stack: this.state.error?.stack,
                  timestamp: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(report, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `titan-error-report-${Date.now()}.json`;
                a.click();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-6 py-4 text-sm font-bold text-primary border border-primary/20 transition-all hover:bg-primary/20 active:scale-95"
            >
              Export Diagnostics
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
