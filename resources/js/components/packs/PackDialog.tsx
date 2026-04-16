import React, { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import CardItem from '@/components/ui/CardItem';
import CardLightbox from './CardLightbox';
import SimpleCounter from '@/components/ui/SimpleCounter';
import apiService from '@/services/ApiService';
import { useCart } from '@/contexts/CartContext';
import { showAddToCartToast, showErrorToast } from '@/utils/toastUtils';

interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  cover_image?: string;
  image_uri?: string;
  stock?: number;
  config: {
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
  const { addToCart } = useCart();

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

          // Usar las chaseCards que ya vienen en el pack del backend
          if (pack.chaseCards) {
            console.log('Using chaseCards from pack:', pack.chaseCards);
            setPackCards(pack.chaseCards);
            return;
          }

          // Fallback: Extraer código del set de forma segura
          const setCode = pack.card_set?.code || pack.card_set_id || pack.set_code;
          if (!setCode) {
            console.warn('No set code available for pack:', pack);
            setPackCards([]);
            return;
          }

          const cardsData = await apiService.getCardsBySet(setCode);
          console.log('Cards from API:', cardsData);
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
  }, [pack, isOpen]);

  const handleCardClick = (card: Card) => {
    setSelectedCardFullscreen(card);
  };

  const handleAddToCartSub = async () => {
    if (!pack || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addToCart({
        type: 'pack',
        id: pack.id,
        quantity: quantity
      });
      onClose();
    } catch (error: any) {
      console.error('Error añadiendo al carrito:', error);
      toast.error('Error al añadir al carrito');
    } finally {
      setIsSubmitting(false);
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

                <div className="pt-4 border-t border-zinc-700">
                  <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Composición del Sobre</h4>
                  <ul className="space-y-1">
                    <li className="flex justify-between text-xs">
                      <span className="text-zinc-500">Comunes</span>
                      <span className="text-zinc-300">10</span>
                    </li>
                    <li className="flex justify-between text-xs">
                      <span className="text-zinc-500">Infrecuentes</span>
                      <span className="text-zinc-300">3</span>
                    </li>
                    <li className="flex justify-between text-xs">
                      <span className="text-zinc-500">Raras o Míticas</span>
                      <span className="text-zinc-300">1</span>
                    </li>
                    <li className="flex justify-between text-xs">
                      <span className="text-zinc-500">Tierra básica</span>
                      <span className="text-zinc-300">1</span>
                    </li>
                  </ul>
                  <p className="text-[10px] text-zinc-600 mt-2 italic">
                    * Aproximadamente 1 de cada 8 sobres contiene una carta Mítica en lugar de una Rara.
                  </p>
                </div>
              </div>

              {/* Espacio flexible para empujar el contenido inferior */}
              <div className="flex-1" />

              {/* Selector de cantidad y botón de compra (fijos en la parte inferior) */}
              <div className="space-y-4 pt-6 border-t border-zinc-700">
                <div>
                  <label className="text-zinc-400 text-sm font-medium mb-2 block">
                    Cantidad
                  </label>
                  <SimpleCounter
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={99}
                    stock={pack.stock}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-medium">Total</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {(pack.price * quantity).toFixed(2)}€
                    </span>
                  </div>

                  <button
                    onClick={handleAddToCartSub}
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
