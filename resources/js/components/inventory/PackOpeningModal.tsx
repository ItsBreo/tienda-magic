import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, PackageOpen, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/interfaces-carousel";
import { cn } from '@/lib/utils';

interface Card {
    id: number;
    name: string;
    rarity: string;
    image_uri?: string;
    image_uris?: {
        normal?: string;
    };
}

interface Pack {
    index: number;
    cards: Card[];
}

interface PackOpeningModalProps {
    isOpen: boolean;
    onClose: () => void;
    cards?: Card[]; // Legacy support
    packs?: Pack[]; // New grouped support
    packName: string;
}

export default function PackOpeningModal({ isOpen, onClose, cards, packs, packName }: PackOpeningModalProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const [revealedPacks, setRevealedPacks] = useState<number[]>([]); // Índices de sobres revelados

    // Normalizar datos: Si vienen cartas sueltas, las agrupamos como un solo sobre
    const displayPacks = packs || (cards ? [{ index: 1, cards }] : []);

    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    if (!isOpen || displayPacks.length === 0) return null;

    const handleRevealPack = (index: number) => {
        if (!revealedPacks.includes(index)) {
            setRevealedPacks(prev => [...prev, index]);
        }
    };

    const isCurrentPackRevealed = revealedPacks.includes(current);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4 bg-background/90 backdrop-blur-2xl transition-all duration-500">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="w-full max-w-7xl h-full lg:h-[90vh] bg-card border-none lg:border lg:border-border rounded-none lg:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden"
                >
                    {/* Header Sutil */}
                    <div className="shrink-0 px-8 py-6 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                <PackageOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">{packName}</h2>
                                <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                                    <Sparkles size={12} className="text-primary" />
                                    {displayPacks.length > 1 ? `Abriendo ${displayPacks.length} sobres simultáneamente` : 'Abriendo pack de colección'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {displayPacks.length > 1 && (
                                <div className="hidden md:flex items-center gap-2 bg-accent/30 px-4 py-2 rounded-xl border border-border">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">Sobre</span>
                                    {displayPacks.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-all duration-300",
                                                current === i + 1 ? "bg-primary w-4" : "bg-border"
                                            )} 
                                        />
                                    ))}
                                </div>
                            )}
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Contenido: Carrusel de Sobres */}
                    <div className="flex-1 overflow-hidden relative group">
                        <Carousel setApi={setApi} className="w-full h-full" opts={{ watchDrag: false }}>
                            <CarouselContent className="h-full">
                                {displayPacks.map((pack) => (
                                    <CarouselItem key={pack.index} className="h-full">
                                        <div className="h-full flex flex-col p-6 lg:p-10">
                                            
                                            {/* Grid de Cartas del Sobre Actual */}
                                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 lg:gap-6">
                                                    {pack.cards.map((card, cardIdx) => {
                                                        const isRevealed = revealedPacks.includes(pack.index);
                                                        const imageSrc = card.image_uris?.normal || card.image_uri;
                                                        
                                                        const isMythic = card.rarity === 'mythic';
                                                        const isRare = card.rarity === 'rare';
                                                        
                                                        return (
                                                            <div 
                                                                key={`${card.id}-${cardIdx}`}
                                                                className="relative aspect-[2.5/3.5] perspective-1000"
                                                                onClick={() => !isRevealed && handleRevealPack(pack.index)}
                                                            >
                                                                <motion.div
                                                                    initial={false}
                                                                    animate={{ rotateY: isRevealed ? 180 : 0 }}
                                                                    transition={{ 
                                                                        type: "spring", 
                                                                        stiffness: 40, 
                                                                        damping: 12,
                                                                        delay: isRevealed ? cardIdx * 0.08 : 0 
                                                                    }}
                                                                    style={{ transformStyle: "preserve-3d" }}
                                                                    className="w-full h-full relative"
                                                                >
                                                                    {/* BACK FACE (Hidden initially, visible when flipped) */}
                                                                    <div 
                                                                        className={cn(
                                                                            "absolute inset-0 backface-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-background flex flex-col items-center justify-center gap-3 shadow-xl cursor-not-allowed group/card",
                                                                            !isRevealed && "cursor-pointer hover:border-primary transition-colors"
                                                                        )}
                                                                        style={{ transform: "rotateY(0deg)" }}
                                                                    >
                                                                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center animate-pulse group-hover/card:bg-primary/40 transition-colors">
                                                                            <Sparkles className="w-7 h-7 text-primary" />
                                                                        </div>
                                                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(var(--primary),0.1)_100%)] opacity-50" />
                                                                        <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest z-10">Revelar</span>
                                                                    </div>

                                                                    {/* FRONT FACE (The Card) */}
                                                                    <div 
                                                                        className={cn(
                                                                            "absolute inset-0 backface-hidden rounded-xl overflow-hidden border shadow-2xl bg-card",
                                                                            isMythic ? "border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)]" :
                                                                            isRare ? "border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]" :
                                                                            "border-border"
                                                                        )}
                                                                        style={{ transform: "rotateY(180deg)" }}
                                                                    >
                                                                        {imageSrc ? (
                                                                            <img 
                                                                                src={imageSrc} 
                                                                                alt={card.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                                                                <span className="text-xs font-black text-foreground uppercase tracking-tight">{card.name}</span>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {/* Raridad Overlay */}
                                                                        <div className={cn(
                                                                            "absolute bottom-0 inset-x-0 p-1.5 bg-black/80 backdrop-blur-sm text-[9px] font-black text-center uppercase tracking-[0.2em] z-20",
                                                                            isMythic ? 'text-orange-400 bg-gradient-to-t from-orange-950/90 to-black/80' :
                                                                            isRare ? 'text-amber-400' :
                                                                            card.rarity === 'uncommon' ? 'text-blue-400' :
                                                                            'text-zinc-400'
                                                                        )}>
                                                                            {card.rarity}
                                                                        </div>

                                                                        {/* Shine effect for high rarity */}
                                                                        {(isMythic || isRare) && (
                                                                            <motion.div 
                                                                                animate={{ 
                                                                                    x: ['-100%', '200%'],
                                                                                    opacity: [0, 1, 0]
                                                                                }}
                                                                                transition={{ 
                                                                                    duration: 2, 
                                                                                    repeat: Infinity, 
                                                                                    repeatDelay: 1,
                                                                                    delay: 1
                                                                                }}
                                                                                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-10"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Footer Actions del Sobre */}
                                            <div className="shrink-0 mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center border border-border">
                                                        <span className="text-lg font-black text-foreground">{pack.index}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">Sobre Actual</p>
                                                        <p className="text-sm font-black text-foreground uppercase">Pack de Colección</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    {!revealedPacks.includes(pack.index) ? (
                                                        <Button 
                                                            onClick={() => handleRevealPack(pack.index)}
                                                            className="flex-1 sm:flex-none h-12 px-10 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 rounded-xl"
                                                        >
                                                            Revelar Sobre
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            {current < displayPacks.length ? (
                                                                <Button 
                                                                    onClick={() => api?.scrollNext()}
                                                                    className="flex-1 sm:flex-none h-12 px-8 bg-foreground text-background font-black uppercase text-xs tracking-widest rounded-xl flex items-center gap-2"
                                                                >
                                                                    Siguiente Sobre <ChevronRight size={16} />
                                                                </Button>
                                                            ) : (
                                                                <Button 
                                                                    onClick={onClose}
                                                                    className="flex-1 sm:flex-none h-12 px-12 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 rounded-xl"
                                                                >
                                                                    Terminar y Guardar
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            
                            {/* Navegación manual por si el usuario quiere volver atrás (solo si están revelados) */}
                            {displayPacks.length > 1 && (
                                <>
                                    <CarouselPrevious className="hidden lg:flex left-4 bg-card/80 backdrop-blur-md border hover:border-primary disabled:opacity-0" />
                                    <CarouselNext className="hidden lg:flex right-4 bg-card/80 backdrop-blur-md border hover:border-primary disabled:opacity-0" />
                                </>
                             )}
                        </Carousel>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
