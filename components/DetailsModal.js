'use client';

import { X, Receipt, CreditCard, User, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { formatCurrencyBRL } from '@/lib/utils';
import { useEffect } from 'react';

export default function DetailsModal() {
    const { state, dispatch } = useDashboard();
    const employee = state.modalEmployee;

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (employee) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [employee]);

    if (!employee) return null;

    const close = () => dispatch({ type: 'SET_MODAL_EMPLOYEE', payload: null });
    const totalValesModal = employee.valesDetails.reduce((sum, v) => sum + v.valor, 0);
    const totalCreditoModal = employee.creditoDetails.reduce((sum, c) => sum + c.valor, 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={close} />

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-card text-card-foreground rounded-xl shadow-lg border overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-muted/30 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">{employee.nome}</h2>
                            <p className="text-sm font-medium text-muted-foreground font-mono mt-0.5">Matrícula: {employee.matricula}</p>
                        </div>
                    </div>
                    <button
                        onClick={close}
                        className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:border-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-8 flex-1">

                    {/* Vales Section */}
                    <div className="rounded-xl border bg-card text-card-foreground overflow-hidden shadow-sm">
                        <div className="bg-emerald-500/10 p-4 border-b flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Detalhamento de Vales</h3>
                        </div>

                        <div className="p-0 sm:p-4">
                            {employee.valesDetails.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Data</th>
                                                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Situação</th>
                                                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Justificativa</th>
                                                <th className="px-4 py-3 font-semibold text-right uppercase tracking-wider">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {employee.valesDetails.map((v, i) => (
                                                <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{v.data}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
                                                            {v.situacao}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{v.justificativa}</td>
                                                    <td className="px-4 py-3 font-bold text-foreground text-right whitespace-nowrap">{formatCurrencyBRL(v.valor)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/50 border-t-2 font-semibold">
                                                <td colSpan="3" className="px-4 py-3 text-muted-foreground text-right uppercase tracking-wider">Total de Vales</td>
                                                <td className="px-4 py-3 text-base text-emerald-600 dark:text-emerald-400 text-right">{formatCurrencyBRL(totalValesModal)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Receipt className="h-10 w-10 text-muted-foreground opacity-50 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">Nenhum vale registrado para este funcionário.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Credito Section */}
                    <div className="rounded-xl border bg-card text-card-foreground overflow-hidden shadow-sm">
                        <div className="bg-blue-500/10 p-4 border-b flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Detalhamento de Crédito em Conta</h3>
                            </div>
                            {employee.excedeuCredito && (
                                <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full text-[13px] font-semibold tracking-tight border border-destructive/20" title={`Límite Máximo da Função: ${formatCurrencyBRL(employee.limiteCredito)}`}>
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>TETO DA FUNÇÃO EXCEDIDO</span>
                                </div>
                            )}
                        </div>

                        <div className="p-0 sm:p-4">
                            {employee.creditoDetails.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Data</th>
                                                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Situação</th>
                                                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Observações</th>
                                                <th className="px-4 py-3 font-semibold text-right uppercase tracking-wider">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {employee.creditoDetails.map((c, i) => (
                                                <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{c.data}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
                                                            {c.situacao}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{c.obs}</td>
                                                    <td className="px-4 py-3 font-bold text-foreground text-right whitespace-nowrap">{formatCurrencyBRL(c.valor)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/50 border-t-2 font-semibold">
                                                <td colSpan="3" className="px-4 py-3 text-muted-foreground text-right uppercase tracking-wider">Total de Créditos</td>
                                                <td className="px-4 py-3 text-base text-blue-600 dark:text-blue-400 text-right">{formatCurrencyBRL(totalCreditoModal)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CreditCard className="h-10 w-10 text-muted-foreground opacity-50 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">Nenhum crédito em conta registrado.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resumo Section */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-primary space-y-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold">Total Geral de Descontos</h3>
                            <p className="text-sm opacity-80 font-medium">Soma unificada (Vales + Crédito em Conta)</p>
                        </div>
                        <div className="text-3xl font-black text-primary">
                            {formatCurrencyBRL(totalValesModal + totalCreditoModal)}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
