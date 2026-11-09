import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Component Tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReload = () => {
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#0A0A0A] text-slate-200 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-8 max-w-lg w-full shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 border border-orange-500/30">
              <AlertTriangle size={28} />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Recuperación de Vista</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Ocurrió una excepción inesperada en el renderizado de la escena. Puedes volver al inicio o recargar el espacio de trabajo.
            </p>

            {this.state.error && (
              <div className="w-full bg-black/50 border border-white/10 rounded-xl p-3 mb-6 text-left overflow-x-auto max-h-32 text-xs text-rose-400 font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <RefreshCw size={15} />
                <span>Recargar Aplicación</span>
              </button>
              <button
                onClick={() => {
                  window.location.search = '';
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-slate-200 hover:text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
              >
                <Home size={15} />
                <span>Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
