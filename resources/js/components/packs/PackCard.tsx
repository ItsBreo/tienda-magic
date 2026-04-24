import React, { useState } from 'react';
import {
 Package, ShoppingCart, Plus, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import HighlightedText from '@/components/common/HighlightedText';
import { cn } from '@/lib/utils';

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
  data?: {
      oracle_text?: string;
      flavor_text?: string;
      artist?: string;
      power?: string;
      toughness?: string;
      mana_cost?: string;
  };
}

interface PackCardProps {
  pack: Pack;
  onClick: (pack: Pack) => void;
  onBuyPack: (pack: Pack, quantity: number) => void;
  searchTerm?: string;
}

export default function PackCard({
 pack, onClick, onBuyPack, searchTerm = '',
}: PackCardProps) {
  const [quantity, setQuantity] = useState(1);

  // SANITIZACIÓN: Eliminar DRAFT del nombre
  const cleanName = pack.name.replace(/\(DRAFT\)|DRAFT/gi, '').trim();

  const getImageSrc = () => {
    if (pack.type === 'Singles' || pack.card_id !== undefined) {
      return pack.image_uri || pack.image_url;
    }
    return pack.image_url || pack.cover_image || pack.image_uri || pack.card_set?.icon_svg_uri;
  };

  const handleBuyPack = () => {
    onBuyPack(pack, quantity);
  };

  const showStock = pack.type === 'Singles' && pack.stock !== undefined;
  const isOutOfStock = pack.type === 'Singles' && pack.stock === 0;

  return (
    <div
      key={pack.id}
      className={cn(
        'border border-border rounded-xl md:px-4 px-3 py-4 bg-card w-full h-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1',
        isOutOfStock && 'opacity-80 grayscale-[0.5]',
      )}
    >
      {/* Contenedor de Imagen */}
      <div
        className="group/img cursor-pointer flex items-center justify-center bg-accent/5 rounded-lg p-2 h-48 relative overflow-hidden shrink-0"
        onClick={() => onClick(pack)}
      >
        {getImageSrc() ? (
          <img
            className="group-hover/img:scale-110 transition-transform duration-500 max-h-full object-contain drop-shadow-md"
            src={getImageSrc()}
            alt={cleanName}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Package className="w-12 h-12 text-muted-foreground/40" />
        )}

        {pack.config.foil && (
          <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-sm text-[10px] font-black text-primary px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter">
            Foil
          </div>
        )}
      </div>

      {/* Información */}
      <div className="mt-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-1 h-[3.5rem] overflow-hidden">
    <h3 className="text-foreground font-forum font-bold text-lg md:text-xl leading-tight line-clamp-2 flex-1 uppercase tracking-tight">
        <HighlightedText text={cleanName} highlight={searchTerm} highlightClassName="bg-primary/20 text-primary rounded-sm" />
    </h3>
    {/* Siempre ocupa el espacio, con o sin icono */}
    <div className="w-5 shrink-0">
        {pack.card_set?.icon_svg_uri && (
            <img
                src={pack.card_set.icon_svg_uri}
                alt=""
                className="w-5 h-5 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all filter dark:invert"
            />
        )}
    </div>
</div>

        <div className="flex items-center gap-2 h-5 mt-1 mb-2 shrink-0">
            {pack.stock !== undefined && (
        <span className={cn(
            'text-[10px] font-black uppercase tracking-tighter',
                    pack.stock > 0 ? 'text-green-500' : 'text-destructive',
        )}>
                    {pack.stock > 0 ? `Stock: ${pack.stock}` : 'Agotado'}
        </span>
    )}
</div>

        {/* Info Directa (Lore/Artist) para Cartas Sueltas - Espacio reservado para uniformidad */}
        <div className="h-[70px] flex flex-col justify-start mb-2 overflow-hidden shrink-0">
            {pack.data ? (
                <div className="space-y-2">
                    {pack.data.oracle_text && (
                        <p className="text-[10px] text-foreground/70 font-literata line-clamp-2 leading-relaxed italic opacity-80 border-l border-primary/20 pl-2">
                            {pack.data.oracle_text}
                        </p>
                    )}
                    {pack.data.artist && (
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/40">
                            Art: {pack.data.artist}
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-[10px] text-muted-foreground/30 font-literata italic leading-relaxed">
                    {pack.config.description?.substring(0, 80) || "Sobre de expansión oficial para Magic: The Gathering. Contiene cartas aleatorias de este set."}
                    {pack.config.description && pack.config.description.length > 80 && "..."}
                </div>
            )}
        </div>

        <div className="flex items-end justify-between mt-auto pt-4">
            <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Precio</p>
                <p className="md:text-xl text-lg font-black text-primary">
                    €
{pack.price.toFixed(2)}
                </p>
            </div>

            <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center bg-accent/30 rounded-lg border border-border overflow-hidden h-8 w-24">
                    <button
                        onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                        className="flex-1 flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors h-full"
                    >
                        <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-foreground tabular-nums">
                        {quantity}
                    </span>
                    <button
                        onClick={() => setQuantity((prev) => Math.min(prev + 1, pack.stock || 99))}
                        className="flex-1 flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors h-full"
                    >
                        <Plus size={12} strokeWidth={3} />
                    </button>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBuyPack}
                    disabled={isOutOfStock}
                    className={cn(
                        'h-9 px-4 bg-primary text-primary-foreground border-none hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20',
                        isOutOfStock && 'bg-muted text-muted-foreground shadow-none',
                    )}
                >
                    <ShoppingCart className="w-3.5 h-3.5 mr-2" />
                    Comprar
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
