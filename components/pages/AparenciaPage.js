'use client';

import { useState } from 'react';
import { Save, Palette, Type, TypeIcon, PaintBucket, LayoutTemplate } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { Storage } from '@/lib/db';

export default function AparenciaPage() {
    const { state, dispatch, applyUIConfig, showNotification } = useDashboard();
    // Initialize from current context value; component re-mounts on page switch anyway
    const [localUI, setLocalUI] = useState(() => ({ ...state.uiConfig }));

    const update = (key, value) => {
        setLocalUI(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        dispatch({ type: 'SET_UI_CONFIG', payload: localUI });
        Storage.save('dashboardUIConfigV1', localUI);
        applyUIConfig(localUI);
        showNotification('Personalização aplicada com sucesso!', 'success');
    };

    return (
        <section id="page-configuracoes-ui" className="animate-in space-y-6 max-w-5xl mx-auto">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Palette className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Personalização de Interface</h2>
                        <p className="text-sm text-muted-foreground mt-1">Ajuste cores, tipografia e os textos principais do seu dashboard.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Colors */}
                    <div className="p-6 rounded-xl border bg-muted/30 hover:border-primary/40 transition-colors group">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <PaintBucket className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Cores Globais</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-sm font-medium leading-none text-foreground mb-2 block">Cor Principal (Botões e Destaques)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        className="h-10 w-16 p-1 rounded-md cursor-pointer bg-background border border-input shadow-sm"
                                        value={localUI.primaryColor}
                                        onChange={(e) => update('primaryColor', e.target.value)}
                                    />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-mono uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={localUI.primaryColor}
                                            onChange={(e) => update('primaryColor', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground block">Paleta de Cores dos Gráficos</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={localUI.chartPalette}
                                    onChange={(e) => update('chartPalette', e.target.value)}
                                >
                                    <option value="moderno">Moderno (Azuis e Roxos)</option>
                                    <option value="vibrante">Vibrante (Cores Quentes)</option>
                                    <option value="pastel">Pastel (Suave)</option>
                                    <option value="floresta">Floresta (Tons de Verde)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fonts */}
                    <div className="p-6 rounded-xl border bg-muted/30 hover:border-primary/40 transition-colors group">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <TypeIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Tipografia</h3>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground block">Fonte Principal do Sistema</label>
                            <select
                                className="flex h-10 w-full md:w-1/2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={localUI.fontFamily}
                                onChange={(e) => update('fontFamily', e.target.value)}
                            >
                                <option value="Inter">Inter (Padrão, Limpa)</option>
                                <option value="Roboto">Roboto (Clássica)</option>
                                <option value="Lato">Lato (Elegante)</option>
                                <option value="Outfit">Outfit (Moderna, Geométrica)</option>
                                <option value="Montserrat">Montserrat (Impactante)</option>
                            </select>
                        </div>
                    </div>

                    {/* Texts */}
                    <div className="p-6 rounded-xl border bg-muted/30 hover:border-primary/40 transition-colors group">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <LayoutTemplate className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Textos do Painel Interativo</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground block">Título do Menu Lateral e Navegador</label>
                                <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={localUI.mainTitle} onChange={(e) => update('mainTitle', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground block">Título: KPI Vales</label>
                                <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={localUI.kpiTitleVales} onChange={(e) => update('kpiTitleVales', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground block">Título: KPI Crédito em Conta</label>
                                <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={localUI.kpiTitleCredito} onChange={(e) => update('kpiTitleCredito', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground block">Título: KPI Funcionários Base</label>
                                <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={localUI.kpiTitleAtivos} onChange={(e) => update('kpiTitleAtivos', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-end items-center mt-10 p-6 bg-muted/30 rounded-xl border gap-6">
                    <button onClick={handleSave} className="w-full md:w-auto inline-flex items-center justify-center h-11 px-8 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all group">
                        <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Salvar e Aplicar Tema
                    </button>
                </div>
            </div>
        </section>
    );
}
