import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Home } from './pages/Home';
import { ClosetConfigurator } from './pages/ClosetConfigurator';
import { KitchenConfigurator } from './pages/KitchenConfigurator';
import { SpecialFurnitureConfigurator } from './pages/SpecialFurnitureConfigurator';
import { HplBathroomConfigurator } from './pages/HplBathroomConfigurator';
import OfficeConfigurator from './pages/OfficeConfigurator';
import { ChairConfigurator } from './pages/ChairConfigurator';
import { useSupabaseAuthStore } from './store/supabaseAuthStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Algo salió mal en la aplicación</h2>
            <p className="text-sm text-slate-600 mb-6">{this.state.error?.message || 'Error desconocido'}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [route, setRoute] = useState<'home' | 'kitchen'>('home');
  const checkSession = useSupabaseAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <ErrorBoundary>
      {route === 'home' ? (
        <Home onNavigate={() => setRoute('kitchen')} />
      ) : (
        <KitchenConfigurator onNavigate={() => setRoute('home')} />
      )}
    </ErrorBoundary>
  );
}
