import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Minus, ShoppingCart, Loader2, Package } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import CardItem from '@/components/ui/CardItem';
import CardLightbox from './CardLightbox';
import apiService from '@/services/ApiService';

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
}

export default function PackDialog({ pack, isOpen, onClose }: PackDialogProps) {
  const [packCards, setPackCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedCardFullscreen, setSelectedCardFullscreen] = useState<Card | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bug 3 Fix: Reset completo de estado cuando se cierra el modal
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
      const loadCards = async () => {
        try {
          setLoadingCards(true);

          // Bug 2 Fix: Extraer código del set de forma segura
          const setCode = pack.card_set?.code || pack.card_set_id;
          if (!setCode) {
            console.warn('No set code available for pack:', pack);
            setPackCards([]);
            return;
          }

          const cardsData = await apiService.getCardsBySet(setCode);
          setPackCards(cardsData || []);
        } catch (error) {
          console.error('Error cargando cartas del pack:', error);
          toast.error('Error al cargar las cartas de este sobre');
          setPackCards([]);
        } finally {
          setLoadingCards(false);
        }
      };

      loadCards();
    }
  }, [pack, isOpen]);

  const handleCardClick = (card: Card) => {
    setSelectedCardFullscreen(card);
  };

  const handleAddToCart = async () => {
    if (!pack || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Hacer la petición a la API del carrito (¡Esta es la que funciona!)
      await apiService.axiosInstance.post('/api/cart', {
        booster_pack_id: pack.id,
        quantity: quantity,
      });

      toast.success('¡Añadido al carrito con éxito!');
      onClose();
    } catch (error) {
      console.error('Error añadiendo al carrito:', error);
      toast.error('Error al añadir al carrito');
    } finally {
      setIsSubmitting(false);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1);
    }
  };

  if (!pack) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-[90vw] lg:max-w-7xl h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b border-zinc-800">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            {pack.name}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Explora las cartas disponibles en este sobre
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 h-full overflow-hidden">
          {/* Columna Izquierda (8 columnas) - Lista de cartas con scroll */}
          <div className="lg:col-span-8 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-6">
                Cartas del Set ({packCards.length})
              </h3>

              {loadingCards ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 10 }, (_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="w-full aspect-[2.5/3.5] bg-zinc-800 rounded-xl border border-zinc-700" />
                    </div>
                  ))}
                </div>
              ) : packCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 px-1">
  {packCards.map((card) => (
    <CardItem
      key={card.id}
      card={card}
      onClick={() => handleCardClick(card)}
    />
  ))}
</div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 text-lg">No hay cartas disponibles para este set</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha (4 columnas) - Panel de compra estático */}
          <div className="lg:col-span-4 bg-zinc-900/50 border-l border-zinc-800 flex flex-col h-full">
            <div className="flex-1 flex flex-col p-6">
              {/* Portada del sobre */}
              <div className="w-full h-48 bg-zinc-800 rounded-xl mb-6 overflow-hidden border border-zinc-700">
                {(() => {
                  // Bug 1 Fix: Priorizar nuevas fuentes de imagen del backend
                  const imageSrc = pack.image_uri ||
                                 pack.cover_image ||
                                 pack.card_set?.icon_svg_uri;
                  const hasImage = !!imageSrc;

                  return hasImage ? (
                    <img
                      src={imageSrc}
                      alt={pack.name}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        // Bug 1 Fix: Fallback si la imagen falla
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <Package className="w-12 h-12 text-zinc-600" />
                    </div>
                  );
                })()}
              </div>

              {/* Información del pack */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-600/20 text-emerald-400 text-sm font-medium rounded-full border border-emerald-600/30">
                    {pack.type}
                  </span>
                  {pack.config.foil && (
                    <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm font-medium rounded-full">
                      Foil
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 text-sm">Precio unitario</span>
                    <span className="text-zinc-100 font-bold">{pack.price.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 text-sm">Cartas por sobre</span>
                    <span className="text-zinc-100 font-medium">{pack.config.total_cards || 14}</span>
                  </div>
                </div>

                {pack.config.description && (
                  <div className="pt-4 border-t border-zinc-700">
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {pack.config.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Espacio flexible para empujar el contenido inferior */}
              <div className="flex-1" />

              {/* Selector de cantidad y botón de compra (fijos en la parte inferior) */}
              <div className="space-y-4 pt-6 border-t border-zinc-700">
                <div>
                  <label className="text-zinc-400 text-sm font-medium mb-2 block">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1 || isSubmitting}
                      className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4 text-zinc-300" />
                    </button>
                    <span className="text-zinc-100 font-bold text-lg min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= 99 || isSubmitting}
                      className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4 text-zinc-300" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-medium">Total</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {(pack.price * quantity).toFixed(2)}€
                    </span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-emerald-600/25 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>Añadir al carrito</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Lightbox de carta completa */}
      <CardLightbox
        card={selectedCardFullscreen}
        onClose={() => setSelectedCardFullscreen(null)}
      />
    </Dialog>
  );
}
