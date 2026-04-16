import React from 'react';
import { Trash2, ShieldCheck, XCircle, ChevronDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsToolbarProps {
    count: number;
    actions: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        variant?: 'default' | 'destructive' | 'outline' | 'ghost';
        className?: string;
    }[];
    onClear: () => void;
}

export function BulkActionsToolbar({ count, actions, onClear }: BulkActionsToolbarProps) {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-zinc-900 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-full px-6 py-3 flex items-center gap-6 glassmorphism">
                <div className="flex items-center gap-3 border-r border-zinc-800 pr-5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-black">
                        {count}
                    </span>
                    <span className="text-sm font-medium text-zinc-100 whitespace-nowrap">
                        Seleccionados
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            size="sm"
                            variant={action.variant || 'ghost'}
                            onClick={action.onClick}
                            className={`h-9 px-4 rounded-full text-xs font-semibold gap-2 transition-all active:scale-95 ${action.className}`}
                        >
                            {action.icon}
                            {action.label}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-9 w-9 p-0 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                    title="Limpiar selección"
                >
                    <XCircle className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default BulkActionsToolbar;
