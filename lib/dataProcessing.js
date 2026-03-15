import { parseCurrencyToCents } from './utils';
import { defaultConfig, LIDERANCA_ROLES } from './constants';

export function applyUserFilters(sourceData, sourceKey, filters) {
    const relevantFilters = filters.filter(f => f.source === sourceKey);
    if (relevantFilters.length === 0) {
        return sourceData.map(row => ({ ...row, _ignoreValue: false, _ignoreChart: false }));
    }
    const deleteFilters = relevantFilters.filter(f => f.action === 'delete_row');
    const ignoreValueFilters = relevantFilters.filter(f => f.action === 'ignore_value');
    const ignoreChartFilters = relevantFilters.filter(f => f.action === 'ignore_chart');

    let processedData = sourceData;
    if (deleteFilters.length > 0) {
        processedData = processedData.filter(row =>
            !deleteFilters.some(filter => {
                const cellValue = row[filter.column];
                return cellValue && typeof cellValue === 'string' && cellValue.toLowerCase().includes(filter.keyword.toLowerCase());
            })
        );
    }

    return processedData.map(row => {
        const newRow = { ...row };
        newRow._ignoreValue = ignoreValueFilters.some(filter => {
            const cellValue = row[filter.column];
            return cellValue && typeof cellValue === 'string' && cellValue.toLowerCase().includes(filter.keyword.toLowerCase());
        });
        newRow._ignoreChart = ignoreChartFilters.some(filter => {
            const cellValue = row[filter.column];
            return cellValue && typeof cellValue === 'string' && cellValue.toLowerCase().includes(filter.keyword.toLowerCase());
        });
        return newRow;
    });
}

export function processAllData(datasets, config, filters) {
    let savedConfig = config || defaultConfig;

    const finalConfig = {
        funcionarios: { ...defaultConfig.funcionarios, ...(savedConfig.funcionarios || {}) },
        vales: { ...defaultConfig.vales, ...(savedConfig.vales || {}) },
        credito: { ...defaultConfig.credito, ...(savedConfig.credito || {}) },
    };

    if (!datasets.funcionarios.length) {
        return { success: false, error: "Arquivo de Funcionários é obrigatório.", data: [] };
    }

    const filteredValesData = applyUserFilters(datasets.vales, 'vales', filters);
    const filteredCreditoData = applyUserFilters(datasets.credito, 'credito', filters);

    const funcionariosMap = new Map();
    datasets.funcionarios.forEach(row => {
        const matricula = row[finalConfig.funcionarios.matricula]?.toString().trim();
        if (matricula) {
            funcionariosMap.set(matricula, {
                nome: row[finalConfig.funcionarios.nome]?.toString().trim(),
                funcao: row[finalConfig.funcionarios.funcao]?.toString().trim(),
                situacao: (row[finalConfig.funcionarios.situacao] || 'N/A').toString().trim().toUpperCase(),
                salario: parseCurrencyToCents(row[finalConfig.funcionarios.salario]),
            });
        }
    });

    const valesMap = new Map();
    filteredValesData.forEach(row => {
        const matricula = row[finalConfig.vales.matricula]?.trim();
        if (matricula && matricula.toLowerCase() !== 'nao encontrada') {
            if (!valesMap.has(matricula)) valesMap.set(matricula, []);
            valesMap.get(matricula).push({
                valor: row._ignoreValue ? 0 : parseCurrencyToCents(row[finalConfig.vales.valor]),
                data: row[finalConfig.vales.data] || 'N/A',
                situacao: (row[finalConfig.vales.situacao] || 'ATIVO').trim().toUpperCase(),
                justificativa: row[finalConfig.vales.justificativa]?.trim() || 'Não especificado',
                nomeOriginal: row[finalConfig.vales.nome]?.trim() || 'N/A',
                _ignoreChart: row._ignoreChart,
            });
        }
    });

    const creditoMap = new Map();
    filteredCreditoData.forEach(row => {
        const matricula = row[finalConfig.credito.matricula]?.toString().trim();
        if (matricula && matricula.toLowerCase() !== 'nao encontrada') {
            if (!creditoMap.has(matricula)) creditoMap.set(matricula, []);
            creditoMap.get(matricula).push({
                valor: row._ignoreValue ? 0 : parseCurrencyToCents(row[finalConfig.credito.valor]),
                data: row[finalConfig.credito.data]?.toString().trim() || 'N/A',
                obs: row[finalConfig.credito.obs]?.toString().trim() || 'N/A',
                situacao: (row[finalConfig.credito.situacao] || 'ATIVO').trim().toUpperCase(),
                nomeOriginal: row[finalConfig.credito.nome]?.trim() || 'N/A',
                _ignoreChart: row._ignoreChart,
            });
        }
    });

    const allMatriculas = new Set([...funcionariosMap.keys(), ...valesMap.keys(), ...creditoMap.keys()]);
    const masterData = [];

    for (const matricula of allMatriculas) {
        if (!matricula) continue;
        const funcInfo = funcionariosMap.get(matricula);
        const valesDetails = valesMap.get(matricula) || [];
        const creditoDetails = creditoMap.get(matricula) || [];

        if (!funcInfo && valesDetails.length === 0 && creditoDetails.length === 0) continue;

        const totalVales = valesDetails.reduce((sum, item) => sum + item.valor, 0);
        const totalCredito = creditoDetails.reduce((sum, item) => sum + item.valor, 0);
        const nome = funcInfo ? funcInfo.nome : (creditoDetails[0]?.nomeOriginal || valesDetails[0]?.nomeOriginal || `Matrícula ${matricula}`);
        const funcao = funcInfo ? funcInfo.funcao : 'N/A';
        const situacao = funcInfo ? funcInfo.situacao : 'PENDENTE (Fora do QLP)';
        const salario = funcInfo ? (funcInfo.salario || 0) : 0;

        // Regra de Negócio: Alerta de Excesso no Crédito
        const isLideranca = LIDERANCA_ROLES.some(role => 
            funcao && typeof funcao === 'string' && role.toLowerCase() === funcao.toLowerCase()
        );
        const limiteMaximoCompraValor = isLideranca ? 50000 : 25000;
        const excedeuCredito = totalCredito > limiteMaximoCompraValor;

        masterData.push({
            matricula, nome, funcao, situacao, salario, totalVales, totalCredito,
            totalDescontos: totalVales + totalCredito,
            percentual: salario > 0 ? ((totalVales + totalCredito) / salario) * 100 : 0,
            valesDetails,
            creditoDetails,
            limiteCredito: limiteMaximoCompraValor,
            excedeuCredito
        });
    }

    return { success: true, data: masterData };
}

export function processComparisonData(monthData, config, type) {
    if (monthData.length === 0) return { totalGeral: 0, employeeTotals: new Map() };
    const nameCol = config[type]?.nome;
    const valueCol = config[type]?.valor;
    if (!monthData[0].hasOwnProperty(nameCol) || !monthData[0].hasOwnProperty(valueCol)) {
        return null;
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
}
