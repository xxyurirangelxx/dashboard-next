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
    notification: { message: '', type: 'success', show: false },
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
        case 'SET_NOTIFICATION':
            return { ...state, notification: action.payload };
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
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        dispatch({ type: 'SET_NOTIFICATION', payload: { message, type, show: true } });
        notificationTimeoutRef.current = setTimeout(() => {
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: '', type: 'success', show: false } });
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
            let config = Storage.load('dashboardConfigV2') || { ...defaultConfig };
            let uiConfig = Storage.load('dashboardUIConfigV1') || { ...defaultUIConfig };
            let filters = Storage.load('dashboardFiltersV1') || [];
            const sidebarPinned = Storage.load('sidebarPinned') === true;

            // TRY LOAD CONFIGS FROM CLOUD FIRST
            try {
                const [resConfig, resUI, resFilters] = await Promise.all([
                    fetch('/api/config?key=dashboardConfigV2').then(r => r.ok ? r.json() : null),
                    fetch('/api/config?key=dashboardUIConfigV1').then(r => r.ok ? r.json() : null),
                    fetch('/api/config?key=dashboardFiltersV1').then(r => r.ok ? r.json() : null)
                ]);

                if (resConfig?.success) config = resConfig.data;
                if (resUI?.success) uiConfig = resUI.data;
                if (resFilters?.success) filters = resFilters.data;
            } catch (e) { console.warn("Cloud config load failed, using local", e); }

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

            dispatch({
                type: 'BULK_UPDATE',
                payload: { 
                    config, 
                    uiConfig, 
                    filters, 
                    sidebarPinned,
                    activePage: initialPage,
                    filterFuncao: initialFuncao,
                    filterRisco: initialRisco,
                    selectedMes: initialMes,
                    urlParams: urlParamsForComparativo,
                    isSharedMode
                },
            });

            applyUIConfig(uiConfig, true);

            // Fetch available months for the dropdown globally
            fetch('/api/months')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.months) {
                        dispatch({ type: 'BULK_UPDATE', payload: { availableMonths: data.months } });
                    }
                })
                .catch(err => console.error("Erro ao carregar meses", err));

            // Load data files
            await loadData(initialMes, config, filters);
        };

        const loadData = async (monthToLoad, currentConfig, currentFilters) => {
            try {
                const newDatasets = { ...initialState.datasets };
                const newHeaders = { ...initialState.headers };
                const statuses = {};
                let loadedFromServerCnt = 0;

                const parseCSV = (text) => new Promise((resolve, reject) => {
                    Papa.parse(text, {
                        header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
                        complete: (res) => resolve(res),
                        error: (err) => reject(err)
                    });
                });

                for (const key of ['funcionarios', 'vales', 'credito']) {
                    let dataLoaded = false;
                    
                    try {
                        const targetEndpoint = monthToLoad === 'atual' ? `/api/latest?type=${key}` : `/api/data?month=${monthToLoad}&type=${key}`;
                        const res = await fetch(targetEndpoint);
                        if (res.ok) {
                            const text = await res.text();
                            const parsed = await parseCSV(text);
                            if (parsed.data && parsed.data.length > 0) {
                                newDatasets[key] = parsed.data;
                                newHeaders[key] = parsed.meta.fields || [];
                                statuses[key] = { success: true, message: `Dados atualizados da Nuvem - Mês: ${monthToLoad === 'atual' ? 'Mais recente' : monthToLoad} (${parsed.data.length} reg).` };
                                
                                DB.saveFile(key, { data: parsed.data, headers: parsed.meta.fields || [] }).catch(e => console.error("Cache error", e));
                                
                                dataLoaded = true;
                                loadedFromServerCnt++;
                            }
                        }
                    } catch (err) {
                        console.warn(`Could not load ${key} from server:`, err);
                    }

                    if (!dataLoaded) {
                        const stored = await DB.loadFile(key);
                        if (stored && stored.data && stored.data.length > 0) {
                            newDatasets[key] = stored.data;
                            newHeaders[key] = stored.headers;
                            statuses[key] = { success: true, message: `Dados carregados do cache local (${stored.data.length} reg). Sem rede.` };
                        } else {
                            statuses[key] = { success: false, message: 'Nenhum dado encontrado no Servidor ou Cache.' };
                        }
                    }
                }

                const bulkPayload = {
                    datasets: newDatasets,
                    headers: newHeaders,
                    fileStatuses: statuses,
                    initialized: true,
                };

                dispatch({ type: 'BULK_UPDATE', payload: bulkPayload });

                if (newDatasets.funcionarios.length > 0) {
                    if(loadedFromServerCnt > 0) {
                        showNotification('Bases sincronizadas com sucesso do servidor corporativo.', 'success');
                    } else {
                        showNotification('Dados processados usando o cache local.', 'success');
                    }
                    const result = processAllData(newDatasets, currentConfig || state.config, currentFilters || state.filters);
                    if (result.success && result.data.length > 0) {
                        dispatch({ type: 'SET_MASTER_DATA', payload: result.data });
                    }
                }
            } catch (e) {
                console.error(e);
                showNotification('Erro ao carregar dados.', 'error');
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
