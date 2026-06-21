import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen flex items-center justify-center bg-page">
          <div className="text-center space-y-4 max-w-sm px-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-danger-bg flex items-center justify-center">
              <span className="text-xl">!</span>
            </div>
            <p className="text-text-primary font-semibold">Something went wrong</p>
            <p className="text-xs text-text-tertiary font-mono break-all">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium bg-aviation text-white rounded-md hover:bg-[#0052A3] transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
