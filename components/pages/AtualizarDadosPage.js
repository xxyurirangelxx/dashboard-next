'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { useDashboard } from '@/context/DashboardContext';
import * as DB from '@/lib/db';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Banknote, CreditCard } from 'lucide-react';

export default function AtualizarDadosPage() {
    const { state, dispatch, showNotification } = useDashboard();
    const [referencia, setReferencia] = useState(() => {
        const d = new Date();
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        return `${ano}-${mes}`;
    });

    const handleFileUpload = async (e, datasetKey) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', datasetKey);
        formData.append('month', referencia);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Falha no servidor');
            
            showNotification(`Arquivo salvo na pasta ${referencia}/ no servidor.`, 'success');
        } catch(err) {
            showNotification(`Aviso: falha ao salvar arquivo no servidor (${err.message}).`, 'error');
        }

        Papa.parse(file, {
            header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
            complete: async (results) => {
                try {
                    const newDatasets = { ...state.datasets, [datasetKey]: results.data };
                    const newHeaders = { ...state.headers, [datasetKey]: results.meta.fields || [] };

                    dispatch({ type: 'SET_DATASETS', payload: { [datasetKey]: results.data } });
                    dispatch({ type: 'SET_HEADERS', payload: { [datasetKey]: results.meta.fields || [] } });
                    dispatch({
                        type: 'SET_FILE_STATUS',
                        key: datasetKey,
                        payload: { success: true, message: `Arquivo "${file.name}" salvo com sucesso.` },
                    });

                    await DB.saveFile(datasetKey, { data: results.data, headers: results.meta.fields || [] });
                    showNotification(`Arquivo carregado com ${results.data.length} registros.`, 'success');
                } catch (err) {
                    console.error(err);
                    showNotification(`Erro ao processar o arquivo: ${err.message}`, 'error');
                }
            },
            error: (err) => showNotification(`Erro ao ler o arquivo ${file.name}: ${err.message}`, 'error'),
        });
        e.target.value = '';
    };

    const fileConfigs = [
        { key: 'funcionarios', title: 'Funcionários (QLP)', desc: 'Matrícula, Nome, Função, Situação e Salário.', icon: UsersIcon, colorClasses: { bg: 'bg-primary/10', text: 'text-primary' } },
        { key: 'vales', title: 'Vales Mensais', desc: 'Matrícula, Valor, Data, Justificativa, etc.', icon: Banknote, colorClasses: { bg: 'bg-blue-500/10', text: 'text-blue-500' } },
        { key: 'credito', title: 'Crédito em Conta', desc: 'Matrícula, Valor, Data, Observações, etc.', icon: CreditCard, colorClasses: { bg: 'bg-purple-500/10', text: 'text-purple-500' } },
    ];

    function UsersIcon(props) {
        return <FileText {...props} />;
    }

    return (
        <section id="page-atualizar" className="animate-in space-y-6 max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="bg-background border rounded-xl p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <UploadCloud className="w-5 h-5 text-primary" />
                            Upload de Base de Dados
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Selecione os arquivos CSV extraídos do ERP. <b>Ao salvar, os dados são armazenados no Servidor Corporativo</b> e atualizados instantaneamente para toda a equipe. 
                            Uma cópia também é guardada no mês selecionado para consultas futuras.
                        </p>
                    </div>
                </div>
                <div className="bg-card border p-4 rounded-xl shadow-sm min-w-[250px]">
                    <label className="block text-sm font-semibold text-foreground mb-1">Mês de Referência</label>
                    <p className="text-xs text-muted-foreground mb-3">Selecione para organizar na pasta mensal:</p>
                    <input 
                        type="month" 
                        className="w-full border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fileConfigs.map(({ key, title, desc, icon: Icon, colorClasses }, idx) => {
                    const isSuccess = state.fileStatuses[key]?.success;
                    return (
                        <div key={key} className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-6 hover:border-primary/50 transition-colors">
                            <div className="flex items-start gap-4 mb-6">
                                <div className={`p-3 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg leading-tight text-foreground">{title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="relative mb-4 group cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleFileUpload(e, key)}
                                    />
                                    <div className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-all ${isSuccess ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/30 border-muted group-hover:border-primary/40 group-hover:bg-muted/50'}`}>
                                        <UploadCloud className={`w-8 h-8 ${isSuccess ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-primary'}`} />
                                        <span className={`text-sm font-medium ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                            {isSuccess ? 'Atualizar Arquivo' : 'Selecionar CSV'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm font-medium transition-all ${isSuccess ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500'}`}>
                                    {isSuccess ? (
                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    )}
                                    <span className="leading-tight">
                                        {state.fileStatuses[key]?.message || 'Nenhum dado carregado.'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
