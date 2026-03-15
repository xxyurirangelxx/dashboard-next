'use client';

import { DatabaseZap, Settings2, BarChartBig, FileDiff, Palette, HelpCircle, ArrowRight } from 'lucide-react';

export default function AjudaPage() {
    const steps = [
        {
            icon: <DatabaseZap className="h-6 w-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />,
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
            borderColor: 'border-indigo-200 dark:border-indigo-900/50',
            hoverColor: 'hover:border-indigo-300 dark:hover:border-indigo-800/80',
            title: '0. Carregamento de Dados',
            text: (
                <>Na primeira vez, vá para <span className="font-bold text-indigo-700 dark:text-indigo-400">ATUALIZAR DADOS</span> para carregar seus arquivos. Nas próximas vezes, os dados serão carregados automaticamente e instantaneamente do cache seguro do seu navegador!</>
            ),
        },
        {
            icon: <Settings2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />,
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
            borderColor: 'border-emerald-200 dark:border-emerald-900/50',
            hoverColor: 'hover:border-emerald-300 dark:hover:border-emerald-800/80',
            title: '1. Configure o Mapeamento e Filtros',
            text: (
                <>Acesse <span className="font-bold text-emerald-700 dark:text-emerald-400">CONFIGURAÇÕES</span>. O sistema cruza as informações usando a <strong>Matrícula</strong> como chave principal. Certifique-se de que as colunas estãomapeadas corretamente. Se precisar limpar sujeiras ou falsos positivos, adicione filtros inteligentes. Ao finalizar, clique em &quot;Salvar e Processar Tudo&quot;.</>
            ),
        },
        {
            icon: <BarChartBig className="h-6 w-6 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />,
            bgColor: 'bg-violet-100 dark:bg-violet-900/30',
            borderColor: 'border-violet-200 dark:border-violet-900/50',
            hoverColor: 'hover:border-violet-300 dark:hover:border-violet-800/80',
            title: '2. Analise os Resultados',
            text: (
                <>Explore o incrível <span className="font-bold text-violet-700 dark:text-violet-400">DASHBOARD</span> interativo para uma visão gerencial ampla. Vá para a <span className="font-bold text-violet-700 dark:text-violet-400">ANÁLISE SALARIAL</span> para visualizar a fundo a tabela completa funcionário por funcionário e descobrir ofensores.</>
            ),
        },
        {
            icon: <FileDiff className="h-6 w-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />,
            bgColor: 'bg-amber-100 dark:bg-amber-900/30',
            borderColor: 'border-amber-200 dark:border-amber-900/50',
            hoverColor: 'hover:border-amber-300 dark:hover:border-amber-800/80',
            title: '3. Compare Retrospectos',
            text: (
                <>Vá para a aba <span className="font-bold text-amber-700 dark:text-amber-400">COMPARATIVO MENSAL</span>. Lá, você pode escolher o indicador (Vales ou Crédito), carregar rapidamente extratos de dois meses distintos e gerar uma análise super rápida mostrando a evolução e variação (crescimento ou redução) no período.</>
            ),
        },
        {
            icon: <Palette className="h-6 w-6 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />,
            bgColor: 'bg-pink-100 dark:bg-pink-900/30',
            borderColor: 'border-pink-200 dark:border-pink-900/50',
            hoverColor: 'hover:border-pink-300 dark:hover:border-pink-800/80',
            title: '4. Deixe com a sua cara (Opcional)',
            text: (
                <>Sente que precisa de mais de imersão? Na aba <span className="font-bold text-pink-700 dark:text-pink-400">PERSONALIZAÇÃO</span> você consegue mudar as cores do sistema, fontes e reescrever os textos para algo que combine perfeitamente com o seu estilo.</>
            ),
        },
    ];

    return (
        <section id="page-ajuda" className="animate-in space-y-6 max-w-4xl mx-auto">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8">
                <div className="flex items-center gap-4 mb-10 border-b pb-6">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Guia Rápido de Utilização</h2>
                        <p className="text-sm text-muted-foreground mt-1">Siga o passo a passo e extraia o máximo que este Dashboard tem de oferecer.</p>
                    </div>
                </div>

                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {steps.map((step, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transform transition-all hover:scale-[1.01]">

                            {/* Icon / Node */}
                            <div className={`flex items-center justify-center w-14 h-14 rounded-full border-4 border-background shadow-md bg-muted shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors`}>
                                {step.icon}
                            </div>

                            {/* Content */}
                            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-xl bg-card border shadow-sm transition-all text-foreground hover:border-primary/50`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-semibold text-lg leading-tight">
                                        {step.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                            </div>

                        </div>
                    ))}
                </div>

                <div className="mt-12 bg-muted/30 border rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-foreground mb-1">Tudo Pronto?</h4>
                        <p className="text-sm text-muted-foreground">Se você já carregou os dados, veja seu dashboard operando normalmente.</p>
                    </div>
                    <a href="#page-dashboard" onClick={() => document.querySelector('[data-page="page-dashboard"]')?.click()} className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors group shrink-0">
                        Acessar Dashboard
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </section>
    );
}
