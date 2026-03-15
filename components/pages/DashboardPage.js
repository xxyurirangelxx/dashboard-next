'use client';

import { useMemo } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { formatCurrencyBRL, hexToRgba } from '@/lib/utils';
import DashboardChart from '@/components/DashboardChart';
import { TrendingUp, TrendingDown, AlertCircle, Users } from 'lucide-react';

export default function DashboardPage() {
    const { state } = useDashboard();
    const data = state.currentlyDisplayedData;
    const { chartColors, uiConfig, masterData } = state;

    const totalVales = data.reduce((sum, item) => sum + item.totalVales, 0);
    const totalCredito = data.reduce((sum, item) => sum + item.totalCredito, 0);
    const totalCombinadoPermitido = data.reduce((sum, item) => {
        const combined = item.totalVales + item.totalCredito;
        if (item.salario > 0) {
            return sum + Math.min(combined, item.salario * 0.30);
        }
        return sum + combined;
    }, 0);
    const riskEmployees = data.filter(e => e.percentual >= 30).length;

    // Evolution Charts Data
    const { monthlyValesData, monthlyCreditoData } = useMemo(() => {
        const monthlyVales = {};
        const monthlyCredito = {};
        data.forEach(e => {
            e.valesDetails.forEach(v => {
                const parts = v.data.split('/');
                if (parts.length === 3) {
                    const monthKey = `${parts[2]}-${parts[1]}`;
                    monthlyVales[monthKey] = (monthlyVales[monthKey] || 0) + v.valor;
                }
            });
            e.creditoDetails.forEach(c => {
                const parts = c.data.split('/');
                if (parts.length === 3) {
                    const monthKey = `${parts[2]}-${parts[1]}`;
                    monthlyCredito[monthKey] = (monthlyCredito[monthKey] || 0) + c.valor;
                }
            });
        });
        const sortedValesMonths = Object.keys(monthlyVales).sort().slice(-12);
        const sortedCreditoMonths = Object.keys(monthlyCredito).sort().slice(-12);
        return {
            monthlyValesData: {
                labels: sortedValesMonths,
                datasets: [{
                    label: 'Total de Vales',
                    data: sortedValesMonths.map(key => monthlyVales[key] / 100),
                    fill: true,
                    tension: 0.4,
                    backgroundColor: hexToRgba(uiConfig.primaryColor, 0.15),
                    borderColor: uiConfig.primaryColor,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: uiConfig.primaryColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: uiConfig.primaryColor,
                    pointHoverBorderColor: '#ffffff',
                }],
            },
            monthlyCreditoData: {
                labels: sortedCreditoMonths,
                datasets: [{
                    label: 'Total de Crédito',
                    data: sortedCreditoMonths.map(key => monthlyCredito[key] / 100),
                    fill: true,
                    tension: 0.4,
                    backgroundColor: hexToRgba(chartColors[0], 0.15),
                    borderColor: chartColors[0],
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: chartColors[0],
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: chartColors[0],
                    pointHoverBorderColor: '#ffffff',
                }],
            },
        };
    }, [data, uiConfig.primaryColor, chartColors]);

    // Comparativo de Cargos
    const comparativoCargosData = useMemo(() => {
        const cargos = {
            "Ajudante Distribuição": { totalVales: 0 },
            "Motorista Caminhão Distribuição": { totalVales: 0 },
        };
        data.forEach(e => {
            if (cargos.hasOwnProperty(e.funcao)) {
                cargos[e.funcao].totalVales += e.totalVales;
            }
        });
        const labels = Object.keys(cargos);
        return {
            labels,
            datasets: [{
                label: 'Total Vales',
                data: labels.map(cargo => cargos[cargo].totalVales / 100),
                backgroundColor: chartColors[1],
                borderRadius: 6,
            }],
        };
    }, [data, chartColors]);

    // Data with funcao filter
    const dataWithFuncao = useMemo(() => data.filter(e => e.funcao && e.funcao !== 'N/A'), [data]);

    // Crédito por Função
    const creditoPorFuncaoData = useMemo(() => {
        const creditoPorFuncao = {};
        dataWithFuncao.forEach(e => {
            creditoPorFuncao[e.funcao] = (creditoPorFuncao[e.funcao] || 0) + e.totalCredito;
        });
        const top = Object.entries(creditoPorFuncao).sort(([, a], [, b]) => b - a).slice(0, 10);
        return {
            labels: top.map(([funcao]) => funcao),
            datasets: [{
                label: 'Total de Crédito',
                data: top.map(([, total]) => total / 100),
                backgroundColor: chartColors[2],
                borderRadius: 6,
            }],
        };
    }, [dataWithFuncao, chartColors]);

    // Top 5 Vales
    const top5ValesData = useMemo(() => {
        const top5 = [...dataWithFuncao].sort((a, b) => b.totalVales - a.totalVales).slice(0, 5);
        return {
            labels: top5.map(e => e.nome),
            datasets: [{
                label: 'Total Vales',
                data: top5.map(e => e.totalVales / 100),
                backgroundColor: chartColors[3],
                borderRadius: 6,
            }],
        };
    }, [dataWithFuncao, chartColors]);

    // Top 5 Crédito
    const top5CreditoData = useMemo(() => {
        const top5 = [...dataWithFuncao].sort((a, b) => b.totalCredito - a.totalCredito).slice(0, 5);
        return {
            labels: top5.map(e => e.nome),
            datasets: [{
                label: 'Total Crédito',
                data: top5.map(e => e.totalCredito / 100),
                backgroundColor: chartColors[4],
                borderRadius: 6,
            }],
        };
    }, [dataWithFuncao, chartColors]);

    // Top 5 Motivos Vales
    const top5MotivosValesData = useMemo(() => {
        const motivos = {};
        data.forEach(e => e.valesDetails.forEach(v => {
            if (v._ignoreChart) return;
            const motivo = v.justificativa || 'Não especificado';
            motivos[motivo] = (motivos[motivo] || 0) + v.valor;
        }));
        const top5 = Object.entries(motivos).sort(([, a], [, b]) => b - a).slice(0, 5);
        return {
            labels: top5.map(([motivo]) => motivo),
            datasets: [{
                label: 'Total por Motivo',
                data: top5.map(([, total]) => total / 100),
                backgroundColor: chartColors,
                borderWidth: 0,
                hoverOffset: 8,
            }],
        };
    }, [data, chartColors]);

    // Top 5 Motivos Crédito
    const top5MotivosCreditoData = useMemo(() => {
        const motivos = {};
        data.forEach(e => e.creditoDetails.forEach(c => {
            if (c._ignoreChart) return;
            const motivo = c.obs || 'Não especificado';
            motivos[motivo] = (motivos[motivo] || 0) + c.valor;
        }));
        const top5 = Object.entries(motivos).sort(([, a], [, b]) => b - a).slice(0, 5);
        return {
            labels: top5.map(([motivo]) => motivo),
            datasets: [{
                label: 'Total por Motivo',
                data: top5.map(([, total]) => total / 100),
                backgroundColor: [...chartColors].reverse(),
                borderWidth: 0,
                hoverOffset: 8,
            }],
        };
    }, [data, chartColors]);

    // Charts styling constants
    const textColor = '#64748b'; // slate-500
    const gridColor = 'rgba(148, 163, 184, 0.15)'; // subtle slate line

    const barChartOptions = (isVertical = true) => ({
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isVertical ? 'x' : 'y',
        layout: { padding: { top: 20, right: isVertical ? 0 : 85 } },
        scales: {
            x: {
                stacked: false,
                ticks: { color: textColor },
                grid: { display: false, drawBorder: false },
                border: { display: false }
            },
            y: {
                stacked: false,
                ticks: { color: textColor },
                grid: { color: gridColor, drawBorder: false, drawTicks: false },
                border: { display: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        const val = isVertical ? context.parsed.y : context.parsed.x;
                        if (val !== null) {
                            label += formatCurrencyBRL(val * 100);
                        }
                        return label;
                    }
                }
            },
            datalabels: {
                display: ctx => ctx.dataset.data[ctx.dataIndex] > 0,
                anchor: 'end', align: 'end', offset: 6, color: textColor,
                font: { weight: 'bold', size: 11 },
                formatter: (value) => formatCurrencyBRL(value * 100),
            },
        },
    });

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: textColor, padding: 20, font: { weight: '500' } } },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += formatCurrencyBRL(context.parsed * 100);
                        }
                        return label;
                    }
                }
            },
            datalabels: {
                display: true,
                formatter: (value, ctx) => {
                    if (value <= 0) return null;
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    return total > 0 ? `${(value / total * 100).toFixed(1)}%` : null;
                },
                color: '#fff',
                font: { weight: 'bold', size: 14 },
                textStrokeColor: 'rgba(0,0,0,0.5)',
                textStrokeWidth: 3,
                textShadowBlur: 10,
                textShadowColor: 'rgba(0,0,0,0.5)',
            },
        },
    };

    const comparativoCargosOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 25 } },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrencyBRL(context.parsed.y * 100);
                        }
                        return label;
                    }
                }
            },
            datalabels: {
                display: ctx => ctx.dataset.data[ctx.dataIndex] > 0,
                anchor: 'end', align: 'end', offset: 6, color: textColor,
                font: { weight: 'bold', size: 11 },
                formatter: (value) => formatCurrencyBRL(value * 100),
            },
        },
        scales: {
            x: {
                stacked: false,
                ticks: { color: textColor },
                grid: { display: false, drawBorder: false },
                border: { display: false }
            },
            y: {
                stacked: false,
                beginAtZero: true,
                ticks: { color: textColor },
                grid: { color: gridColor, drawBorder: false, drawTicks: false },
                border: { display: false }
            }
        },
    };

    const lineChartOptions = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: {
                ticks: { color: textColor },
                grid: { display: false, drawBorder: false },
                border: { display: false }
            },
            y: {
                ticks: { color: textColor },
                grid: { color: gridColor, drawBorder: false, drawTicks: false },
                border: { display: false }
            }
        },
        plugins: {
            legend: { labels: { color: textColor } },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrencyBRL(context.parsed.y * 100);
                        }
                        return label;
                    }
                }
            }
        }
    };


    return (
        <section id="page-dashboard" className="animate-in space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 group hover:border-emerald-500/50 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">{uiConfig.kpiTitleVales}</h3>
                        <div className="bg-emerald-500/10 p-2 rounded-md group-hover:bg-emerald-500/20 transition-colors">
                            <TrendingDown className="h-4 w-4 text-emerald-500" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{formatCurrencyBRL(totalVales)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Acumulado do período</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 group hover:border-blue-500/50 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">{uiConfig.kpiTitleCredito}</h3>
                        <div className="bg-blue-500/10 p-2 rounded-md group-hover:bg-blue-500/20 transition-colors">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{formatCurrencyBRL(totalCredito)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Acumulado do período</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 group hover:border-amber-500/50 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">Desconto Permitido</h3>
                        <div className="bg-amber-500/10 p-2 rounded-md group-hover:bg-amber-500/20 transition-colors text-amber-500 font-bold">
                            &le; 30%
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{formatCurrencyBRL(totalCombinadoPermitido)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Vales + C.C (Teto 30%)</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 group hover:border-purple-500/50 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">{uiConfig.kpiTitleAtivos}</h3>
                        <div className="bg-purple-500/10 p-2 rounded-md group-hover:bg-purple-500/20 transition-colors">
                            <Users className="h-4 w-4 text-purple-500" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{data.length} <span className="text-lg font-normal text-muted-foreground">/ {masterData.length}</span></div>
                        <p className="text-xs text-muted-foreground mt-1">Funcionários analisados</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-destructive/10 text-card-foreground shadow-sm p-6 group hover:border-destructive transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-destructive uppercase">Grau de Risco (&gt;30%)</h3>
                        <div className="bg-destructive/20 p-2 rounded-md group-hover:bg-destructive/30 transition-colors">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-destructive">{riskEmployees}</div>
                        <p className="text-xs text-destructive/80 mt-1">Colaboradores em alerta</p>
                    </div>
                </div>
            </div>

            {/* Evolution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-emerald-500" />
                            Evolução Mensal de Vales
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="line" data={monthlyValesData} options={lineChartOptions} />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Evolução Mensal de Crédito em Conta
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="line" data={monthlyCreditoData} options={lineChartOptions} />
                    </div>
                </div>
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight text-foreground">Comparativo: Ajudante vs. Motorista</h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="bar" data={comparativoCargosData} options={comparativoCargosOptions} />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight text-foreground">Crédito por Função (Top 10)</h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="bar" data={creditoPorFuncaoData} options={barChartOptions(false)} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight text-foreground">Top 5: Maior Volume de Vales</h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="bar" data={top5ValesData} options={barChartOptions(false)} />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight text-foreground">Top 5: Maior Crédito em Conta</h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="bar" data={top5CreditoData} options={barChartOptions(false)} />
                    </div>
                </div>
            </div>

            {/* Motivos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight text-foreground">Distribuição: Motivos de Vales</h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="doughnut" data={top5MotivosValesData} options={doughnutOptions} />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight text-foreground">Distribuição: Motivos de Crédito</h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <DashboardChart type="doughnut" data={top5MotivosCreditoData} options={doughnutOptions} />
                    </div>
                </div>
            </div>
        </section>
    );
}
