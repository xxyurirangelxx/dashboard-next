'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, Share2 } from 'lucide-react';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import { formatCurrencyBRL } from '@/lib/utils';
import { useDashboard } from '@/context/DashboardContext';

export default function ValesPendentesPage() {
    const { state, showNotification } = useDashboard();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalGeral, setTotalGeral] = useState(0);
    const tableRef = useRef(null);

    // Carrega dados da URL se a página for aberta via Link Compartilhado (Curto)
    useEffect(() => {
        try {
            const hashString = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
            const hashParams = new URLSearchParams(hashString);
            
            if (hashParams.has('shareId')) {
                const shareId = hashParams.get('shareId');
                setLoading(true);

                fetch(`/api/share?id=${shareId}`)
                    .then(res => res.json())
                    .then(result => {
                        if (result.success && result.data && Array.isArray(result.data)) {
                            setData(result.data);
                            const sum = result.data.reduce((acc, item) => acc + parseFloat(item.valor || 0), 0);
                            setTotalGeral(sum);
                            showNotification('Relatório carregado através do link!', 'success');
                        } else {
                            throw new Error(result.error || 'Erro desconhecido');
                        }
                    })
                    .catch(err => {
                        console.error('Falha ao carregar relatório compartilhado', err);
                        showNotification('O link compartilhado expirou ou é inválido.', 'error');
                    })
                    .finally(() => setLoading(false));
            }
        } catch (err) {
            console.error('Erro na leitura do link', err);
        }
    }, [showNotification]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    // Ignora linhas sem dados suficientes (precisamos até a coluna T, indice 19)
                    const validRows = results.data.filter(row => row.length >= 20 && row[0] && row[0].toString().trim() !== '' && row[0].toString().trim() !== ';');
                    
                    // Asumir primeira linha útil pode ser cabeçalho se conter 'Nome' na coluna C (index 2)
                    let startIndex = 0;
                    if (validRows.length > 0 && validRows[0][2]?.toString().toLowerCase().includes('nome')) {
                        startIndex = 1;
                    }

                    const extractedData = [];
                    let sum = 0;

                    for (let i = startIndex; i < validRows.length; i++) {
                        const row = validRows[i];
                        // C (2), E (4), P (15), T (19)
                        const nome = row[2]?.toString().trim() || 'N/A';
                        const titulo = row[4]?.toString().trim() || 'N/A';
                        const dataEmissao = row[15]?.toString().trim() || 'N/A';
                        // Parse money
                        let valorRaw = row[19]?.toString().trim() || '0';
                        if (valorRaw.includes('R$')) valorRaw = valorRaw.replace('R$', '');
                        valorRaw = valorRaw.replaceAll('.', '').replace(',', '.').trim();
                        const valor = parseFloat(valorRaw);

                        if (nome && titulo !== 'N/A' && !isNaN(valor) && valor > 0) {
                            extractedData.push({ nome, titulo, dataEmissao, valor });
                            sum += valor;
                        }
                    }

                    setData(extractedData);
                    setTotalGeral(sum);
                    showNotification('Arquivo processado com sucesso!', 'success');
                } catch (err) {
                    console.error(err);
                    showNotification('Erro ao processar arquivo Promax.', 'error');
                } finally {
                    setLoading(false);
                }
            },
            error: (err) => {
                console.error(err);
                showNotification('Falha ao ler o arquivo CSV.', 'error');
                setLoading(false);
            }
        });
    };

    const copyImageToClipboard = async () => {
        if (!tableRef.current) return;
        
        try {
            setLoading(true);
            const canvas = await html2canvas(tableRef.current, {
                scale: 2,
                backgroundColor: '#ffffff', // Forçar fundo branco para não bugar no clipboard
                logging: false,
                useCORS: true,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showNotification('Falha ao gerar imagem', 'error');
                    setLoading(false);
                    return;
                }
                
                try {
                    const item = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([item]);
                    showNotification('Imagem copiada para a área de transferência com sucesso!', 'success');
                } catch (err) {
                    console.error('Clipboard write failed:', err);
                    showNotification('Erro ao colar área de transferência. Tente novamente.', 'error');
                } finally {
                    setLoading(false);
                }
            }, 'image/png');
        } catch (err) {
            console.error('html2canvas failed:', err);
            showNotification('Falha ao gerar o layout da imagem.', 'error');
            setLoading(false);
        }
    };

    const copyUrlToClipboard = async () => {
        if (!data || data.length === 0) {
            showNotification('Não há dados para compartilhar.', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (!result.success || !result.shareId) {
                throw new Error("Erro da API de Share");
            }

            const currentUrl = new URL(window.location.origin + window.location.pathname);
            
            // Coloca tudo no hash com apenas o ID de compartilhamento para ficar enxuto
            const hashParams = new URLSearchParams();
            hashParams.set('page', 'page-vales-pendentes');
            hashParams.set('shareId', result.shareId);
            hashParams.set('shared', 'true');
            
            currentUrl.hash = hashParams.toString();
            const textToCopy = currentUrl.toString();

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                // Fallback for non-https environment or older browsers
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                textArea.style.position = "absolute";
                textArea.style.left = "-999999px";
                document.body.prepend(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (error) {
                    console.error(error);
                } finally {
                    textArea.remove();
                }
            }

            setLoading(false);
            showNotification('Link compacto gerado e copiado! Colaboradores abrirão esta mesma tabela.', 'success');
        } catch (err) {
            setLoading(false);
            console.error('Failed to copy text or generate API share: ', err);
            showNotification('Não foi possível gerar um link para tantos dados. Tente gerar Imagem.', 'error');
        }
    };

    return (
        <section id="page-vales-pendentes" className={`animate-in ${state.isSharedMode ? 'p-0 w-full' : 'space-y-6'}`}>
            {!state.isSharedMode && (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Vales Pendentes (Promax)</h2>
                        <p className="text-sm text-muted-foreground mt-1">Importe o CSV do Promax para visualizar os Títulos Pendentes</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="relative cursor-pointer">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={loading}
                            />
                            <div className={`inline-flex items-center justify-center h-10 px-5 py-2 rounded-xl text-sm font-bold transition-all border-2 shadow-sm active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-primary/20 hover:border-primary/50 cursor-pointer bg-card hover:bg-muted text-foreground'}`}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Importar Promax CSV
                            </div>
                        </label>

                        {data && data.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={copyImageToClipboard}
                                    disabled={loading}
                                    className={`inline-flex items-center justify-center h-10 px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl text-sm font-bold transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <ImageIcon className="mr-2 h-5 w-5" />
                                    {loading ? 'Processando...' : 'Copiar como Imagem'}
                                </button>
                                <button
                                    onClick={copyUrlToClipboard}
                                    className="inline-flex items-center justify-center h-10 px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl text-sm font-bold transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                >
                                    <Share2 className="mr-2 h-5 w-5" />
                                    Copiar Link da Aba
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {data && data.length > 0 && (
                <div className="overflow-x-auto pb-4 w-full flex justify-center">
                    {/* Elemento que será printado */}
                    <div 
                        ref={tableRef} 
                        style={{ width: '100%', maxWidth: state.isSharedMode ? '900px' : '100%', backgroundColor: '#ffffff', color: '#1e293b', border: state.isSharedMode ? 'none' : '1px solid #e2e8f0', boxShadow: state.isSharedMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                        className={`rounded-2xl ${state.isSharedMode ? 'p-4 sm:p-6' : 'p-6 sm:p-8'}`}
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 md:pb-6 gap-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#1e293b' }}>Vales Pendentes</h3>
                                <p className="text-sm font-medium" style={{ color: '#64748b' }}>Relatório de Títulos do Promax</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Total Pendente</p>
                                <p className="text-3xl sm:text-4xl font-black" style={{ color: '#e11d48' }}>{formatCurrencyBRL(totalGeral * 100)}</p>
                            </div>
                        </div>

                        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid #e2e8f0' }}>
                            <table className="w-full text-sm text-left border-collapse" style={{ backgroundColor: '#ffffff' }}>
                                <thead className="text-xs uppercase font-bold tracking-wider" style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                                    <tr>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4" style={{ borderBottom: '1px solid #e2e8f0' }}>Colaborador / Cliente</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-center" style={{ borderBottom: '1px solid #e2e8f0' }}>Título</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-center" style={{ borderBottom: '1px solid #e2e8f0' }}>Emissão</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-right" style={{ borderBottom: '1px solid #e2e8f0' }}>Valor Pendente</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: i !== data.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                                        {item.nome.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-sm sm:text-base leading-tight" style={{ color: '#1e293b' }}>{item.nome}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs sm:text-sm font-mono font-medium" style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                                                    #{item.titulo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 sm:px-6 sm:py-4 text-center font-medium text-xs sm:text-sm" style={{ color: '#475569' }}>
                                                {item.dataEmissao}
                                            </td>
                                            <td className="px-4 py-3 sm:px-6 sm:py-4 text-right font-bold text-sm sm:text-base" style={{ color: '#1e293b' }}>
                                                {formatCurrencyBRL(item.valor * 100)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-center text-xs font-semibold gap-2" style={{ color: '#94a3b8' }}>
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <p>Documento gerado {state.isSharedMode ? "através do Dashboard" : "automaticamente"}</p>
                        </div>
                    </div>
                </div>
            )}

            {!data && !loading && (
                <div className="rounded-xl border border-dashed bg-muted/20 text-center p-12 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                        <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum arquivo importado</h3>
                    <p className="text-muted-foreground max-w-md">
                        Importe o arquivo <strong>promax.csv</strong> utilizando o botão do cabeçalho para gerar o relatório impresso com os títulos e vales pendentes.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-2 rounded-md">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>O CSV deverá conter Ponto e Vírgula (;) como separador.</p>
                    </div>
                </div>
            )}
            
            {loading && !data && (
                <div className="rounded-xl border bg-card p-12 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-medium animate-pulse">Processando arquivo Promax...</p>
                    </div>
                </div>
            )}
        </section>
    );
}
