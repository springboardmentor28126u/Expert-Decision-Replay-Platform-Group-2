import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 rounded-lg bg-error-bg border border-error-border text-error space-y-2">
          <h3 className="font-semibold text-lg">Something went wrong</h3>
          <p className="text-sm opacity-90">{this.state.error?.message || 'An error occurred.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
