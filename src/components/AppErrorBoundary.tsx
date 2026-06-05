import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route render failed", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <section className="w-full max-w-lg rounded-[1.25rem] border border-white/80 bg-white/95 p-6 text-center shadow-[var(--shadow-card)] backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-black">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            This screen hit an unexpected error. Refreshing usually restores the current session.
          </p>
          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-left text-xs font-mono text-rose-200">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/85"
          >
            <RefreshCw className="h-4 w-4" /> Reload screen
          </button>
        </section>
      </div>
    );
  }
}
