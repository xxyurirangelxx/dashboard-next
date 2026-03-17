import { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Notification() {
    const { state, dispatch } = useDashboard();
    const [isHovering, setIsHovering] = useState(false);
    const notifications = state.notifications || [];

    if (notifications.length === 0) return null;

    const removeNotification = (id) => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    };

    return (
        <div 
            className="fixed bottom-6 right-6 z-[300] flex flex-col items-end"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="relative w-full max-w-[380px] min-w-[320px]">
                {notifications.map((note, idx) => {
                    const isTop = idx === 0;
                    // Vertical offset and scale for stacking effect
                    const yOffset = isHovering ? idx * 80 : idx * 10;
                    const scale = isHovering ? 1 : 1 - (idx * 0.05);
                    const opacity = isHovering ? 1 : 1 - (idx * 0.2);
                    
                    return (
                        <div
                            key={note.id}
                            className={`absolute bottom-0 right-0 w-full flex items-start gap-4 px-5 py-5 rounded-2xl shadow-2xl border text-white transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                                note.type === 'success'
                                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-400/30'
                                    : 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300/30'
                            }`}
                            style={{
                                transform: `translateY(-${yOffset}px) scale(${scale})`,
                                opacity: opacity >= 0 ? opacity : 0,
                                zIndex: notifications.length - idx,
                                pointerEvents: isTop || isHovering ? 'auto' : 'none',
                                filter: !isHovering && !isTop ? 'blur(1px)' : 'none',
                            }}
                        >
                            <div className="shrink-0">
                                {note.type === 'success' ? (
                                    <div className="bg-white/20 p-2 rounded-xl shadow-inner">
                                        <CheckCircle2 className="h-6 w-6 text-white" />
                                    </div>
                                ) : (
                                    <div className="bg-white/20 p-2 rounded-xl shadow-inner">
                                        <AlertCircle className="h-6 w-6 text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-1 pr-6">
                                <span className="font-bold text-sm uppercase tracking-widest opacity-80">
                                    {note.type === 'success' ? 'Sucesso' : 'Atenção'}
                                </span>
                                <span className="text-sm text-white leading-tight font-semibold">
                                    {note.message}
                                </span>
                            </div>

                            <button
                                onClick={() => removeNotification(note.id)}
                                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Hint for more notifications */}
            {!isHovering && notifications.length > 1 && (
                <div className="mt-2 mr-4 flex items-center gap-2 px-3 py-1 bg-background/80 backdrop-blur-sm border rounded-full shadow-sm animate-bounce">
                    <div className="flex -space-x-2">
                        {notifications.slice(1, 4).map((n, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full border border-background ${n.type === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        +{notifications.length - 1} Mensagens
                    </span>
                </div>
            )}
        </div>
    );
}
