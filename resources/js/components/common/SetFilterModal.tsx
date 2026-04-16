import React, { useState, useMemo, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Tag, Check, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    accentColor?: "amber" | "emerald";
}

export default function SetFilterModal({
    isOpen,
    onClose,
    availableSets,
    selectedSets,
    onApply,
    accentColor = "amber"
}: SetFilterModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [tempSelected, setTempSelected] = useState<(string | number)[]>([]);

    // Sync temp selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempSelected([...selectedSets]);
            setSearchTerm("");
        }
    }, [isOpen, selectedSets]);

    const filteredSets = useMemo(() => {
        if (!searchTerm.trim()) return availableSets;
        const s = searchTerm.toLowerCase();
        return availableSets.filter(
            set => set.name.toLowerCase().includes(s) || set.code.toLowerCase().includes(s)
        );
    }, [availableSets, searchTerm]);

    const toggleSet = (key: string | number) => {
        setTempSelected(prev => 
            prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
        );
    };

    const handleApply = () => {
        onApply(tempSelected);
        onClose();
    };

    const colors = {
        amber: {
            bg: "bg-amber-500",
            text: "text-amber-500",
            border: "border-amber-500",
            hover: "hover:bg-amber-500/10",
            ring: "focus:ring-amber-500",
            button: "bg-amber-500 hover:bg-amber-600 text-black",
            icon: "text-amber-400"
        },
        emerald: {
            bg: "bg-emerald-500",
            text: "text-emerald-500",
            border: "border-emerald-500",
            hover: "hover:bg-emerald-500/10",
            ring: "focus:ring-emerald-500",
            button: "bg-emerald-500 hover:bg-emerald-600 text-white",
            icon: "text-emerald-400"
        }
    }[accentColor];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Filter className={cn("h-5 w-5", colors.icon)} />
                        Filtrar por Set
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                        Selecciona uno o más de los sets disponibles para filtrar los artículos.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar set por nombre o código..."
                            className={cn(
                                "pl-10 bg-accent border-border text-sm focus-visible:ring-1", 
                                accentColor === "amber" ? "focus-visible:ring-primary" : "focus-visible:ring-primary"
                            )}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {filteredSets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
                            <Tag className="h-8 w-8 opacity-20" />
                            <p>No se encontraron sets</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredSets.map((set) => {
                                // Prefer code for selection as it's the most common API parameter, 
                                // but fallback to ID if no code exists.
                                const selectionKey = set.code || set.id;
                                const isSelected = tempSelected.includes(selectionKey);
                                
                                return (
                                    <button
                                        key={set.id}
                                        onClick={() => toggleSet(selectionKey)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border text-left transition-all group",
                                            isSelected 
                                                ? cn(colors.bg, "border-transparent text-white shadow-lg shadow-black/20")
                                                : "bg-accent/30 border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {set.icon_svg_uri ? (
                                                <img 
                                                    src={set.icon_svg_uri} 
                                                    alt="" 
                                                    className={cn("h-5 w-5", isSelected ? "filter brightness-0 invert" : "opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100")} 
                                                />
                                            ) : (
                                                <Tag className={cn("h-4 w-4", isSelected ? "text-white" : "text-zinc-600")} />
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className={cn("text-sm font-medium truncate", isSelected ? "text-white" : "text-foreground")}>
                                                    {set.name}
                                                </span>
                                                <span className={cn("text-[10px] uppercase font-bold tracking-wider", isSelected ? "text-white/70" : "text-muted-foreground")}>
                                                    {set.code}
                                                </span>
                                            </div>
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 text-white shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-accent/30 border-t border-border flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 mr-auto">
                         {tempSelected.length > 0 && (
                            <Badge variant="secondary" className="bg-accent text-muted-foreground hover:bg-accent/80 cursor-pointer" onClick={() => setTempSelected([])}>
                                {tempSelected.length} seleccionados (Limpiar)
                            </Badge>
                         )}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground hover:bg-accent flex-1 sm:flex-none"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleApply}
                            className={cn(colors.button, "font-bold flex-1 sm:flex-none")}
                        >
                            Aplicar filtro
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
