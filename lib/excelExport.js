import * as XLSX from 'xlsx';

export function exportToStyledExcel(masterData, currentlyDisplayedData, kpiTitles) {
    if (!masterData.length) return false;

    const wb = XLSX.utils.book_new();
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: "0F172A" } },
        alignment: { horizontal: "center", vertical: "center" },
    };
    const titleStyle = { font: { bold: true, color: { rgb: "0F172A" }, sz: 16 } };
    const currencyFormat = 'R$ #,##0.00';
    const percentFormat = '0.0%';

    // Sheet 1: Resumo
    const totalValesFiltered = currentlyDisplayedData.reduce((s, i) => s + i.totalVales, 0) / 100;
    const totalCreditoFiltered = currentlyDisplayedData.reduce((s, i) => s + i.totalCredito, 0) / 100;
    const activeCount = `${currentlyDisplayedData.length} / ${masterData.length}`;
    const riskCount = currentlyDisplayedData.filter(e => e.percentual >= 30).length;

    const ws_resumo = XLSX.utils.aoa_to_sheet([
        ["Relatório de Análise de Créditos e Vales"],
        [],
        ["Resumo Geral (Dados Filtrados na Tela)"],
    ]);
    ws_resumo["A1"].s = { font: { bold: true, sz: 20, color: { rgb: "0F172A" } } };
    ws_resumo["A3"].s = titleStyle;

    const kpiData = [
        ["Indicador Principal", "Valor"],
        [kpiTitles.vales, totalValesFiltered],
        [kpiTitles.credito, totalCreditoFiltered],
        [kpiTitles.ativos, activeCount],
        ["Funcionários Acima do Risco (>30%)", riskCount],
    ];
    XLSX.utils.sheet_add_aoa(ws_resumo, kpiData, { origin: "A4" });

    const riscoNormal = masterData.filter(e => e.salario > 0 && e.percentual < 25);
    const riscoAlerta = masterData.filter(e => e.salario > 0 && e.percentual >= 25 && e.percentual < 30);
    const riscoAlto = masterData.filter(e => e.salario > 0 && e.percentual >= 30);
    const riscoData = [
        [],
        ["Resumo por Faixa de Risco (Quadro Geral)"],
        ["Categoria", "Nº Funcionários", "Total Vales"],
        ["Normal (< 25%)", riscoNormal.length, riscoNormal.reduce((s, i) => s + i.totalVales, 0) / 100],
        ["Alerta (25% - 30%)", riscoAlerta.length, riscoAlerta.reduce((s, i) => s + i.totalVales, 0) / 100],
        ["Alto (> 30%)", riscoAlto.length, riscoAlto.reduce((s, i) => s + i.totalVales, 0) / 100],
    ];
    XLSX.utils.sheet_add_aoa(ws_resumo, riscoData, { origin: "A9" });
    ws_resumo['!cols'] = [{ wch: 35 }, { wch: 20 }];
    ['A4', 'B4', 'A11', 'B11', 'C11'].forEach(c => { if (ws_resumo[c]) ws_resumo[c].s = headerStyle; });
    if (ws_resumo["A10"]) ws_resumo["A10"].s = titleStyle;
    ['B5', 'B6', 'C12', 'C13', 'C14'].forEach(c => { if (ws_resumo[c]) ws_resumo[c].z = currencyFormat; });
    XLSX.utils.book_append_sheet(wb, ws_resumo, "Resumo e KPIs");

    // Sheet 2: Individual Analysis
    const dataToExport = masterData.map(r => ({
        'Matrícula': r.matricula,
        'Nome': r.nome,
        'Função': r.funcao,
        'Situação': r.situacao,
        'Salário': r.salario > 0 ? r.salario / 100 : 0,
        'Total Vales': r.totalVales > 0 ? r.totalVales / 100 : 0,
        'Total C.C.': r.totalCredito > 0 ? r.totalCredito / 100 : 0,
        '% Comprometido': r.salario > 0 ? r.percentual / 100 : 0,
    }));
    const ws_analise = XLSX.utils.json_to_sheet(dataToExport);
    const range = XLSX.utils.decode_range(ws_analise['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        if (ws_analise[XLSX.utils.encode_col(C) + "1"]) ws_analise[XLSX.utils.encode_col(C) + "1"].s = headerStyle;
    }
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        ['E', 'F', 'G'].forEach(col => { if (ws_analise[col + (R + 1)]) ws_analise[col + (R + 1)].z = currencyFormat; });
        if (ws_analise['H' + (R + 1)]) ws_analise['H' + (R + 1)].z = percentFormat;
    }
    ws_analise['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws_analise, "Análise Individual");

    // Sheet 3: Graph Data
    const ws_dados_graficos = XLSX.utils.aoa_to_sheet([["Dados para Gráficos (Copie e cole para criar gráficos no Excel)"]]);
    ws_dados_graficos["A1"].s = titleStyle;

    const topFuncoes = Object.entries(masterData.reduce((acc, e) => {
        if (e.funcao !== 'N/A') acc[e.funcao] = (acc[e.funcao] || 0) + e.totalVales;
        return acc;
    }, {})).sort(([, a], [, b]) => b - a).slice(0, 10);

    XLSX.utils.sheet_add_aoa(ws_dados_graficos, [["Top 10 Cargos por Total de Vales"]], { origin: "A3" });
    XLSX.utils.sheet_add_aoa(ws_dados_graficos, [["Cargo", "Total Vales"]], { origin: "A4" });
    XLSX.utils.sheet_add_json(ws_dados_graficos, topFuncoes.map(([funcao, total]) => ({ Cargo: funcao, 'Total Vales': total / 100 })), { origin: "A5", skipHeader: true });

    const topDevedores = [...masterData].sort((a, b) => b.totalDescontos - a.totalDescontos).slice(0, 10);
    XLSX.utils.sheet_add_aoa(ws_dados_graficos, [["Top 10 Funcionários por Dívida Total"]], { origin: "D3" });
    XLSX.utils.sheet_add_aoa(ws_dados_graficos, [["Funcionário", "Dívida Total"]], { origin: "D4" });
    XLSX.utils.sheet_add_json(ws_dados_graficos, topDevedores.map(e => ({ Funcionário: e.nome, 'Dívida Total': e.totalDescontos / 100 })), { origin: "D5", skipHeader: true });

    ws_dados_graficos['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 5 }, { wch: 30 }, { wch: 15 }];
    ['A3', 'D3', 'A4', 'B4', 'D4', 'E4'].forEach(c => { if (ws_dados_graficos[c]) ws_dados_graficos[c].s = headerStyle; });
    for (let i = 5; i <= 15; i++) {
        if (ws_dados_graficos[`B${i}`]) ws_dados_graficos[`B${i}`].z = currencyFormat;
        if (ws_dados_graficos[`E${i}`]) ws_dados_graficos[`E${i}`].z = currencyFormat;
    }
    XLSX.utils.book_append_sheet(wb, ws_dados_graficos, "Dados para Gráficos");

    XLSX.writeFile(wb, "Relatorio_PRO_Analise_Salarial.xlsx");
    return true;
}
