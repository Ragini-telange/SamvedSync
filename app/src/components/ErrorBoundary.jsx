import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SamvedSync Error Boundary Caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-body">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-ink dark:text-white font-display">
                Clinical View Recovered
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A telemetry render issue was intercepted safely. Your session and patient data remain secure.
              </p>
              {this.state.error?.message && (
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-xs font-mono text-rose-600 dark:text-rose-400 text-left overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-saline hover:bg-saline-dim text-white text-xs font-semibold rounded-xl shadow-md shadow-saline/20 flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reload View
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-ink text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all"
              >
                <Home className="w-4 h-4" /> Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
