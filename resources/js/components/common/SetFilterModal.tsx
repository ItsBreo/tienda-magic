import React, { useState, useMemo, useEffect } from 'react';
import {
 Search, Tag, Check, Filter, X,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CardSet {
    id: string | number;
    name: string;
    code: string;
    icon_svg_uri?: string;
}

interface SetFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableSets: CardSet[];
    selectedSets: (string | number)[];
    onApply: (selected: (string | number)[]) => void;
    accentColor?: 'amber' | 'emerald' | 'primary';
}

export default function SetFilterModal({
    isOpen,
    onClose,
    availableSets,
    selectedSets,
    onApply,
    accentColor = 'primary',
}: SetFilterModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [tempSelected, setTempSelected] = useState<(string | number)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setTempSelected([...selectedSets]);
            setSearchTerm('');
        }
    }, [isOpen, selectedSets]);

    const filteredSets = useMemo(() => {
        if (!searchTerm.trim()) return availableSets;
        const s = searchTerm.toLowerCase();
        return availableSets.filter(
            (set) => set.name.toLowerCase().includes(s) || set.code.toLowerCase().includes(s),
        );
    }, [availableSets, searchTerm]);

    const toggleSet = (key: string | number) => {
        setTempSelected((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));
    };

    const handleApply = () => {
        onApply(tempSelected);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[620px] bg-card border border-border text-foreground p-0 overflow-hidden shadow-2xl shadow-black/20 rounded-2xl">
                {/* Header */}
                <DialogHeader className="p-8 pb-0">
                    <div className="flex items-center justify-between mb-1">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-forum font-black text-foreground">
                            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                <Filter className="h-5 w-5 text-primary" />
                            </div>
                            Filtrar por Expansión
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mt-2 font-montserrat">
                        Selecciona uno o varios planos para filtrar el catálogo.
                    </DialogDescription>
                </DialogHeader>

                {/* Search Input */}
                <div className="px-8 py-5">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            placeholder="Buscar por nombre o código de set..."
                            className="pl-11 h-12 bg-accent/40 border-border/50 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all font-medium placeholder:text-muted-foreground/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {tempSelected.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-montserrat">Seleccionados:</span>
                            <Badge
                                variant="outline"
                                className="text-[10px] font-black uppercase tracking-widest px-2.5 h-6 bg-primary/5 text-primary border-primary/20 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                                onClick={() => setTempSelected([])}
                            >
                                {tempSelected.length}
{' '}
— Limpiar
</Badge>
                        </div>
                    )}
                </div>

                {/* Sets Grid */}
                <div className="px-8 pb-2 max-h-[380px] overflow-y-auto">
                    {filteredSets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground space-y-3">
                            <Tag className="h-8 w-8 opacity-10" />
                            <p className="text-[11px] font-black uppercase tracking-widest opacity-30 font-montserrat">No se encontraron expansiones</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {filteredSets.map((set) => {
                                const selectionKey = set.code || set.id;
                                const isSelected = tempSelected.includes(selectionKey);

                                return (
                                    <button
                                        key={set.id}
                                        onClick={() => toggleSet(selectionKey)}
                                        className={cn(
                                            'flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 group',
                                            isSelected
                                                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 hover:bg-primary/90'
                                                : 'bg-accent/20 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-accent/40',
                                        )}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {set.icon_svg_uri ? (
                                                <div className={cn(
                                                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                                    isSelected ? 'bg-primary-foreground/10' : 'bg-accent/60',
                                                )}>
                                                    <img
                                                        src={set.icon_svg_uri}
                                                        alt=""
                                                        className={cn(
                                                            'h-5 w-5',
                                                            isSelected ? 'filter brightness-0 invert' : 'opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all',
                                                        )}
                                                    />
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                                    isSelected ? 'bg-primary-foreground/10' : 'bg-accent/60',
                                                )}>
                                                    <Tag className={cn('h-4 w-4', isSelected ? 'text-primary-foreground' : 'text-muted-foreground/40')} />
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className={cn(
                                                    'text-[13px] font-black truncate leading-tight font-montserrat',
                                                    isSelected ? 'text-primary-foreground' : 'text-foreground',
                                                )}>
                                                    {set.name}
                                                </span>
                                                <span className={cn(
                                                    'text-[9px] uppercase font-black tracking-[0.3em] mt-0.5',
                                                    isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground/30',
                                                )}>
                                                    {set.code}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            'h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
                                            isSelected
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : 'bg-border/40 text-transparent group-hover:text-muted-foreground/20',
                                        )}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-8 pt-5 bg-accent/10 border-t border-border/50">
                    <div className="flex items-center gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="text-[10px] font-black uppercase tracking-widest h-12 rounded-xl border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent flex-1 font-montserrat"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleApply}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-xl shadow-primary/20 flex-1 font-montserrat transition-all"
                        >
                            Aplicar Filtro
                            {tempSelected.length > 0 && (
                                <span className="ml-2 h-5 w-5 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-black flex items-center justify-center">
                                    {tempSelected.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
