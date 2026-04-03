import React from 'react';
import { Sparkles } from 'lucide-react';
import TiltWrapper from './TiltWrapper';

interface CardItemProps {
    card: {
        id: number;
        name: string;
        image_url?: string;
        image_uri?: string;
        rarity: string;
        mana_cost?: string;
        type_line?: string;
        oracle_text?: string;
        stock?: number;
    };
    onClick?: () => void;
    className?: string;
    showStock?: boolean;
}

export default function CardItem({ card, onClick, className = '', showStock = false }: CardItemProps) {
    // Determinar color de rareza
    const getRarityColor = (rarity: string) => {
        switch (rarity?.toLowerCase()) {
            case 'mythic': return 'from-orange-600 to-red-600';
            case 'rare': return 'from-yellow-600 to-amber-600';
            case 'uncommon': return 'from-emerald-600 to-teal-600';
            default: return 'from-gray-600 to-zinc-600';
        }
    };

    const getRarityBorder = (rarity: string) => {
        switch (rarity?.toLowerCase()) {
            case 'mythic': return 'border-orange-500/50 shadow-orange-500/20';
            case 'rare': return 'border-yellow-500/50 shadow-yellow-500/20';
            case 'uncommon': return 'border-emerald-500/50 shadow-emerald-500/20';
            default: return 'border-gray-500/50 shadow-gray-500/20';
        }
    };

    const rarityColors = getRarityBorder(card.rarity);
    const borderColor = rarityColors.split(' ')[0].replace('border-', '');
    const shadowColor = rarityColors.split('shadow-')[1]?.split(' ')[0] || 'rgba(0,0,0,0.1)';

    return (
        <div
            className={`relative w-full cursor-pointer ${className}`}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            role="button"
            tabIndex={0}
        >
            <TiltWrapper className="w-full">
            <div
                className="relative w-full transition-all duration-200 ease-out rounded-xl overflow-hidden border-2 bg-zinc-900 aspect-[2.5/3.5]"
                style={{
                    borderColor,
                    boxShadow: `0 10px 20px -8px ${shadowColor}`,
                }}
            >
                {/* Imagen de la carta */}
                {(() => {
                    const imageSrc = card.image_uri || card.image_url;
                    return imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
                            <span className="text-xs text-zinc-500 text-center px-2">Sin imagen</span>
                        </div>
                    );
                })()}

                {/* Overlay con información - más limpio y sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 drop-shadow-lg">{card.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(card.rarity)} text-black font-semibold shadow-lg`}>
                                {card.rarity?.toUpperCase()}
                            </span>
                            {card.mana_cost && (
                                <span className="text-xs text-zinc-200 drop-shadow-md">{card.mana_cost}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Indicador de rareza en la esquina - más sutil */}
                <div className="absolute top-2 right-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getRarityColor(card.rarity)} shadow-md`} />
                </div>

                {/* Indicador de stock */}
                {showStock && (
                    <div className="absolute top-2 left-2">
                        <div className={`w-3 h-3 rounded-full shadow-md ${
                            (card.stock || 0) > 0
                                ? 'bg-green-500'
                                : 'bg-red-500'
                        }`} />
                    </div>
                )}
            </div>
            </TiltWrapper>
        </div>
    );
}
