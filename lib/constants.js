export const defaultConfig = {
    funcionarios: { matricula: "Matrícula", nome: "Nome", funcao: "FUNÇÃO", situacao: "SITUAÇÃO", salario: "SALARIO" },
    vales: { matricula: "MATRICULA", nome: "Motorista/Ajudante", valor: "Valor", data: "Data", situacao: "SITUAÇÃO", justificativa: "JUSTIFICATIVA" },
    credito: { matricula: "MATRICULA", nome: "Colaborador", valor: "Valor", data: "DATA", obs: "OBSERVAÇÕES", situacao: "SITUAÇÃO" },
};

export const defaultUIConfig = {
    primaryColor: '#16a34a',
    fontFamily: 'Inter',
    mainTitle: 'VIZUAL',
    kpiTitleVales: 'Total de Vales (Filtrado)',
    kpiTitleCredito: 'Total Crédito (Filtrado)',
    kpiTitleAtivos: 'Funcionários (Filtrados / Total)',
    chartPalette: 'moderno',
};

export const CHART_PALETTES = {
    moderno: ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6', '#facc15', '#34d399'],
    vibrante: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1'],
    pastel: ['#a7f3d0', '#bae6fd', '#ddd6fe', '#fbcfe8', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff'],
    floresta: ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4'],
};

export const LIDERANCA_ROLES = [
    'GERENTE DE VENDAS II',
    'GERENTE DE OPERACIONAL',
    'GERENTE DE VENDAS',
    'COORDENADOR DE TI',
    'GERENTE DE TECNOLOGIA E INOVAÇÃO',
    'COORDENADOR DE NIVEL DE SERVIÇOS',
    'SUPERVISOR DE DISTRIBUIÇÃO 2',
    'GERENTE DE GENTE GESTÃO',
    'GERENTE FINANCEIRO NIVEL DE SERVICO II',
    'SUPERVISOR DE FROTA',
    'SUPERVISOR FINANCEIRO',
    'SUPERVISOR DE GENTE E GESTÃO III',
    'ADVOGADO II',
    'LÍDER DE EXECUÇÃO',
    'TECNICO EM SEGURANCA NO TRABALHO',
    'SV DE ARMAZÉM II',
    'GERENTE DE GESTÃO',
    'SV DE CONTROLE II'
];
