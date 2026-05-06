'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('SearchErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-[#1e293b]">
            {this.props.fallbackLabel || 'A card failed to render'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
