import React from 'react';
import {
    useNavigate,
} from 'react-router-dom';
import {
    Package,
    Trash2,
} from 'lucide-react';
import SimpleCounter from '@/components/ui/SimpleCounter';

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

    const pack = item.booster_pack || item.pack || item;
    const price = pack.price || item.unit_price || 0;
    const stock = item.stock || (item.card?.stock) || 0;

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
                <SimpleCounter
                    value={item.quantity}
                    onChange={(newQuantity: number) => onUpdateQuantity(item.id, newQuantity)}
                    min={1}
                    max={99}
                    stock={stock}
                    disabled={isUpdating}
                    className="w-auto"
                />

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
