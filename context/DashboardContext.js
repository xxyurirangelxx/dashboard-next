'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { defaultConfig, defaultUIConfig, CHART_PALETTES } from '@/lib/constants';
import { Storage } from '@/lib/db';
import * as DB from '@/lib/db';
import { processAllData } from '@/lib/dataProcessing';
import { darkenHex, hexToRgba, hexToHsl } from '@/lib/utils';

const DashboardContext = createContext(null);

const initialState = {
    activePage: 'page-dashboard',
    datasets: { funcionarios: [], vales: [], credito: [] },
    headers: { funcionarios: [], vales: [], credito: [] },
    masterData: [],
    currentlyDisplayedData: [],
    config: defaultConfig,
    uiConfig: defaultUIConfig,
    filters: [],
    chartColors: CHART_PALETTES.moderno,
    sidebarPinned: false,
    notifications: [], // array of {id, message, type}
    comparisonData: {
        vales: { mesAnterior: [], mesAtual: [] },
        credito: { mesAnterior: [], mesAtual: [] },
    },
    urlParams: { tab: null, mesAnterior: null, mesAtual: null }, // Store raw url params for ComparativoPage
    fileStatuses: {
        funcionarios: { success: false, message: 'Aguardando arquivo...' },
        vales: { success: false, message: 'Aguardando arquivo...' },
        credito: { success: false, message: 'Aguardando arquivo...' },
    },
    filterFuncao: 'Todos',
    filterRisco: 'Todos',
    selectedMes: 'atual', // global month selection ('atual' means fetch latest)
    availableMonths: [],
    modalEmployee: null,
    initialized: false,
    isSharedMode: false,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_ACTIVE_PAGE':
            return { ...state, activePage: action.payload };
        case 'SET_DATASETS':
            return { ...state, datasets: { ...state.datasets, ...action.payload } };
        case 'SET_HEADERS':
            return { ...state, headers: { ...state.headers, ...action.payload } };
        case 'SET_MASTER_DATA':
            return { ...state, masterData: action.payload };
        case 'SET_DISPLAYED_DATA':
            return { ...state, currentlyDisplayedData: action.payload };
        case 'SET_CONFIG':
            return { ...state, config: action.payload };
        case 'SET_UI_CONFIG':
            return { ...state, uiConfig: action.payload };
        case 'SET_FILTERS':
            return { ...state, filters: action.payload };
        case 'SET_CHART_COLORS':
            return { ...state, chartColors: action.payload };
        case 'SET_SIDEBAR_PINNED':
            return { ...state, sidebarPinned: action.payload };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [action.payload, ...state.notifications] };
        case 'REMOVE_NOTIFICATION':
            return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
        case 'SET_COMPARISON_DATA':
            return { ...state, comparisonData: { ...state.comparisonData, ...action.payload } };
        case 'SET_FILE_STATUS':
            return { ...state, fileStatuses: { ...state.fileStatuses, [action.key]: action.payload } };
        case 'SET_FILTER_FUNCAO':
            return { ...state, filterFuncao: action.payload };
        case 'SET_FILTER_RISCO':
            return { ...state, filterRisco: action.payload };
        case 'SET_SELECTED_MES':
            return { ...state, selectedMes: action.payload };
        case 'SET_MODAL_EMPLOYEE':
            return { ...state, modalEmployee: action.payload };
        case 'SET_INITIALIZED':
            return { ...state, initialized: true };
        case 'BULK_UPDATE':
            return { ...state, ...action.payload };
        default:
            return state;
    }
}

