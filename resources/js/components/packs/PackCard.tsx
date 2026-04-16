import React, { useState } from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PackQuantitySelector from './PackQuantitySelector';
import HighlightedText from '@/components/common/HighlightedText';

interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  cover_image?: string;
  image_uri?: string;
  image_url?: string;
  card_id?: number;
  stock?: number;
  card_set?: {
    icon_svg_uri?: string;
    code?: string;
  };
  config: {
    commons?: number;
    uncommons?: number;
    rares?: number;
    mythics?: number;
    foil?: boolean;
    total_cards?: number;
    description?: string;
  };
}

interface PackCardProps {
  pack: Pack;
  onClick: (pack: Pack) => void;
  onBuyPack: (pack: Pack, quantity: number) => void;
  searchTerm?: string;
}

export default function PackCard({ pack, onClick, onBuyPack, searchTerm = '' }: PackCardProps) {
  const [quantity, setQuantity] = useState(1);

  const shouldShowImage = (imageSrc?: string) => !!imageSrc;

  const getImageSrc = () => {
    // Logica para Cartas Sueltas
    if (pack.type === 'Singles' || pack.card_id !== undefined) {
      return pack.image_uri || pack.image_url;
    }

    // Logica para Sobres / Packs
    return pack.card_set?.icon_svg_uri || pack.cover_image || pack.image_uri;
  };

  const handleBuyPack = () => {
    onBuyPack(pack, quantity);
  };

  return (
    <div
      key={pack.id}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/80 transition-all group relative overflow-hidden transform hover:scale-105 duration-300"
      style={{ perspective: '1000px' }}
    >
      {/* Efecto de fondo hover */}
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-12 -translate-y-12 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-emerald-500/10" />

      {/* Imagen del pack - CLICKEABLE */}
      <div
        className="w-full h-48 bg-zinc-900 rounded-lg mb-4 overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105 p-4"
        onClick={() => onClick(pack)}
      >
        {shouldShowImage(getImageSrc()) ? (
          <img
            src={getImageSrc()}
            alt={pack.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Bug 4 Fix: Fallback si la imagen falla
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <Package className="w-12 h-12 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Información del pack */}
      <h3 className="text-lg font-semibold text-zinc-100 mb-2 line-clamp-2">
        <HighlightedText text={pack.name} highlight={searchTerm} highlightClassName="bg-emerald-500/30 text-emerald-400 rounded-sm px-0.5" />
      </h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-400 font-medium">
          {pack.type}
        </span>
        {pack.config.foil && (
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-600/20 text-zinc-400">
            Foil
          </span>
        )}
        {/* Stock indicator for cards */}
        {pack.type === 'Singles' && pack.stock !== undefined && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            pack.stock > 0
              ? 'bg-green-600/20 text-green-400'
              : 'bg-red-600/20 text-red-400'
          }`}>
            Stock: {pack.stock}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-emerald-400">
          €{pack.price.toFixed(2)}
        </div>
        <div className="flex flex-col gap-3">
          {/* Quantity Selector - Only for Cards */}
          <PackQuantitySelector
            pack={pack}
            quantity={quantity}
            onQuantityChange={setQuantity}
            className="w-full"
          />

          {/* Buy Button */}
          <Button
            onClick={handleBuyPack}
            disabled={pack.type === 'Singles' && pack.stock === 0}
            className={`w-full px-4 py-2 rounded-lg transition-colors ${
              pack.type === 'Singles' && pack.stock === 0
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {pack.type === 'Singles' && pack.stock === 0 ? 'Agotado' : 'Comprar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
