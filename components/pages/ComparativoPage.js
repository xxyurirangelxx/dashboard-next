'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Calendar, Loader2, Share2 } from 'lucide-react';
import Papa from 'papaparse';
import { useDashboard } from '@/context/DashboardContext';
import { parseCurrencyToCents, formatCurrencyBRL } from '@/lib/utils';
import DashboardChart from '@/components/DashboardChart';

export default function ComparativoPage() {
    const { state, dispatch, showNotification } = useDashboard();
    const [activeTab, setActiveTab] = useState('vales');
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMesAnterior, setSelectedMesAnterior] = useState(state.urlParams?.mesAnterior || '');
    const [selectedMesAtual, setSelectedMesAtual] = useState(state.urlParams?.mesAtual || '');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ vales: null, credito: null });
    const hasAutoFetched = useRef(false);

    // Sync tab from url init if present
    useEffect(() => {
        if (state.urlParams?.tab) {
            setActiveTab(state.urlParams.tab);
        }
    }, [state.urlParams?.tab]);

    // Keep global context aware of current parameters for Sidebar sharing
    useEffect(() => {
        dispatch({
            type: 'BULK_UPDATE',
            payload: {
                urlParams: { tab: activeTab, mesAnterior: selectedMesAnterior, mesAtual: selectedMesAtual }
            }
        });
    }, [activeTab, selectedMesAnterior, selectedMesAtual, dispatch]);

    useEffect(() => {
        fetch('/api/months')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.months) {
                    setAvailableMonths(data.months);
                    if (data.months.length >= 2) {
                        if (!state.urlParams?.mesAtual) setSelectedMesAtual(data.months[0]);
                        if (!state.urlParams?.mesAnterior) setSelectedMesAnterior(data.months[1]);
                    } else if (data.months.length === 1) {
                        if (!state.urlParams?.mesAtual) setSelectedMesAtual(data.months[0]);
                        if (!state.urlParams?.mesAnterior) setSelectedMesAnterior(data.months[0]);
                    }
                }
            })
            .catch(err => console.error("Erro ao carregar meses", err));
    }, [state.urlParams?.mesAtual, state.urlParams?.mesAnterior]);

    // Auto-fetch if opened via specific share link
    useEffect(() => {
        if (
            availableMonths.length > 0 &&
            state.urlParams?.mesAnterior &&
            state.urlParams?.mesAtual &&
            state.urlParams?.tab &&
            !hasAutoFetched.current
        ) {
            hasAutoFetched.current = true;
            processComparison(state.urlParams.tab, state.urlParams.mesAnterior, state.urlParams.mesAtual);
        }
    }, [availableMonths, state.urlParams]);

    const handleShareComparativo = async () => {
        try {
            const currentUrl = new URL(window.location.origin + window.location.pathname);
            currentUrl.searchParams.set('page', 'page-comparativo');
            currentUrl.searchParams.set('tab', activeTab);
            
            if (state.filterFuncao !== 'Todos') currentUrl.searchParams.set('funcao', state.filterFuncao);
            if (state.filterRisco !== 'Todos') currentUrl.searchParams.set('risco', state.filterRisco);
            
            if (selectedMesAnterior) currentUrl.searchParams.set('mesAnterior', selectedMesAnterior);
            if (selectedMesAtual) currentUrl.searchParams.set('mesAtual', selectedMesAtual);

            await navigator.clipboard.writeText(currentUrl.toString());
            showNotification('Link deste comparativo copiado! Ao abri-lo, esta mesma análise será carregada automaticamente.', 'success');
        } catch (err) {
            showNotification('Não foi possível copiar o link.', 'error');
        }
    };

    const processComparison = async (type, forceMesAnterior = null, forceMesAtual = null) => {
        const mAnterior = forceMesAnterior || selectedMesAnterior;
        const mAtual = forceMesAtual || selectedMesAtual;

        if (!mAnterior || !mAtual) {
            showNotification('Selecione os dois meses para comparar.', 'error');
            return;
        }

        setLoading(true);

        try {
            const [resAnterior, resAtual] = await Promise.all([
                fetch(`/api/data?month=${mAnterior}&type=${type}`),
                fetch(`/api/data?month=${mAtual}&type=${type}`)
            ]);

            if (!resAnterior.ok) throw new Error(`Dados de ${mAnterior} não encontrados para ${type === 'vales' ? 'Vales' : 'Crédito'}.`);
            if (!resAtual.ok) throw new Error(`Dados de ${mAtual} não encontrados para ${type === 'vales' ? 'Vales' : 'Crédito'}.`);

            const [textAnterior, textAtual] = await Promise.all([resAnterior.text(), resAtual.text()]);

            const parseCSV = (text) => new Promise((resolve, reject) => {
                Papa.parse(text, {
                    header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
                    complete: (res) => resolve(res.data),
                    error: (err) => reject(err)
                });
            });

            const dataAnterior = await parseCSV(textAnterior);
            const dataAtual = await parseCSV(textAtual);

            const processMonth = (monthData) => {
                if (monthData.length === 0) return { totalGeral: 0, employeeTotals: new Map() };
                const nameCol = state.config[type]?.nome;
                const valueCol = state.config[type]?.valor;
                if (!nameCol || !valueCol || !monthData[0].hasOwnProperty(nameCol) || !monthData[0].hasOwnProperty(valueCol)) {
                    throw new Error(`As colunas configuradas '${nameCol}' e '${valueCol}' não foram encontradas no CSV.`);
                }
                const employeeTotals = new Map();
                let totalGeral = 0;
                monthData.forEach(row => {
                    const nome = row[nameCol]?.trim() || 'N/A';
                    const valor = parseCurrencyToCents(row[valueCol]);
                    if (nome && valor > 0) {
                        totalGeral += valor;
                        employeeTotals.set(nome, (employeeTotals.get(nome) || 0) + valor);
                    }
                });
                return { totalGeral, employeeTotals };
            };

            const anterior = processMonth(dataAnterior);
            const atual = processMonth(dataAtual);

            const variacao = anterior.totalGeral > 0
                ? ((atual.totalGeral - anterior.totalGeral) / anterior.totalGeral) * 100
                : (atual.totalGeral > 0 ? 100 : 0);

            const combinedTotals = new Map();
            anterior.employeeTotals.forEach((total, nome) => combinedTotals.set(nome, { anterior: total, atual: 0, totalCombined: total }));
            atual.employeeTotals.forEach((total, nome) => {
                const existing = combinedTotals.get(nome) || { anterior: 0, atual: 0, totalCombined: 0 };
                combinedTotals.set(nome, { ...existing, atual: total, totalCombined: existing.totalCombined + total });
            });
            const top5Combined = Array.from(combinedTotals.entries()).sort(([, a], [, b]) => b.totalCombined - a.totalCombined).slice(0, 5);

            setResults(prev => ({
                ...prev,
                [type]: {
                    anterior: anterior.totalGeral,
                    atual: atual.totalGeral,
                    variacao,
                    top5Combined,
                    mesAnteriorLabel: mAnterior,
                    mesAtualLabel: mAtual
                },
            }));

            showNotification('Comparação concluída com sucesso.', 'success');
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderTabContent = (type) => {
        const result = results[type];
        const textColor = '#64748b'; // slate-500
        const gridColor = 'rgba(148, 163, 184, 0.15)'; // subtle slate line

        const totaisData = result ? {
            labels: [result.mesAnteriorLabel, result.mesAtualLabel],
            datasets: [{
                label: 'Total',
                data: [result.anterior / 100, result.atual / 100],
                backgroundColor: ['rgba(96, 165, 250, 0.8)', state.uiConfig.primaryColor],
                borderRadius: 8,
                borderWidth: 0,
            }],
        } : null;

        const top5Data = result ? {
            labels: result.top5Combined.map(([nome]) => nome.split(' ')[0] + ' ' + (nome.split(' ')[1] || '')), // simplify names
            datasets: [
                { label: result.mesAnteriorLabel, data: result.top5Combined.map(([, d]) => d.anterior / 100), backgroundColor: 'rgba(96, 165, 250, 0.8)', borderRadius: 6 },
                { label: result.mesAtualLabel, data: result.top5Combined.map(([, d]) => d.atual / 100), backgroundColor: state.uiConfig.primaryColor, borderRadius: 6 },
            ],
        } : null;

        const chartOptions = {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: textColor }, grid: { display: false, drawBorder: false }, border: { display: false } },
                y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor, drawBorder: false, drawTicks: false }, border: { display: false } }
            },
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += formatCurrencyBRL(context.parsed.y * 100);
                            else if(context.parsed.x !== null) label += formatCurrencyBRL(context.parsed.x * 100);
                            return label;
                        }
                    }
                },
                datalabels: {
                    color: textColor, font: { weight: 'bold' }, anchor: 'end', align: 'end', offset: 4,
                    formatter: value => value > 0 ? formatCurrencyBRL(value * 100) : ''
                }
            }
        };

        const top5Options = {
            ...chartOptions,
            indexAxis: 'y',
            plugins: { ...chartOptions.plugins, legend: { position: 'top', labels: { color: textColor } } }
        };

        return (
            <div className="animate-in space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end border bg-muted/30 p-6 rounded-xl shadow-sm">
                    <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">1</div>
                            <h3 className="text-lg font-semibold text-foreground">Mês Anterior</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Selecione o primeiro mês de referência.</p>
                        <div className="relative">
                            <select 
                                className="w-full h-11 border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                                value={selectedMesAnterior}
                                onChange={(e) => setSelectedMesAnterior(e.target.value)}
                                disabled={availableMonths.length === 0}
                            >
                                <option value="" disabled>Selecionar mês...</option>
                                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">2</div>
                            <h3 className="text-lg font-semibold text-foreground">Mês Atual</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Selecione o segundo mês de referência.</p>
                        <div className="relative">
                            <select 
                                className="w-full h-11 border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                                value={selectedMesAtual}
                                onChange={(e) => setSelectedMesAtual(e.target.value)}
                                disabled={availableMonths.length === 0}
                            >
                                <option value="" disabled>Selecionar mês...</option>
                                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => processComparison(type)}
                            disabled={loading || availableMonths.length === 0 || !selectedMesAnterior || !selectedMesAtual}
                            className="w-full inline-flex items-center justify-center h-12 px-6 border border-transparent shadow-md text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                            {loading ? 'Analisando...' : 'Analisar e Comparar'}
                        </button>
                        <button
                            onClick={handleShareComparativo}
                            className="w-full inline-flex items-center justify-center h-12 px-6 border-2 border-input bg-background text-foreground hover:bg-muted hover:text-primary hover:border-primary/30 shadow-sm text-sm font-bold rounded-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all"
                        >
                            <Share2 className="mr-2 h-5 w-5 text-muted-foreground" />
                            Copiar Link desta Análise
                        </button>
                    </div>
                </div>

                {availableMonths.length === 0 && (
                    <div className="text-center p-8 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl border border-amber-500/20">
                        <Calendar className="w-8 h-8 mx-auto mb-3 opacity-80" />
                        <h3 className="font-semibold text-lg mb-1">Nenhum dado encontrado</h3>
                        <p className="text-sm opacity-90">Você precisa importar os dados na tela "Bases de Dados" antes de usar a comparação mensal.</p>
                    </div>
                )}

                {result && !loading && (
                    <div className="mt-8 animate-in space-y-6 slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total ({result.mesAnteriorLabel})</p>
                                <p className="text-3xl font-bold text-foreground">{formatCurrencyBRL(result.anterior)}</p>
                            </div>
                            <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total ({result.mesAtualLabel})</p>
                                <p className="text-3xl font-bold text-foreground">{formatCurrencyBRL(result.atual)}</p>
                            </div>
                            <div className={`rounded-xl border bg-card text-card-foreground p-6 shadow-sm border-l-4 ${result.variacao > 0 ? 'border-l-destructive' : result.variacao < 0 ? 'border-l-emerald-500' : 'border-l-muted-foreground'}`}>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Variação</p>
                                <div className="flex items-center gap-3 mt-2">
                                    {result.variacao > 0 ? (
                                        <div className="bg-destructive/10 text-destructive p-2 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
                                    ) : result.variacao < 0 ? (
                                        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl"><TrendingDown className="h-6 w-6" /></div>
                                    ) : (
                                        <div className="bg-muted text-muted-foreground p-2 rounded-xl"><Minus className="h-6 w-6" /></div>
                                    )}
                                    <p className={`text-3xl font-bold ${result.variacao > 0 ? 'text-destructive' : result.variacao < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                        {result.variacao > 0 ? '+' : ''}{result.variacao.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {totaisData && (
                                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                                    <h3 className="font-semibold text-lg text-foreground mb-6">Comparativo Global de Valores</h3>
                                    <div className="flex-1 w-full min-h-[300px]">
                                        <DashboardChart type="bar" data={totaisData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                                    </div>
                                </div>
                            )}
                            {top5Data && (
                                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                                    <h3 className="font-semibold text-lg text-foreground mb-6">Top 5: Maior Impacto Combinado</h3>
                                    <div className="flex-1 w-full min-h-[300px]">
                                        <DashboardChart type="bar" data={top5Data} options={top5Options} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <section id="page-comparativo" className="animate-in space-y-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center border-b bg-muted/50">
                    <button
                        className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'vales' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        onClick={() => setActiveTab('vales')}
                    >
                        Analisar Vales
                    </button>
                    <button
                        className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'credito' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        onClick={() => setActiveTab('credito')}
                    >
                        Analisar Crédito em Conta
                    </button>
                </div>
                <div className="p-6 md:p-8">
                    {activeTab === 'vales' && renderTabContent('vales')}
                    {activeTab === 'credito' && renderTabContent('credito')}
                </div>
            </div>
        </section>
    );
}
