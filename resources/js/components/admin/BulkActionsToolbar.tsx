import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
            <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl shadow-black/20 rounded-2xl px-6 py-3.5 flex items-center gap-5">
                {/* Count Badge */}
                <div className="flex items-center gap-3 border-r border-border/50 pr-5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-[11px] font-black text-primary-foreground shadow-sm shadow-primary/30">
                        {count}
                    </span>
                    <span className="text-[12px] font-black uppercase tracking-widest text-foreground/70 whitespace-nowrap font-montserrat">
                        Seleccionados
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            size="sm"
                            variant={action.variant || 'ghost'}
                            onClick={action.onClick}
                            className={cn(
                                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 transition-all active:scale-95 font-montserrat border border-transparent",
                                !action.className && "text-foreground hover:bg-accent hover:border-border/50",
                                action.className
                            )}
                        >
                            {action.icon}
                            {action.label}
                        </Button>
                    ))}
                </div>

                {/* Clear */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-9 w-9 p-0 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-accent border border-transparent hover:border-border/50 transition-all"
                    title="Limpiar selección"
                >
                    <XCircle className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default BulkActionsToolbar;
