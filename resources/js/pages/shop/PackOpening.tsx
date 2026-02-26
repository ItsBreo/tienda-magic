import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Sparkles, Package, ArrowRight, Gift } from 'lucide-react';
import { route } from 'ziggy-js';
import { usePage } from '@inertiajs/react';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OrderItem {
  id: number;
  quantity: number;
  opened: boolean;
  booster_pack: {
    id: number;
    name: string;
    type: string;
    card_set: {
      name: string;
    };
  };
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  items: OrderItem[];
}

interface GeneratedCard {
  id: number;
  name: string;
  rarity: string;
  image: string | null;
  quantity: number;
  foil?: boolean;
}

export default function PackOpening() {
  const { props } = usePage();
  const { order } = props as any;
  const [openingPack, setOpeningPack] = useState<number | null>(null);
  const [revealedCards, setRevealedCards] = useState<GeneratedCard[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const unopenedPacks = order.items.filter(item => !item.opened);

  const openPack = async (orderItemId: number) => {
    setOpeningPack(orderItemId);
    setIsOpening(true);
    setRevealedCards([]);
    setCurrentCardIndex(0);

    try {
      const response = await fetch(route('pack.open', [order.id, orderItemId].join('/')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Revelar cartas una por una
        for (let i = 0; i < data.cards.length; i++) {
          setTimeout(() => {
            setRevealedCards(prev => [...prev, data.cards[i]]);
            setCurrentCardIndex(i + 1);
          }, i * 500); // Revelar cada 500ms
        }

        // Terminar animación
        setTimeout(() => {
          setIsOpening(false);
          setOpeningPack(null);
        }, data.cards.length * 500 + 1000);
      }
    } catch (error) {
      console.error('Error opening pack:', error);
      setIsOpening(false);
      setOpeningPack(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'bg-gray-600 text-gray-100';
      case 'uncommon': return 'bg-green-600 text-green-100';
      case 'rare': return 'bg-blue-600 text-blue-100';
      case 'mythic': return 'bg-orange-600 text-orange-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'Común';
      case 'uncommon': return 'Infrecuente';
      case 'rare': return 'Rara';
      case 'mythic': return 'Mítica';
      default: return rarity;
    }
  };

  return (
    <TiendaMagicLayout
      breadcrumbs={[
        { title: 'Tienda', href: route('shop.index') },
        { title: 'Mis Packs', href: route('inventory.packs') },
      ]}
    >
      <Head title="Apertura de Packs" />

      <div className="min-h-screen bg-black text-zinc-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-full">
              <Gift className="h-6 w-6 text-emerald-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Apertura de Packs
              </h1>
              <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-zinc-500 mt-2">
              ¡Abre tus booster packs y descubre cartas épicas!
            </p>
          </div>

          {/* Packs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {unopenedPacks.map((item) => (
              <Card
                key={item.id}
                className={`bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer ${
                  openingPack === item.id ? 'ring-2 ring-emerald-500/50 animate-pulse' : ''
                }`}
                onClick={() => !isOpening && openPack(item.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <Package className="h-16 w-16 mx-auto text-zinc-400 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                      {item.booster_pack.name}
                    </h3>
                    <Badge
                      className={`${
                        item.booster_pack.type === 'collector'
                          ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.booster_pack.type}
                    </Badge>
                    <p className="text-sm text-zinc-500">
                      {item.booster_pack.card_set.name}
                    </p>
                    {openingPack === item.id && (
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600/20 border border-emerald-500/50 rounded-full">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                          <span className="text-sm text-emerald-400">Abriendo...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Opening Animation Modal */}
          {openingPack && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                      ¡Abriendo Pack Mágico!
                    </h2>
                    <p className="text-zinc-500">
                      Descubriendo cartas épicas...
                    </p>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {/* Card slots */}
                    {Array.from({ length: 14 }).map((_, index) => (
                      <div
                        key={index}
                        className="aspect-[2.5/3.5] bg-zinc-800 border-2 border-zinc-700 rounded-lg flex items-center justify-center relative overflow-hidden"
                      >
                        {revealedCards[index] ? (
                          /* Revealed Card */
                          <div className="relative w-full h-full">
                            <img
                              src={revealedCards[index].image || '/placeholder-card.png'}
                              alt={revealedCards[index].name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-card.png';
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <p className="text-xs text-zinc-300 text-center truncate">
                                {revealedCards[index].name}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <Badge className={getRarityColor(revealedCards[index].rarity)}>
                                  {getRarityLabel(revealedCards[index].rarity)}
                                </Badge>
                                {revealedCards[index].foil && (
                                  <div className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-emerald-400" />
                                    <span className="text-xs text-emerald-400">Foil</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Unrevealed Card */
                          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                            <Package className="h-8 w-8 text-zinc-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full">
                      <div className="flex gap-1">
                        {Array.from({ length: 14 }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                              index < currentCardIndex
                                ? 'bg-emerald-400'
                                : 'bg-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-zinc-400 ml-2">
                        {currentCardIndex}/14 cartas
                      </span>
                    </div>
                  </div>

                  {!isOpening && (
                    <div className="text-center mt-6">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold"
                        onClick={() => setOpeningPack(null)}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Continuar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {order.items.filter(item => item.opened).length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-zinc-500">
                Has abierto {order.items.filter(item => item.opened).length} de {order.items.length} packs.
              </p>
              <Button
                className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                onClick={() => router.visit(route('inventory.cards'))}
              >
                Ver Mi Inventario
              </Button>
            </div>
          )}
        </div>
      </div>
    </TiendaMagicLayout>
  );
}
