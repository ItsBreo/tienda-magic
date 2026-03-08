import React, { useState } from 'react';
import { Package, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CardItem from '@/components/ui/CardItem';
import CardLightbox from './CardLightbox';

interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  image_url?: string;
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

interface PacksGridProps {
  packs: Pack[];
  loading?: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onPackClick: (pack: Pack) => void;
  onBuyPack: (pack: Pack) => void;
}

const PacksGrid = ({ packs, loading = false, currentPage, setCurrentPage, onPackClick, onBuyPack }: PacksGridProps) => {
  const ITEMS_PER_PAGE = 6;
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [packCards, setPackCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCardFullscreen, setSelectedCardFullscreen] = useState<Card | null>(null);

  // Lógica estricta de paginación
  const displayedPacks = packs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(packs.length / ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    setCurrentPage(currentPage - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePackClick = async (pack: Pack) => {
    setSelectedPack(pack);
    setDialogOpen(true);
    setLoadingCards(true);

    try {
      // Cargar cartas del set desde la API
      const response = await fetch(`/api/cards/set/${pack.card_set_id}`);
      const cardsData = await response.json();
      setPackCards(cardsData || []);
    } catch (error) {
      setPackCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleCardClick = (card: Card) => {
    setSelectedCardFullscreen(card);
  };

  const handleImageError = (_imageSrc: string) => {
    // Silenciar errores de imagen
  };

  const shouldShowImage = (imageSrc?: string) => !!imageSrc;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
          <div
            key={index}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse"
          >
            <div className="w-full h-48 bg-zinc-800 rounded-lg mb-4" />
            <div className="h-6 bg-zinc-800 rounded mb-2 w-3/4" />
            <div className="h-4 bg-zinc-800 rounded mb-4 w-1/2" />
            <div className="flex justify-between items-center">
              <div className="h-6 bg-zinc-800 rounded w-20" />
              <div className="h-10 bg-zinc-800 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-zinc-400 mb-2">
          No hay packs disponibles
        </h3>
        <p className="text-zinc-500">
          Vuelve más tarde para ver nuevos packs
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {displayedPacks.map((pack) => (
          <div
            key={pack.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/80 transition-all group relative overflow-hidden transform hover:scale-105 duration-300"
            style={{ perspective: '1000px' }}
          >
            {/* Efecto de fondo hover */}
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-12 -translate-y-12 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-emerald-500/10" />

            {/* Imagen del pack - CLICKEABLE */}
            <div
              className="w-full h-48 bg-zinc-800 rounded-lg mb-4 overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105"
              onClick={() => handlePackClick(pack)}
            >
              {shouldShowImage(pack.image_url) ? (
                <img
                  src={pack.image_url}
                  alt={pack.name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(pack.image_url!)}
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
              <span className="text-xs text-zinc-500">
                {pack.config.foil ? 'Foil' : 'Standard'}
              </span>
            </div>

            {/* Precio y acciones */}
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-emerald-400">
                €{pack.price.toFixed(2)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onBuyPack(pack)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-medium"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Comprar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12 mb-8 relative z-50">
          <button
            type="button"
            onClick={() => {
              setCurrentPage(currentPage - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage <= 1}
            className="p-3 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-zinc-400 font-medium px-4 bg-zinc-900/50 py-2 rounded-lg border border-zinc-800/50">
            <span>
              Página <span className="text-emerald-400">{currentPage}</span> de {totalPages}
            </span>
            <span className="text-zinc-500 text-sm">
              ({packs.length} packs)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentPage(currentPage + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage >= totalPages}
            className="p-3 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal de detalle del pack */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedPack?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedPack && (
            <div className="space-y-6">
              {/* Información del pack */}
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">Tipo</p>
                    <p className="text-emerald-400 font-medium">{selectedPack.type}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">Cartas totales</p>
                    <p className="text-emerald-400 font-medium">
                      {selectedPack.config.total_cards || 14}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">Posibilidad Foil</p>
                    <p className="text-emerald-400 font-medium">
                      {selectedPack.config.foil ? 'Sí' : 'No'}
                    </p>
                  </div>
                </div>
                {selectedPack.config.description && (
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    <p className="text-zinc-300 text-sm">{selectedPack.config.description}</p>
                  </div>
                )}
              </div>

              {/* Grid de cartas del set */}
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Cartas del Set ({packCards.length})
                </h3>

                {loadingCards ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }, (_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="w-full aspect-[2.5/3.5] bg-zinc-800 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : packCards.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {packCards.map((card) => (
                      <CardItem
                        key={card.id}
                        card={card}
                        onClick={() => handleCardClick(card)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-400">No hay cartas disponibles para este set</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox de carta completa */}
      <CardLightbox
        card={selectedCardFullscreen}
        onClose={() => setSelectedCardFullscreen(null)}
      />
    </>
  );
};

export default PacksGrid;
