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
            className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border text-white font-medium transition-all duration-300 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
                } ${type === 'success'
                    ? 'bg-primary border-primary-foreground/20'
                    : 'bg-destructive border-destructive-foreground/20'
                }`}
        >
            {type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 bg-white/20 rounded-full p-0.5 shrink-0" />
            ) : (
                <AlertCircle className="h-5 w-5 bg-white/20 rounded-full p-0.5 shrink-0" />
            )}
            <span className="text-sm">{message}</span>
        </div>
    );
}