export function DashboardProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const notificationTimeoutRef = useRef(null);

    const showNotification = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        dispatch({ type: 'ADD_NOTIFICATION', payload: { id, message, type } });
        
        // Remove after 5 seconds
        setTimeout(() => {
            dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
        }, 5000);
    }, []);

    const navigateToPage = useCallback((page) => {
        dispatch({ type: 'SET_ACTIVE_PAGE', payload: page });
    }, []);

    const processAndUpdate = useCallback((datasets, config, filters) => {
        const result = processAllData(datasets, config, filters);
        if (!result.success) {
            showNotification(result.error, 'error');
            return false;
        }
        if (result.data.length === 0) {
            showNotification("Nenhum funcionário válido encontrado após processamento.", "error");
        } else {
            showNotification(`${result.data.length} funcionários processados!`, 'success');
        }
        dispatch({ type: 'SET_MASTER_DATA', payload: result.data });
        return true;
    }, [showNotification]);

    const applyUIConfig = useCallback((configToApply, isInitial = false) => {
        const root = document.documentElement;

        // HSL version for new Shadcn/Tailwind configuration support
        try {
            root.style.setProperty('--primary', hexToHsl(configToApply.primaryColor));
        } catch (e) {
            console.error('Falha ao converter cor primária para HSL:', e);
        }

        // Legacy support just in case
        root.style.setProperty('--primary-color', configToApply.primaryColor);
        root.style.setProperty('--primary-color-hover', darkenHex(configToApply.primaryColor, 10));
        root.style.setProperty('--primary-color-light-bg', hexToRgba(configToApply.primaryColor, 0.1));

        const chartColors = CHART_PALETTES[configToApply.chartPalette] || CHART_PALETTES.moderno;
        dispatch({ type: 'SET_CHART_COLORS', payload: chartColors });

        // Update font
        const fontLink = document.getElementById('google-font-link');
        if (fontLink) {
            const fontUrl = `https://fonts.googleapis.com/css2?family=${configToApply.fontFamily.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
            if (fontLink.href !== fontUrl) fontLink.href = fontUrl;
        }
        root.style.setProperty('--font-inter', `'${configToApply.fontFamily}', sans-serif`);
        document.body.style.fontFamily = `'${configToApply.fontFamily}', sans-serif`;

        if (!isInitial) {
             // Sync config to cloud
             fetch('/api/config', {
                 method: 'POST',
                 body: JSON.stringify({ key: 'dashboardUIConfigV1', data: configToApply })
             }).catch(e => console.error("Cloud sync error UI", e));
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        const initialLoad = async () => {
            // 1. CARREGAMENTO INICIAL RÁPIDO DO LOCALSTORAGE (Para Core UI inicial)
            let config = Storage.load('dashboardConfigV2') || { ...defaultConfig };
            let uiConfig = Storage.load('dashboardUIConfigV1') || { ...defaultUIConfig };
            let filters = Storage.load('dashboardFiltersV1') || [];
            const sidebarPinned = Storage.load('sidebarPinned') === true;

            // 2. DETERMINAR MÊS INICIAL E PARÂMETROS URL
            let initialPage = 'page-dashboard';
            let initialFuncao = 'Todos';
            let initialRisco = 'Todos';
            let initialMes = 'atual';
            let isSharedMode = false;
            let urlParamsForComparativo = { tab: null, mesAnterior: null, mesAtual: null };
            try {
                if (typeof window !== 'undefined') {
                    const searchParams = new URLSearchParams(window.location.search);
                    const hashString = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
                    const hashParams = new URLSearchParams(hashString);
                    const getParam = (key) => hashParams.get(key) || searchParams.get(key);
                    const hasParam = (key) => hashParams.has(key) || searchParams.has(key);
                    if (hasParam('page')) initialPage = getParam('page');
                    if (hasParam('funcao')) initialFuncao = getParam('funcao');
                    if (hasParam('risco')) initialRisco = getParam('risco');
                    if (hasParam('mes')) initialMes = getParam('mes');
                    if (hasParam('tab')) urlParamsForComparativo.tab = getParam('tab');
                    if (hasParam('mesAnterior')) urlParamsForComparativo.mesAnterior = getParam('mesAnterior');
                    if (hasParam('mesAtual')) urlParamsForComparativo.mesAtual = getParam('mesAtual');
                    if (hasParam('shared')) isSharedMode = getParam('shared') === 'true';
                }
            } catch(e) { console.error('Error parsing URL params:', e); }

            // 3. ATUALIZAÇÃO INICIAL DO ESTADO
            dispatch({
                type: 'BULK_UPDATE',
                payload: { 
                    config, uiConfig, filters, sidebarPinned,
                    activePage: initialPage, filterFuncao: initialFuncao,
                    filterRisco: initialRisco, selectedMes: initialMes,
                    urlParams: urlParamsForComparativo, isSharedMode
                },
            });
            applyUIConfig(uiConfig, true);

            // 4. SYNC DE CONFIGURAÇÕES VIA NUVEM (Sincronização seletiva)
            try {
                const syncRes = await fetch(`/api/sync-status?month=${initialMes}`);
                if (syncRes.ok) {
                    const syncData = await syncRes.json();
                    if (syncData.success && syncData.files) {
                        const files = syncData.files;
                        
                        const configsToSync = [
                            { key: 'dashboardConfigV2', local: 'dashboardConfigV2' },
                            { key: 'dashboardUIConfigV1', local: 'dashboardUIConfigV1' },
                            { key: 'dashboardFiltersV1', local: 'dashboardFiltersV1' }
                        ];

                        for (const item of configsToSync) {
                            // Tenta achar versão específica do mês ou global
                            const serverFile = files.find(f => f.id === `${initialMes}/${item.key}`) || files.find(f => f.id === item.key);
                            if (serverFile) {
                                const cacheKey = `config_${item.key}_${initialMes}`;
                                const cached = await DB.loadFile(cacheKey);
                                if (!cached || cached.url !== serverFile.url) {
                                    const res = await fetch(serverFile.url);
                                    if (res.ok) {
                                        const json = await res.json();
                                        if (item.key === 'dashboardConfigV2') config = json;
                                        if (item.key === 'dashboardUIConfigV1') uiConfig = json;
                                        if (item.key === 'dashboardFiltersV1') filters = json;
                                        
                                        await DB.saveFile(cacheKey, { data: json }, serverFile.url);
                                        Storage.save(item.local, json);
                                    }
                                } else {
                                    if (item.key === 'dashboardConfigV2') config = cached.data;
                                    if (item.key === 'dashboardUIConfigV1') uiConfig = cached.data;
                                    if (item.key === 'dashboardFiltersV1') filters = cached.data;
                                }
                            }
                        }
                        dispatch({ type: 'BULK_UPDATE', payload: { config, uiConfig, filters } });
                        applyUIConfig(uiConfig, true);
                    }
                }
            } catch (e) { console.warn("Cloud config sync failed, using local", e); }

            // 5. CARREGAR MESES DO DROPDOWN
            fetch('/api/months').then(r => r.json()).then(d => {
                if (d.success && d.months) dispatch({ type: 'BULK_UPDATE', payload: { availableMonths: d.months } });
            }).catch(e => console.error("Erro meses", e));

            // 6. CARREGAR DADOS CSV (Com Cache Inteligente)
            await loadData(initialMes, config, filters);
        };

        const loadData = async (monthToLoad, currentConfig, currentFilters) => {
            try {
                const newDatasets = { ...initialState.datasets };
                const newHeaders = { ...initialState.headers };
                const statuses = {};
                let loadedCount = 0;
                let syncFromCloud = false;

                // Pegar status de sincronização da nuvem
                let serverFiles = [];
                try {
                    const syncRes = await fetch(`/api/sync-status?month=${monthToLoad}`);
                    if (syncRes.ok) {
                        const syncData = await syncRes.json();
                        serverFiles = syncData.files || [];
                    }
                } catch (e) { console.warn("Sync status unreachable, using local cache"); }

                const parseCSV = (text) => new Promise((resolve, reject) => {
                    Papa.parse(text, {
                        header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
                        complete: (res) => resolve(res), error: (err) => reject(err)
                    });
                });

                for (const key of ['funcionarios', 'vales', 'credito']) {
                    const serverFile = serverFiles.find(f => f.id === key);
                    const cacheKey = `data_${monthToLoad}_${key}`;
                    const cached = await DB.loadFile(cacheKey);

                    if (cached && serverFile && cached.url === serverFile.url) {
                        // USA CACHE LOCAL - NADA MUDOU NA NUVEM
                        newDatasets[key] = cached.data;
                        newHeaders[key] = cached.headers;
                        statuses[key] = { success: true, message: `Dispositivo (Sincronizado)` };
                        loadedCount++;
                    } else if (serverFile) {
                        // BAIXA DA NUVEM - ARQUIVO NOVO OU DIFERENTE
                        const targetEndpoint = monthToLoad === 'atual' ? `/api/latest?type=${key}` : `/api/data?month=${monthToLoad}&type=${key}`;
                        const res = await fetch(targetEndpoint);
                        if (res.ok) {
                            const text = await res.text();
                            const parsed = await parseCSV(text);
                            if (parsed.data && parsed.data.length > 0) {
                                newDatasets[key] = parsed.data;
                                newHeaders[key] = parsed.meta.fields || [];
                                statuses[key] = { success: true, message: `Nuvem (Atualizado)` };
                                await DB.saveFile(cacheKey, { data: parsed.data, headers: parsed.meta.fields || [] }, serverFile.url);
                                loadedCount++;
                                syncFromCloud = true;
                            }
                        }
                    } else if (cached) {
                        // FALLBACK PARA CACHE SE OFFLINE E NUVEM INDISPONÍVEL
                        newDatasets[key] = cached.data;
                        newHeaders[key] = cached.headers;
                        statuses[key] = { success: true, message: `Modo Offline` };
                        loadedCount++;
                    }
                }

                // Carregar Configurações Específicas se não foram passadas
                let effectiveConfig = currentConfig || state.config;
                let effectiveFilters = currentFilters || state.filters;
                
                if (monthToLoad !== 'atual') {
                    const confFile = serverFiles.find(f => f.id === `${monthToLoad}/dashboardConfigV2`);
                    const filtFile = serverFiles.find(f => f.id === `${monthToLoad}/dashboardFiltersV1`);
                    
                    if (confFile) {
                        const cachedConf = await DB.loadFile(`config_dashboardConfigV2_${monthToLoad}`);
                        if (cachedConf && cachedConf.url === confFile.url) {
                            effectiveConfig = cachedConf.data;
                        } else {
                            const res = await fetch(confFile.url);
                            if (res.ok) {
                                effectiveConfig = await res.json();
                                await DB.saveFile(`config_dashboardConfigV2_${monthToLoad}`, { data: effectiveConfig }, confFile.url);
                            }
                        }
                    }

                    if (filtFile) {
                        const cachedFilt = await DB.loadFile(`config_dashboardFiltersV1_${monthToLoad}`);
                        if (cachedFilt && cachedFilt.url === filtFile.url) {
                            effectiveFilters = cachedFilt.data;
                        } else {
                            const res = await fetch(filtFile.url);
                            if (res.ok) {
                                effectiveFilters = await res.json();
                                await DB.saveFile(`config_dashboardFiltersV1_${monthToLoad}`, { data: effectiveFilters }, filtFile.url);
                            }
                        }
                    }
                }

                dispatch({ type: 'BULK_UPDATE', payload: { 
                    datasets: newDatasets, headers: newHeaders, fileStatuses: statuses, 
                    config: effectiveConfig, filters: effectiveFilters, initialized: true 
                } });

                if (newDatasets.funcionarios.length > 0) {
                    if (syncFromCloud) showNotification(`Novos dados de ${monthToLoad} baixados da nuvem.`, 'success');
                    const result = processAllData(newDatasets, effectiveConfig, effectiveFilters);
                    if (result.success && result.data.length > 0) dispatch({ type: 'SET_MASTER_DATA', payload: result.data });
                }
            } catch (e) {
                console.error(e);
                showNotification('Erro ao sincronizar dados.', 'error');
                dispatch({ type: 'SET_INITIALIZED' });
            }
        };

        initialLoad();
        dispatch({ type: 'BULK_UPDATE', payload: { reloadDataFunc: loadData } });
    }, [applyUIConfig, showNotification]);

    // Apply sidebar state
    useEffect(() => {
        if (state.sidebarPinned) {
            document.body.classList.add('sidebar-pinned');
            document.body.classList.remove('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-pinned');
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                document.body.classList.add('sidebar-collapsed');
            }
        }
    }, [state.sidebarPinned]);

    // Apply filters whenever masterData, filterFuncao, or filterRisco changes
    useEffect(() => {
        if (state.masterData.length === 0) {
            dispatch({ type: 'SET_DISPLAYED_DATA', payload: [] });
            return;
        }
        let filteredData = [...state.masterData];
        if (state.filterFuncao !== 'Todos') {
            filteredData = filteredData.filter(item => item.funcao === state.filterFuncao);
        }
        if (state.filterRisco !== 'Todos') {
            filteredData = filteredData.filter(item => {
                if (item.salario <= 0) return false;
                if (state.filterRisco === 'Normal') return item.percentual < 25;
                if (state.filterRisco === 'Alerta') return item.percentual >= 25 && item.percentual < 30;
                if (state.filterRisco === 'Alto') return item.percentual >= 30;
                return false;
            });
        }
        dispatch({ type: 'SET_DISPLAYED_DATA', payload: filteredData });
    }, [state.masterData, state.filterFuncao, state.filterRisco]);

    const value = {
        state,
        dispatch,
        showNotification,
        navigateToPage,
        processAndUpdate,
        applyUIConfig,
        loadData: state.reloadDataFunc || (async () => {}),
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboard must be used within DashboardProvider');
    return context;
}
