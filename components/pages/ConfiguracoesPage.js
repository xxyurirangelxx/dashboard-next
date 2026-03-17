'use client';

import { useState, useMemo } from 'react';
import { Save, Trash2, PlusCircle, Settings, Filter, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { Storage } from '@/lib/db';
import * as DB from '@/lib/db';
import { processAllData } from '@/lib/dataProcessing';

export default function ConfiguracoesPage() {
    const { state, dispatch, showNotification, navigateToPage } = useDashboard();
    const { headers, config, filters, datasets } = state;

    // Initialize from current context value; component re-mounts on page switch
    const [localConfig, setLocalConfig] = useState(() => ({ ...config }));
    const [localFilters, setLocalFilters] = useState(() => [...filters]);
    const [filterSource, setFilterSource] = useState('vales');
    const [filterColumn, setFilterColumn] = useState('');
    const [filterKeyword, setFilterKeyword] = useState('');
    const [filterAction, setFilterAction] = useState('ignore_value');

    // Derive available columns from the currently selected source
    const filterColumns = useMemo(() => headers[filterSource] || [], [headers, filterSource]);

    // Derive the effective column: use filterColumn if it exists in available columns, otherwise first
    const effectiveFilterColumn = useMemo(() => {
        if (filterColumns.length > 0 && !filterColumns.includes(filterColumn)) {
            return filterColumns[0];
        }
        return filterColumn;
    }, [filterColumns, filterColumn]);

    const updateLocalConfig = (section, key, value) => {
        setLocalConfig(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: value },
        }));
    };

    const handleSaveConfig = () => {
        // Validate columns
        const checks = [
            { file: 'funcionarios', key: 'matricula', value: localConfig.funcionarios.matricula },
            { file: 'funcionarios', key: 'salario', value: localConfig.funcionarios.salario },
            { file: 'vales', key: 'matricula', value: localConfig.vales.matricula },
            { file: 'credito', key: 'matricula', value: localConfig.credito.matricula },
        ];

        for (const check of checks) {
            if (datasets[check.file].length > 0 && !headers[check.file].includes(check.value)) {
                showNotification(`A coluna '${check.value}' não foi encontrada no arquivo de ${check.file}.`, 'error');
                return;
            }
        }

        dispatch({ type: 'SET_CONFIG', payload: localConfig });
        dispatch({ type: 'SET_FILTERS', payload: localFilters });
        Storage.save('dashboardConfigV2', localConfig);
        Storage.save('dashboardFiltersV1', localFilters);
        
        // SYNC TO CLOUD: Save as Master AND as Month-Specific version
        const syncTasks = [
            fetch('/api/config', { method: 'POST', body: JSON.stringify({ key: 'dashboardConfigV2', data: localConfig }) }),
            fetch('/api/config', { method: 'POST', body: JSON.stringify({ key: 'dashboardFiltersV1', data: localFilters }) })
        ];

        if (state.selectedMes !== 'atual') {
            syncTasks.push(fetch('/api/config', { method: 'POST', body: JSON.stringify({ key: `${state.selectedMes}/dashboardConfigV2`, data: localConfig }) }));
            syncTasks.push(fetch('/api/config', { method: 'POST', body: JSON.stringify({ key: `${state.selectedMes}/dashboardFiltersV1`, data: localFilters }) }));
        }

        Promise.all(syncTasks).catch(e => console.error("Cloud sync error Config/Filters", e));

        showNotification(state.selectedMes === 'atual' ? 'Regras Globais sincronizadas na Nuvem!' : `Regras específicas para ${state.selectedMes} salvas!`, 'success');

        setTimeout(() => {
            const result = processAllData(datasets, localConfig, localFilters);
            if (result.success) {
                dispatch({ type: 'SET_MASTER_DATA', payload: result.data });
                if (result.data.length > 0) {
                    showNotification(`${result.data.length} funcionários processados!`, 'success');
                }
            } else {
                showNotification(result.error, 'error');
            }
            navigateToPage('page-dashboard');
        }, 500);
    };

    const addFilter = () => {
        if (!effectiveFilterColumn || !filterKeyword.trim()) {
            showNotification('Preencha coluna e palavra-chave.', 'error');
            return;
        }
        const newFilters = [...localFilters, { source: filterSource, column: effectiveFilterColumn, keyword: filterKeyword.trim(), action: filterAction }];
        setLocalFilters(newFilters);
        setFilterKeyword('');
        showNotification('Filtro adicionado!', 'success');
    };

    const deleteFilter = (index) => {
        const newFilters = localFilters.filter((_, i) => i !== index);
        setLocalFilters(newFilters);
        showNotification('Filtro removido.', 'success');
    };

    const clearStorage = async () => {
        if (confirm('Atenção: Você tem certeza que deseja APAGAR TODOS os dados salvos no navegador? Esta ação é irreversível e você precisará carregar tudo novamente.')) {
            try {
                await DB.clearAll();
                localStorage.removeItem('dashboardConfigV2');
                localStorage.removeItem('dashboardUIConfigV1');
                localStorage.removeItem('dashboardFiltersV1');
                window.location.reload();
            } catch (e) {
                showNotification('Erro ao apagar os dados.', 'error');
            }
        }
    };

    const renderSelect = (section, key, label) => (
        <div key={key} className="group/select space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">{label}</label>
            <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={localConfig[section]?.[key] || ''}
                onChange={(e) => updateLocalConfig(section, key, e.target.value)}
            >
                {(headers[section] || []).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
        </div>
    );

    const actionLabels = {
        ignore_value: 'Não contabilizar valor',
        delete_row: 'Excluir linha',
        ignore_chart: 'Ignorar nos gráficos',
    };

    return (
        <section id="page-configuracoes" className="animate-in space-y-6 max-w-6xl mx-auto">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Settings className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configuração de Correspondência (De-Para)</h2>
                        <p className="text-sm text-muted-foreground mt-1">Mapeie as colunas dos seus arquivos CSV para os campos entendidos pelo sistema.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Funcionários */}
                    <div className="p-6 rounded-xl border bg-muted/30 hover:border-primary/40 transition-colors group">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">1. Arquivo de Funcionários (QLP)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {renderSelect('funcionarios', 'matricula', 'Coluna da Matrícula')}
                            {renderSelect('funcionarios', 'nome', 'Coluna do Nome')}
                            {renderSelect('funcionarios', 'funcao', 'Coluna da Função')}
                            {renderSelect('funcionarios', 'situacao', 'Coluna da Situação')}
                            {renderSelect('funcionarios', 'salario', 'Coluna do Salário')}
                        </div>
                    </div>

                    {/* Vales */}
                    <div className="p-6 rounded-xl border bg-muted/30 hover:border-primary/40 transition-colors group">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">2. Arquivo de Vales</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {renderSelect('vales', 'matricula', 'Matrícula')}
                            {renderSelect('vales', 'nome', 'Nome')}
                            {renderSelect('vales', 'valor', 'Valor')}
                            {renderSelect('vales', 'data', 'Data')}
                            {renderSelect('vales', 'situacao', 'Situação')}
                            {renderSelect('vales', 'justificativa', 'Justificativa')}
                        </div>
                    </div>

                    {/* Crédito */}
                    <div className="p-6 rounded-xl border bg-muted/30 hover:border-primary/40 transition-colors group">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">3. Arquivo de Crédito em Conta</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {renderSelect('credito', 'matricula', 'Matrícula')}
                            {renderSelect('credito', 'situacao', 'Situação')}
                            {renderSelect('credito', 'nome', 'Nome (Colaborador)')}
                            {renderSelect('credito', 'valor', 'Valor')}
                            {renderSelect('credito', 'data', 'Data')}
                            {renderSelect('credito', 'obs', 'Observações')}
                        </div>
                    </div>

                    {/* Processing Filters */}
                    <div className="p-6 rounded-xl border bg-muted/30 hover:border-primary/40 transition-colors">
                        <div className="flex items-center justify-between mb-6 border-b pb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-semibold text-foreground">Filtros Avançados de Processamento</h3>
                            </div>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-6 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                            Crie regras personalizadas para ignorar valores específicos, excluir linhas inválidas ou remover falsos positivos dos gráficos baseados em palavras-chave encontradas nas colunas.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-5 border rounded-xl bg-background shadow-sm">
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">Arquivo</label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                                    <option value="vales">Vales</option>
                                    <option value="credito">Crédito em Conta</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">Coluna</label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={effectiveFilterColumn} onChange={(e) => setFilterColumn(e.target.value)}>
                                    {filterColumns.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">Palavra-chave</label>
                                <input
                                    type="text"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Ex: adiantamento"
                                    value={filterKeyword}
                                    onChange={(e) => setFilterKeyword(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">Ação</label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                                    <option value="ignore_value">Não contabilizar valor</option>
                                    <option value="delete_row">Excluir linha inteira</option>
                                    <option value="ignore_chart">Ignorar nos gráficos</option>
                                </select>
                            </div>
                            <div className="md:col-span-12 mt-4 flex justify-end">
                                <button onClick={addFilter} className="inline-flex items-center justify-center h-11 px-6 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all w-full md:w-auto shadow-sm">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Adicionar Regra
                                </button>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Regras Ativas</h4>
                            <div className="space-y-3">
                                {localFilters.length === 0 ? (
                                    <div className="text-center p-8 bg-muted/50 rounded-xl border border-dashed text-muted-foreground">
                                        <Filter className="w-8 h-8 opacity-50 mx-auto mb-2" />
                                        <p className="text-sm font-medium">Nenhum filtro personalizado ativo no momento.</p>
                                    </div>
                                ) : (
                                    localFilters.map((filter, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-background rounded-xl border shadow-sm gap-4 transition-all hover:border-amber-500/50">
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Arquivo</span>
                                                    <span className="font-semibold text-foreground">
                                                        {filter.source === 'vales' ? 'Vales' : 'Crédito'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Na coluna</span>
                                                    <span className="font-semibold text-primary">{filter.column}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Palavra-chave</span>
                                                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-amber-600 dark:text-amber-400 border">
                                                        "{filter.keyword}"
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ação</span>
                                                    <span className="font-medium text-muted-foreground">{actionLabels[filter.action] || filter.action}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteFilter(index)} className="p-2 text-destructive hover:text-destructive-foreground rounded-lg hover:bg-destructive transition-colors shrink-0 bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-between items-center mt-10 p-6 bg-muted/30 rounded-xl border gap-6">
                    <button onClick={clearStorage} className="w-full md:w-auto inline-flex items-center justify-center h-11 px-6 border-2 border-destructive/50 text-sm font-bold rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        Limpar Dados do Sistema
                    </button>
                    <button onClick={handleSaveConfig} className="w-full md:w-auto inline-flex items-center justify-center h-11 px-8 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all group">
                        <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Salvar e Processar Tudo
                    </button>
                </div>
            </div>
        </section>
    );
}
