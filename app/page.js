'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';
import DetailsModal from '@/components/DetailsModal';
import { Menu } from 'lucide-react';

const DashboardPage = dynamic(() => import('@/components/pages/DashboardPage'), { ssr: false });
const AnaliseSalarialPage = dynamic(() => import('@/components/pages/AnaliseSalarialPage'), { ssr: false });
const ComparativoPage = dynamic(() => import('@/components/pages/ComparativoPage'), { ssr: false });
const AtualizarDadosPage = dynamic(() => import('@/components/pages/AtualizarDadosPage'), { ssr: false });
const ConfiguracoesPage = dynamic(() => import('@/components/pages/ConfiguracoesPage'), { ssr: false });
const AparenciaPage = dynamic(() => import('@/components/pages/AparenciaPage'), { ssr: false });
const AjudaPage = dynamic(() => import('@/components/pages/AjudaPage'), { ssr: false });
const ValesPendentesPage = dynamic(() => import('@/components/pages/ValesPendentesPage'), { ssr: false });

function DashboardContent() {
  const { state } = useDashboard();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pages = {
    'page-dashboard': <DashboardPage />,
    'page-analise-salarial': <AnaliseSalarialPage />,
    'page-comparativo': <ComparativoPage />,
    'page-atualizar': <AtualizarDadosPage />,
    'page-configuracoes': <ConfiguracoesPage />,
    'page-configuracoes-ui': <AparenciaPage />,
    'page-ajuda': <AjudaPage />,
    'page-vales-pendentes': <ValesPendentesPage />,
  };

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      {!state.isSharedMode && <Sidebar />}

      {/* Mobile Header Overlay */}
      {!state.isSharedMode && (
        <div className="md:hidden flex h-16 items-center px-4 border-b bg-card w-full shadow-sm z-40 sticky top-0 justify-between">
          <span className="font-bold text-foreground truncate">{state.uiConfig?.mainTitle || "Dashboard PRO"}</span>
          <button
            className="p-2.5 -mr-2 text-muted-foreground hover:bg-muted rounded-xl hover:shadow-sm active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 w-full min-w-0 ${state.isSharedMode ? 'md:ml-0' : 'md:ml-72'}`}>
        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 animate-in w-full max-w-[1600px] mx-auto">
          {pages[state.activePage] || <DashboardPage />}
        </main>
      </div>

      <DetailsModal />
      <Notification />
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-8 rounded-xl bg-card border shadow-lg flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Iniciando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
