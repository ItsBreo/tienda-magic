import React from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  cover_image?: string;
  image_uri?: string;
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
  onBuyPack: (pack: Pack) => void;
}

export default function PackCard({ pack, onClick, onBuyPack }: PackCardProps) {
  const shouldShowImage = (imageSrc?: string) => !!imageSrc;

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
        {shouldShowImage(pack.cover_image || pack.image_uri) ? (
          <img
            src={pack.cover_image || pack.image_uri}
            alt={pack.name}
            className="w-full h-full object-contain"
            onError={() => {}}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <Package className="w-12 h-12 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Información del pack */}
      <h3 className="text-lg font-semibold text-zinc-100 mb-2 line-clamp-2">{pack.name}</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-400 font-medium">
          {pack.type}
        </span>
        {pack.config.foil && (
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-600/20 text-zinc-400">
            Foil
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-emerald-400">
          €{pack.price.toFixed(2)}
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onBuyPack(pack);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Comprar
        </Button>
      </div>
    </div>
  );
}
