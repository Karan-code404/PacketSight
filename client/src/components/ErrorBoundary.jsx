import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-primary flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-panel border border-border p-8 rounded-card max-w-md shadow-card space-y-5 animate-fade-in">
            <div className="flex justify-center">
              <div className="bg-danger/10 text-danger p-3 rounded-full border border-danger/25">
                <AlertOctagon className="w-10 h-10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-primary">Something went wrong</h1>
              <p className="text-secondary text-sm leading-relaxed">
                The application encountered an unexpected runtime error. Please reload to try again.
              </p>
            </div>

            {this.state.error && (
              <pre className="bg-[#0F1117] border border-border rounded-btn p-3 text-left font-mono text-[10px] text-danger/80 overflow-x-auto max-h-[120px] break-all">
                {this.state.error.toString()}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2 px-4 rounded-btn flex items-center justify-center gap-2 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
