import React from 'react';
import { createPortal } from 'react-dom';
import {
 ArrowLeft, X, ExternalLink, ShieldCheck, Tag,
} from 'lucide-react';
import TiltWrapper from '@/components/ui/TiltWrapper';
import { Button } from '@/components/ui/button';

export interface CardDetailData {
  id: number;
  name: string;
  image_url?: string;
  image_uri?: string;
  image_uris?: { normal?: string; small?: string; large?: string; png?: string; art_crop?: string; border_crop?: string };
  rarity?: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  market_avg_price?: number;
  data?: {
      oracle_text?: string;
      flavor_text?: string;
      artist?: string;
      power?: string;
      toughness?: string;
      mana_cost?: string;
  };
  set?: {
      name?: string;
      code?: string;
  };
}

interface CardDetailModalProps {
  card: CardDetailData | null;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export default function CardDetailModal({
 card, onClose, onAction, actionLabel,
}: CardDetailModalProps) {
  if (!card) return null;

  const imgSrc = card.image_uris?.normal || card.image_uri || card.image_url;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" style={{ pointerEvents: 'auto' }}>

      {/* Botón de Cierre Flotante (Fuera del recuadro p/ móvil y desktop) */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 lg:top-10 lg:right-10 flex items-center justify-center p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 backdrop-blur-md z-50 group hover:rotate-90 hover:scale-110"
      >
        <X strokeWidth={3} className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md" />
      </button>

      <div className="bg-card w-full max-w-5xl rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden flex flex-col md:flex-row relative">

         {/* Fondo decorativo interno */}
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

         {/* LADO IZQUIERDO: Imagen (Ocupa 50% en desktop y 100% arriba en movil) */}
         <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex items-center justify-center bg-accent/30 relative">
            {/* TiltWrapper solo es notorio en desktop usualmente */}
            <TiltWrapper className="w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px]">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={card.name}
                        className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[4.5%]"
                    />
                ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-card border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-muted-foreground font-black text-xl">Sin Imagen</div>
                )}
            </TiltWrapper>
         </div>

         {/* LADO DERECHO: Detalles e información */}
         <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 lg:p-14 flex flex-col relative">
             <div className="flex-1 space-y-6 sm:space-y-8">
                 {/* Header carta */}
                 <div className="space-y-2">
                    {card.set?.name && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/50 border border-border/50">
                            <Tag className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{card.set.name}</span>
                        </div>
                    )}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-forum font-bold text-foreground leading-none tracking-tight">
                        {card.name}
                    </h2>
                    {card.type_line && (
                        <p className="text-sm sm:text-base font-bold text-muted-foreground italic">
                            {card.type_line}
                        </p>
                    )}
                 </div>

                 {/* Detalles de rareza y precio */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent/40 rounded-2xl p-4 border border-border/40 space-y-1">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground opacity-70">Rareza</span>
                        <p className="text-lg sm:text-xl font-black text-foreground capitalize">{card.rarity || 'Desconocida'}</p>
                    </div>
                    <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 space-y-1">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary opacity-70">Mercado</span>
                        <p className="text-lg sm:text-xl font-black text-primary">
                            {card.market_avg_price !== undefined ? `€${card.market_avg_price.toFixed(2)}` : 'N/A'}
                        </p>
                    </div>
                 </div>

                 {/* Oracle text si lo hay */}
                 {(card.data?.oracle_text || card.oracle_text) && (
                     <div className="pt-2">
                         <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2 block">Texto Oráculo / Habilidades</span>
                         <div className="text-sm text-foreground/80 leading-relaxed font-literata whitespace-pre-wrap border-l-2 border-primary/30 pl-4 bg-accent/20 p-4 rounded-r-xl">
                            {card.data?.oracle_text || card.oracle_text}
                         </div>
                     </div>
                 )}

                 {/* Flavor text / Lore */}
                 {card.data?.flavor_text && (
                      <div className="pt-2">
                           <span className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-black mb-3 block font-forum">Fragmento de Historia</span>
                           <div className="text-sm text-foreground/80 italic leading-relaxed font-literata pl-4 border-l-2 border-primary/20">
                             {card.data.flavor_text}
                          </div>
                      </div>
                 )}

                 {/* Artist & Stats */}
                 {(card.data?.artist || (card.data?.power && card.data?.toughness)) && (
                     <div className="flex flex-wrap gap-6 pt-4 border-t border-border/30">
                         {card.data?.artist && (
                             <div className="space-y-1">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Ilustrador</span>
                                 <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                     <span className="grayscale opacity-50 text-base">🎨</span> {card.data.artist}
                                 </p>
                             </div>
                         )}
                         {(card.data?.power && card.data?.toughness) && (
                             <div className="space-y-1">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Poder / Resistencia</span>
                                 <p className="text-xl font-forum font-black text-primary">
                                     {card.data.power} / {card.data.toughness}
                                 </p>
                             </div>
                         )}
                     </div>
                 )}
             </div>

             {/* Footer Boton de Acción (Vender, Comprar, etc) */}
             <div className="pt-8 mt-4 border-t border-border/50">
                {onAction ? (
                    <Button
                        onClick={onAction}
                        className="w-full h-14 text-sm sm:text-base font-black uppercase tracking-widest bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl shadow-lg shadow-primary/20"
                    >
                        {actionLabel || 'Interactuar'}
                    </Button>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground bg-accent/30 py-3 rounded-lg border border-border/50">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Producto Oficial Verificado
                    </div>
                )}
             </div>
         </div>
      </div>
    </div>,
    document.body,
  );
}
