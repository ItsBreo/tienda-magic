import React, { useState, useEffect } from 'react';
import {
 ShoppingCart, Loader2, Package, Plus, Minus, Info, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import CardItem from '@/components/ui/CardItem';
import CardDetailModal from '@/components/common/CardDetailModal';
import apiService from '@/services/ApiService';
import { useCart } from '@/contexts/CartContext';
import { showErrorToast } from '@/utils/toastUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  cover_image?: string;
  image_uri?: string;
  stock: number;
  config?: {
    commons?: number;
    uncommons?: number;
    rares?: number;
    mythics?: number;
    foil?: boolean;
    total_cards?: number;
    description?: string;
  };
  chaseCards?: Card[];
  card_set?: {
    code?: string;
    icon_svg_uri?: string;
    name?: string;
  };
  set?: {
    code?: string;
    icon_svg_uri?: string;
    name?: string;
  };
}

interface Card {
  id: number;
  name: string;
  image_url?: string;
  rarity: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
}

interface PackDialogProps {
  pack: Pack | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'shop' | 'inventory';
  availableQuantity?: number;
  onOpenPack?: (quantity: number) => void;
}

export default function PackDialog({
    pack,
    isOpen,
    onClose,
    mode = 'shop',
    availableQuantity = 0,
    onOpenPack,
}: PackDialogProps) {
  const [packCards, setPackCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedCardFullscreen, setSelectedCardFullscreen] = useState<Card | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToCart } = useCart();

  // Calcular estado de stock
  const isOutOfStock = !pack || pack.stock <= 0;

  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      setPackCards([]);
      setLoadingCards(false);
      setSelectedCardFullscreen(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pack && isOpen) {
      // Inicializar cantidad según stock disponible
      setQuantity(isOutOfStock ? 0 : 1);

      const loadCards = async () => {
        try {
          setLoadingCards(true);
          if (pack.chaseCards) {
            setPackCards(pack.chaseCards);
            return;
          }
          const setCode = pack.card_set?.code || pack.set?.code || pack.card_set_id;
          if (!setCode) return;
          const cardsData = await apiService.getCardsBySet(setCode);
          setPackCards(cardsData || []);
        } catch (error) {
          console.error('Error cargando cartas del pack:', error);
          showErrorToast('Error al cargar las cartas de este sobre');
          setPackCards([]);
        } finally {
          setLoadingCards(false);
        }
      };
      loadCards();
    }
  }, [pack, isOpen, isOutOfStock]);

  const handleCardClick = (card: Card) => {
    setSelectedCardFullscreen(card);
  };

  const handleAddToCartSub = async () => {
    if (!pack || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (mode === 'inventory') {
          if (onOpenPack) onOpenPack(quantity);
      } else {
          await addToCart({
            type: 'pack',
            id: pack.id,
            quantity,
          });
          onClose();
      }
    } catch (error: any) {
      console.error('Error en la acción:', error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pack) return null;

  const cleanName = pack.name.replace(/\(DRAFT\)|DRAFT/gi, '').trim();
  const setInfo = pack.card_set || pack.set;
  const setIcon = setInfo?.icon_svg_uri;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border text-foreground max-w-[98vw] lg:max-w-7xl h-[95vh] lg:h-[85vh] flex flex-col p-0 rounded-2xl shadow-2xl overflow-hidden border-none outline-none">

        {/* Header - Fixed */}
        <DialogHeader className="px-8 py-5 border-b border-border bg-card/50 backdrop-blur-xl shrink-0">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-none">
              {cleanName}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-semibold flex items-center gap-2 mt-1 text-xs lg:text-sm">
              <Info size={14} className="text-primary" />
              {mode === 'inventory'
                ? `Tienes ${availableQuantity} sobres disponibles en tu bóveda`
                : 'Explora las cartas más destacadas de esta colección oficial'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Grid de Cartas - Scrollable Area */}
          <div className="flex-1 overflow-y-auto bg-background/30 custom-scrollbar p-5 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                Posibles Hallazgos (
{packCards.length}
)
</h3>
              <div className="h-px flex-1 bg-border/40 ml-4" />
            </div>

            {loadingCards ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className="aspect-[2.5/3.5] bg-card/40 animate-pulse rounded-xl border border-border/50" />
                ))}
              </div>
            ) : packCards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {packCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(card)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30">
                <Package size={48} strokeWidth={1} className="mb-4" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px]">Sin datos de cartas</p>
              </div>
            )}
          </div>

          {/* Panel Lateral de Acción */}
          <div className="w-full lg:w-[380px] bg-card/80 backdrop-blur-lg border-t lg:border-t-0 lg:border-l border-border flex flex-col shrink-0">
            <div className="p-6 lg:p-8 flex flex-col h-full">

              <div className="relative group/set mb-6 lg:mb-8 mx-auto">
                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full opacity-60 group-hover/set:opacity-100 transition-opacity duration-700" />
                <div className="relative w-36 h-36 lg:w-44 lg:h-44 bg-gradient-to-tr from-accent/20 to-accent/5 rounded-[32px] border border-border overflow-hidden flex items-center justify-center p-8 transition-all duration-500 group-hover/set:border-primary/40 group-hover/set:bg-accent/20 shadow-xl">
                  {setIcon ? (
                    <img
                      src={setIcon}
                      alt="Set Logo"
                      className="w-full h-full object-contain filter dark:invert-0 drop-shadow-[0_5px_10px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover/set:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                    />
                  ) : (
                    <Package size={60} className="text-muted-foreground/20" />
                  )}
                </div>
              </div>

              <div className="space-y-4 lg:space-y-6 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-md border border-primary/20">
                    {pack.type || 'BOOSTER PACK'}
                  </span>
                  {pack.config?.foil && (
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20">
                      PREMIUM
                    </span>
                  )}
                </div>

                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                       {mode === 'inventory' ? 'Valor Est' : 'Precio Unitario'}
                    </span>
                    <span className="text-xl font-black text-foreground">
