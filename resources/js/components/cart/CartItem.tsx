import React from 'react';
import {
    useNavigate
} from 'react-router-dom';
import {
    Package,
    Trash2,
    Plus,
    Minus
} from 'lucide-react';

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
    };
    onUpdateQuantity: (id: number, newQuantity: number) => void;
    onRemove: (id: number) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const navigate = useNavigate();
    const pack = item.booster_pack || item.pack || item;
    const price = pack.price || item.unit_price || 0;

    const getImageSrc = () => {
        if (item.card_id || item.card) {
            return item.card?.image_uri || item.card?.image_url;
        }

        return item.booster_pack?.card_set?.icon_svg_uri || item.booster_pack?.image_uri || item.booster_pack?.cover_image;
    };

    return (
        <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <div onClick={item.card_id ? () => navigate(`/shop?category=cards&openCard=${item.card_id}`) : () => navigate(`/shop?category=packs&openPack=${item.booster_pack_id}`)} className="w-20 h-24 bg-zinc-950 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-colors cursor-pointer">
                {(() => {
                    const imageSrc = getImageSrc();
                    return imageSrc ? (
                        <img src={imageSrc} alt={pack.name} className="w-full h-full object-contain p-2 bg-white/90 rounded-lg shadow-sm" />
                    ) : (
                        <Package className="w-8 h-8 text-zinc-700" />
                    );
                })()}
            </div>

            <div className="flex-1">
                <div onClick={item.card_id ? () => navigate(`/shop?category=cards&openCard=${item.card_id}`) : () => navigate(`/shop?category=packs&openPack=${item.booster_pack_id}`)} className="font-bold text-lg text-zinc-100 hover:text-emerald-400 transition-colors cursor-pointer">
                    {pack.name || 'Sobre Misterioso'}
                </div>
                <p className='text-emerald-400 font-medium'>
                    {Number(price).toFixed(2)}
                    €
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1">
                    <span className="text-zinc-400 text-sm mr-3">Cant:</span>
                    <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                </div>

                <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="p-3 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>

                <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-3 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Minus className="w-5 h-5" />
                </button>

                <button
                    onClick={() => onRemove(item.id)}
                    className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
