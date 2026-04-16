import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Card {
    id: number;
    name: string;
    rarity: string;
    image_uri?: string;
    image_uris?: {
        normal?: string;
    };
}

interface PackOpeningModalProps {
    isOpen: boolean;
    onClose: () => void;
    cards: Card[];
    packName: string;
}

export default function PackOpeningModal({ isOpen, onClose, cards, packName }: PackOpeningModalProps) {
    const [revealedCount, setRevealedCount] = useState(0);

    if (!isOpen) return null;

    const handleRevealAll = () => {
        setRevealedCount(cards.length);
    };

    const isAllRevealed = revealedCount >= cards.length;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl relative p-8 scrollbar-hide"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-4">
                            <PackageOpen className="w-4 h-4" />
                            Sobre Abierto
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            Resultados de {packName}
                        </h2>
                        <p className="text-zinc-500 mt-2 font-medium">
                            Has obtenido {cards.length} cartas nuevas para tu colección
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                        {cards.map((card, index) => {
                            const isRevealed = index < revealedCount || isAllRevealed;
                            const imageSrc = card.image_uris?.normal || card.image_uri;
                            
                            return (
                                <motion.div
                                    key={`${card.id}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 transition-all duration-500 ${
                                        isRevealed 
                                            ? 'border-zinc-800 bg-zinc-900' 
                                            : 'border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-zinc-900 cursor-pointer hover:border-emerald-500'
                                    }`}
                                    onClick={() => !isRevealed && setRevealedCount(prev => prev + 1)}
                                >
                                    {isRevealed ? (
                                        <>
                                            {imageSrc ? (
                                                <img 
                                                    src={imageSrc} 
                                                    alt={card.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                                    <span className="text-xs font-bold text-zinc-400 leading-tight">{card.name}</span>
                                                    <span className="text-[10px] text-zinc-600 uppercase mt-1">{card.rarity}</span>
                                                </div>
                                            )}
                                            
                                            {/* Rarity Flare */}
                                            {(card.rarity === 'rare' || card.rarity === 'mythic') && (
                                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-amber-500/20 to-transparent" />
                                            )}
                                            
                                            <div className={`absolute bottom-0 inset-x-0 p-2 bg-black/60 backdrop-blur-md text-[10px] font-bold text-center uppercase tracking-widest ${
                                                card.rarity === 'mythic' ? 'text-orange-400' :
                                                card.rarity === 'rare' ? 'text-amber-400' :
                                                card.rarity === 'uncommon' ? 'text-blue-400' :
                                                'text-zinc-400'
                                            }`}>
                                                {card.rarity}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-emerald-500/50 animate-pulse" />
                                            <span className="text-[10px] font-bold text-emerald-500/40 uppercase mt-2">Revelar</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center gap-4">
                        {!isAllRevealed && (
                            <Button
                                onClick={handleRevealAll}
                                className="bg-white text-black hover:bg-zinc-200 font-bold px-8 h-12 rounded-xl"
                            >
                                Revelar todas
                            </Button>
                        )}
                        {isAllRevealed && (
                            <Button
                                onClick={onClose}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-12 h-12 rounded-xl shadow-lg shadow-emerald-900/40"
                            >
                                Guardar en mi colección
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
