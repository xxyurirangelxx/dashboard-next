'use client';

import { useDashboard } from '@/context/DashboardContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Notification() {
    const { state } = useDashboard();

    // We keep the '.notification' and '.show' classes to support the existing globals.css transition logic, 
    // but enhance it with Tailwind classes for modern look.
    const { show, message, type } = state.notification;

    return (
        <div
            className={`fixed bottom-6 right-6 z-[200] max-w-sm flex items-start gap-4 px-5 py-4 rounded-2xl shadow-2xl border text-white transition-all duration-500 ease-out transform ${show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
                } ${type === 'success'
                    ? 'bg-primary border-primary/50 ring-4 ring-primary/20'
                    : 'bg-destructive border-destructive/50 ring-4 ring-destructive/20'
                }`}
        >
            <div className="shrink-0 pt-0.5">
                {type === 'success' ? (
                    <div className="bg-white/20 p-2 rounded-full animate-bounce">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                ) : (
                    <div className="bg-white/20 p-2 rounded-full animate-pulse">
                        <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-base tracking-wide flex items-center gap-2">
                    {type === 'success' ? 'Sucesso' : 'Atenção'}
                </span>
                <span className="text-sm text-white/90 leading-snug font-medium">{message}</span>
            </div>
        </div>
    );
}
