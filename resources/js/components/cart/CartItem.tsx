import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Trash2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItemProps {
    item: {
        id: number;
        card_id?: number;
        booster_pack_id?: number;
        quantity: number;
        unit_price?: number;
        booster_pack?: any;
        card?: any;
        pack?: any;
        stock?: number;
    };
    onUpdateQuantity: (id: number, newQuantity: number) => void;
    onRemove: (id: number) => void;
    isUpdating?: boolean;
}

export default function CartItem({ item, onUpdateQuantity, onRemove, isUpdating = false }: CartItemProps) {
    const navigate = useNavigate();

    // Resolver datos del objeto
    const mainData = item.booster_pack || item.card || item.pack || {};
    const name = mainData.name || 'MTG Item';
    const price = item.unit_price || mainData.price || 0;
    const stock = item.stock || (item.card?.stock) || 99;

    // Lógica de imagen robusta (priorizando iconos de set para sobres)
    const getImageSrc = () => {
        if (item.card_id || item.card) {
            return item.card?.image_uri || item.card?.image_url || item.card?.image_uris?.small;
        }
        // Para sobres, priorizamos el icono del set
        const setIcon = item.booster_pack?.card_set?.icon_svg_uri || 
                        item.booster_pack?.set?.icon_svg_uri || 
                        item.pack?.set?.icon_svg_uri;
        
        return setIcon || item.booster_pack?.image_uri || item.booster_pack?.cover_image;
    };

    const handleNavigate = () => {
        if (item.card_id) {
            navigate(`/shop?category=cards&openCard=${item.card_id}`);
        } else if (item.booster_pack_id) {
            navigate(`/shop?category=packs&openPack=${item.booster_pack_id}`);
        }
    };

    return (
        <div className="group relative bg-card/40 border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 p-4">
            {/* Header del Item: Título */}
            <div className="flex justify-between items-start gap-3 mb-3">
                <h4 
                    onClick={handleNavigate}
                    className="text-sm font-black text-foreground hover:text-primary transition-colors cursor-pointer leading-tight line-clamp-2"
                >
                    {name}
                </h4>
                <button
                    onClick={() => onRemove(item.id)}
                    className="text-muted-foreground hover:text-red-500 p-1 hover:bg-red-500/10 rounded-md transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="flex gap-4">
                {/* Imagen/Miniatura */}
                <div 
                    onClick={handleNavigate}
                    className="w-16 h-16 bg-accent/20 rounded-xl border border-border overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group-hover:border-primary/20 transition-all"
                >
                    {(() => {
                        const imageSrc = getImageSrc();
                        return imageSrc ? (
                            <img 
                                src={imageSrc} 
                                alt={name} 
                                className="w-full h-full object-contain p-2 filter dark:invert-0 drop-shadow-sm" 
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <Package className="w-6 h-6 text-muted-foreground/30" />
                        );
                    })()}
                </div>

                {/* Controles y Precio */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                    <span className="text-primary font-black text-sm tracking-tight">
                        {Number(price).toFixed(2)}€
                    </span>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center bg-accent/30 rounded-lg border border-border h-8 overflow-hidden">
                            <button 
                                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                disabled={isUpdating || item.quantity <= 1}
                                className="px-2 hover:bg-primary/20 hover:text-primary transition-all disabled:opacity-30 h-full border-r border-border"
                            >
                                <Minus size={12} strokeWidth={4} />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-foreground">
                                {item.quantity}
                            </span>
                            <button 
                                onClick={() => onUpdateQuantity(item.id, Math.min(99, item.quantity + 1))}
                                disabled={isUpdating || item.quantity >= stock}
                                className="px-2 hover:bg-primary/20 hover:text-primary transition-all disabled:opacity-30 h-full border-l border-border"
                            >
                                <Plus size={12} strokeWidth={4} />
                            </button>
                        </div>

                        <div className="text-right">
                             <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 block">Total</span>
                             <span className="text-sm font-black text-foreground">{(price * item.quantity).toFixed(2)}€</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
