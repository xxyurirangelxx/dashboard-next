'use client';

import { useState, useMemo } from 'react';
import { FileSpreadsheet, Search, Info, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { formatCurrencyBRL } from '@/lib/utils';
import { exportToStyledExcel } from '@/lib/excelExport';

export default function AnaliseSalarialPage() {
    const { state, dispatch, showNotification } = useDashboard();
    const [searchText, setSearchText] = useState('');
    const { masterData, currentlyDisplayedData, uiConfig } = state;

    const filteredData = useMemo(() => {
        const text = searchText.toLowerCase();
        if (!text) return masterData;
        return masterData.filter(
            item => item.nome.toLowerCase().includes(text) || item.matricula.includes(text)
        );
    }, [masterData, searchText]);

    const handleExport = () => {
        const success = exportToStyledExcel(masterData, currentlyDisplayedData, {
            vales: uiConfig.kpiTitleVales,
            credito: uiConfig.kpiTitleCredito,
            ativos: uiConfig.kpiTitleAtivos,
        });
        if (success) {
            showNotification('Relatório Excel PRO gerado com sucesso!', 'success');
        } else {
            showNotification('Sem dados para exportar', 'error');
        }
    };

    const openDetails = (matricula) => {
        const employee = masterData.find(e => e.matricula === String(matricula));
        if (employee) dispatch({ type: 'SET_MODAL_EMPLOYEE', payload: employee });
    };

    return (
        <section id="page-analise-salarial" className="animate-in space-y-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Análise de Comprometimento Salarial</h2>
                        <p className="text-sm text-muted-foreground mt-1">Total de {masterData.length} registros processados.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-72"
                                placeholder="Buscar funcionário ou matrícula..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center justify-center h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl text-sm font-bold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Exportar Excel
                        </button>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border bg-blue-50/50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-200">
                    <Info className="h-5 w-5 shrink-0" />
                    <p>
                        Esta seção exibe <strong className="font-semibold">todos os funcionários</strong> baseados nos arquivos carregados.
                        A filtragem lateral aplica-se somente aos gráficos no <strong className="font-semibold">Dashboard</strong> principal.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg border">
                    <span className="font-semibold text-foreground">Risco Geração de Vales</span>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" /><span>&lt; 25% (Normal)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" /><span>25% - 30% (Alerta)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive shadow-sm" /><span>&gt; 30% (Alto)</span></div>
                </div>

                <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
                            <tr className="border-b">
                                <th className="h-10 px-4 align-middle">Funcionário</th>
                                <th className="h-10 px-4 align-middle text-right">Total Vales</th>
                                <th className="h-10 px-4 align-middle text-right">Total C.C</th>
                                <th className="h-10 px-4 align-middle min-w-[200px]">% Salário Comprometido</th>
                                <th className="h-10 px-4 align-middle text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Search className="w-8 h-8 text-muted" />
                                            <p className="font-medium text-base">Nenhum registro encontrado</p>
                                            <p className="text-sm">Tente buscar por um nome ou matrícula diferente.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map(item => {
                                    let barColorClass = 'bg-slate-200 dark:bg-slate-700';
                                    let textWarnClass = 'text-foreground';

                                    if (item.salario > 0) {
                                        if (item.percentual >= 30) {
                                            barColorClass = 'bg-destructive';
                                            textWarnClass = 'text-destructive font-semibold';
                                        }
                                        else if (item.percentual >= 25) {
                                            barColorClass = 'bg-amber-400';
                                            textWarnClass = 'text-amber-500 dark:text-amber-400 font-semibold';
                                        }
                                        else { barColorClass = 'bg-emerald-500'; }
                                    }

                                    return (
                                        <tr key={item.matricula} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{item.nome}</span>
                                                    <span className="text-xs text-muted-foreground font-mono mt-0.5">#{item.matricula}</span>
                                                    {item.situacao === 'PENDENTE (Fora do QLP)' && (
                                                        <span className="inline-flex mt-2 w-fit items-center rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                                                            {item.situacao}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right font-medium">
                                                {formatCurrencyBRL(item.totalVales)}
                                            </td>
                                            <td className="p-4 align-middle text-right font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.excedeuCredito && (
                                                        <div title={`Este usuário excedeu seu teto máximo de compras do mês (${formatCurrencyBRL(item.limiteCredito)})`} className="bg-destructive/10 text-destructive p-1 rounded cursor-help">
                                                            <AlertTriangle className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <span>{formatCurrencyBRL(item.totalCredito)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`${barColorClass} h-full transition-all duration-500 ease-out`}
                                                            style={{ width: `${item.salario > 0 ? Math.min(item.percentual, 100) : 0}%` }}
                                                        />
                                                    </div>
                                                    <span className={`w-12 text-right text-sm tabular-nums ${textWarnClass}`}>
                                                        {item.salario > 0 ? `${item.percentual.toFixed(1)}%` : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <button
                                                    onClick={() => openDetails(item.matricula)}
                                                    className="inline-flex items-center justify-center rounded-lg text-sm font-bold transition-all active:scale-95 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border-2 border-input bg-background shadow-sm hover:bg-primary/10 hover:text-primary hover:border-primary/50 h-9 px-4"
                                                >
                                                    Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