€
{pack.price.toFixed(2)}
</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Disponibilidad</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-foreground font-black text-md">{pack.stock || 0}</span>
                        <span className="text-[9px] text-muted-foreground font-black uppercase">unidades</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Capacidad</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-foreground font-black text-md">{pack.config?.total_cards || 14}</span>
                        <span className="text-[9px] text-muted-foreground font-black uppercase">Cartas</span>
                    </div>
                  </div>
                </div>

                {pack.config?.description && (
                  <div className="bg-accent/20 p-3 rounded-lg border border-border/30">
                    <p className="text-muted-foreground text-[11px] leading-snug font-medium italic opacity-80">
                      {pack.config.description.length > 150 ? `${pack.config.description.substring(0, 150)}...` : pack.config.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Acción Alternativa para Inventario */}
              {mode === 'inventory' ? (
                <div className="mt-6 pt-6 border-t border-border/60 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={() => onOpenPack && onOpenPack(1)}
                            disabled={isSubmitting || availableQuantity < 1}
                            className="h-14 bg-accent/40 text-foreground border border-border hover:bg-accent hover:border-primary/50 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all flex flex-col gap-0.5"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (
                                <>
                                    <span>Abrir x1</span>
                                    <span className="text-[8px] opacity-60 font-medium tracking-normal">Un solo pack</span>
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => onOpenPack && onOpenPack(10)}
                            disabled={isSubmitting || availableQuantity < 10}
                            className="h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-primary/20 flex flex-col gap-0.5"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (
                                <>
                                    <div className="flex items-center gap-1">
                                        <Sparkles size={10} />
                                        <span>Abrir x10</span>
                                    </div>
                                    <span className="text-[8px] opacity-80 font-medium tracking-normal">Apertura Rápida</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
              ) : (
                <div className="mt-6 pt-6 border-t border-border/60 space-y-6">
                    <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Seleccionar</span>
                        <div className="flex items-center bg-accent/40 rounded-xl border border-border h-12 w-32 overflow-hidden shadow-sm">
                        <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={isOutOfStock}
                            className="flex-1 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all h-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Minus size={14} strokeWidth={4} />
                        </button>
                        <span className="w-10 text-center text-sm font-black text-foreground">{quantity}</span>
                        <button
                            onClick={() => setQuantity((q) => Math.min(pack.stock, q + 1))}
                            disabled={isOutOfStock}
                            className="flex-1 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all h-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} strokeWidth={4} />
                        </button>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Total Pedido</span>
                        <span className="text-3xl font-black text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]">
€
{(pack.price * quantity).toFixed(2)}
</span>
                    </div>
                    </div>

                    <Button
                    onClick={handleAddToCartSub}
                    disabled={isSubmitting || isOutOfStock}
                    className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : isOutOfStock ? (
                        <>
                            <Package size={16} />
                            AGOTADO
                        </>
                    ) : (
                        <>
                        <ShoppingCart size={16} />
                        Comprar Pack
                        </>
                    )}
                    </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <CardDetailModal
        card={selectedCardFullscreen as any}
        onClose={() => setSelectedCardFullscreen(null)}
      />
    </Dialog>
  );
}
