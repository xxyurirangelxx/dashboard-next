'use client';

import { useDashboard } from '@/context/DashboardContext';
import { Storage } from '@/lib/db';
import {
    LayoutDashboard, Users, FileDiff,
    UploadCloud, Settings2, Palette, HelpCircle,
    BarChart3, Share2, Receipt
} from 'lucide-react';

const navItems = [
    { id: 'page-dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'page-analise-salarial', label: 'Análise de Equipe', icon: Users },
    { id: 'page-comparativo', label: 'Comparativo Mensal', icon: FileDiff },
    { id: 'page-vales-pendentes', label: 'Vales Pendentes', icon: Receipt },
    { id: 'page-atualizar', label: 'Bases de Dados', icon: UploadCloud },
    { id: 'page-configuracoes', label: 'Regras de Negócio', icon: Settings2 },
    { id: 'page-configuracoes-ui', label: 'Aspecto Visual', icon: Palette },
    { id: 'page-ajuda', label: 'Suporte', icon: HelpCircle },
];

export default function Sidebar() {
    const { state, dispatch, navigateToPage, showNotification, loadData } = useDashboard();

    // Safely extract funcoes without breaking
    const funcoes = [...new Set((state.masterData || []).map(i => i.funcao).filter(f => f && f !== 'N/A'))].sort();

    const handleShare = async () => {
        try {
            const currentUrl = new URL(window.location.origin + window.location.pathname);
            currentUrl.searchParams.set('page', state.activePage);
            
            if (state.filterFuncao !== 'Todos') {
                currentUrl.searchParams.set('funcao', state.filterFuncao);
            }
            if (state.filterRisco !== 'Todos') {
                currentUrl.searchParams.set('risco', state.filterRisco);
            }
            if (state.selectedMes !== 'atual') {
                currentUrl.searchParams.set('mes', state.selectedMes);
            }

            // Include comparativo data if on that page
            if (state.activePage === 'page-comparativo') {
                if (state.urlParams?.tab) currentUrl.searchParams.set('tab', state.urlParams.tab);
                if (state.urlParams?.mesAnterior) currentUrl.searchParams.set('mesAnterior', state.urlParams.mesAnterior);
                if (state.urlParams?.mesAtual) currentUrl.searchParams.set('mesAtual', state.urlParams.mesAtual);
            }

            await navigator.clipboard.writeText(currentUrl.toString());
            showNotification('Link da visualização atual copiado! Envie para sua equipe compartilhar desta mesma visão.', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showNotification('Não foi possível copiar o link.', 'error');
        }
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r bg-card text-card-foreground hidden md:flex shadow-sm">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="font-bold tracking-tight text-lg text-foreground">
                        {state.uiConfig?.mainTitle || "Dashboard PRO"}
                    </span>
                </div>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto customize-scrollbar px-4 py-6 space-y-1">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = state.activePage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigateToPage(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                            {item.label}
                        </button>
                    );
                })}

                {/* Filters Section natively inside sidebar */}
                <div className="pt-8 pb-2">
                    <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Filtros de Visão
                    </h4>
                    <div className="space-y-4 px-3">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">Mês de Referência</label>
                            <select
                                className="w-full bg-background border rounded-lg px-3 py-2 text-[13px] text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                                value={state.selectedMes || 'atual'}
                                onChange={(e) => {
                                    dispatch({ type: 'SET_SELECTED_MES', payload: e.target.value });
                                    loadData(e.target.value);
                                }}
                            >
                                <option value="atual">Mais Recente (Padrão)</option>
                                {state.availableMonths?.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">Cargo Funcional</label>
                            <select
                                className="w-full bg-background border rounded-lg px-3 py-2 text-[13px] text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                                value={state.filterFuncao}
                                onChange={(e) => dispatch({ type: 'SET_FILTER_FUNCAO', payload: e.target.value })}
                            >
                                <option value="Todos">Todos os Cargos</option>
                                {funcoes.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">Grau de Risco</label>
                            <select
                                className="w-full bg-background border rounded-lg px-3 py-2 text-[13px] text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                                value={state.filterRisco}
                                onChange={(e) => dispatch({ type: 'SET_FILTER_RISCO', payload: e.target.value })}
                            >
                                <option value="Todos">Todos os Níveis</option>
                                <option value="Normal">Saudável (&lt; 25%)</option>
                                <option value="Alerta">Atenção (25% - 30%)</option>
                                <option value="Alto">Crítico (&gt; 30%)</option>
                            </select>
                        </div>

                        {(state.filterFuncao !== 'Todos' || state.filterRisco !== 'Todos' || state.selectedMes !== 'atual') && (
                            <button
                                onClick={() => {
                                    dispatch({ type: 'SET_FILTER_FUNCAO', payload: 'Todos' });
                                    dispatch({ type: 'SET_FILTER_RISCO', payload: 'Todos' });
                                    if(state.selectedMes !== 'atual') {
                                        dispatch({ type: 'SET_SELECTED_MES', payload: 'atual' });
                                        loadData('atual');
                                    }
                                }}
                                className="w-full py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Profile/Status */}
            <div className="p-4 border-t bg-muted/30 flex flex-col gap-3">
                <button 
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <Share2 className="w-5 h-5" />
                    Compartilhar Visão
                </button>
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col overflow-hidden leading-tight">
                        <p className="text-sm font-medium text-foreground truncate">Módulo Ativo</p>
                        <p className="text-[11px] text-muted-foreground truncate">{state.masterData?.length || 0} registros base</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
