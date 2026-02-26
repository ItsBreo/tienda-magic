import { useState } from 'react';
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PackData {
  id: number;
  name: string;
  price: number;
  type: string;
  description?: string;
  image_uri?: string;
  cover_image?: string;
  card_set?: {
    name: string;
    code: string;
    released_at?: string;
  };
  config?: string;
}

interface RelatedPackData {
  id: number;
  name: string;
  price: number;
  type: string;
  card_set?: {
    name: string;
  code: string;
  };
}

interface ChaseCardData {
  id: number;
  name: string;
  rarity: string;
  image_uris?: {
    small?: string;
    normal?: string;
  };
}

export default function PackDetail({ pack, relatedPacks, chaseCards }: {
  pack: PackData;
  relatedPacks: RelatedPackData[];
  chaseCards: any[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<any | null>(null);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      await router.post(route('cart.add'), {
        booster_pack_id: pack.id,
        quantity: quantity,
      });
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'standard':
        return 'bg-emerald-600 text-white';
      case 'master':
        return 'bg-purple-600 text-white';
      case 'collector':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-zinc-600 text-white';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'standard':
        return 'Estándar';
      case 'master':
        return 'Master';
      case 'collector':
        return 'Coleccionista';
      default:
        return type;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common':
        return 'bg-gray-500';
      case 'uncommon':
        return 'bg-green-500';
      case 'rare':
        return 'bg-blue-500';
      case 'mythic':
        return 'bg-orange-500';
      default:
        return 'bg-zinc-500';
    }
  };

  const config = pack.config ? JSON.parse(pack.config) : null;
  const totalCards = config ?
    (config.common || 0) + (config.uncommon || 0) + (config.rare || 0) + (config.mythic || 0) + (config.foil || 0)
    : 15;

  return (
    <TiendaMagicLayout
      breadcrumbs={[
        { title: 'Tienda', href: route('shop.index') },
        { title: pack.name, href: window.location.href },
      ]}
      title={`${pack.name} - Tienda Magic`}
    >
      <Head title={`${pack.name} - Tienda Magic`} />

      <div className="min-h-screen bg-black text-zinc-100 pb-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <Button
            variant="outline"
            className="mb-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => router.visit(route('shop.index'))}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Tienda
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Pack Info */}
            <div className="lg:col-span-2">
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="relative">
                  {/* Pack Image */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                    {pack.cover_image ? (
                      <img
                        src={pack.cover_image}
                        alt={pack.name}
                        className="w-full h-full object-cover"
                      />
                    ) : pack.image_uri ? (
                      <img
                        src={pack.image_uri}
                        alt={pack.name}
                        className="w-full h-full object-cover"
                      />
                    ) : chaseCards.length > 0 && chaseCards[0].image_uri ? (
                      <img
                        src={chaseCards[0].image_uri}
                        alt={pack.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ display: pack.cover_image || pack.image_uri || (chaseCards.length > 0 && chaseCards[0].image_uri) ? 'none' : 'flex' }}
                    >
                      <Package className="h-24 w-24 text-zinc-600" />
                    </div>
                  </div>

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className={getTypeColor(pack.type)}>
                        {getTypeLabel(pack.type)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-zinc-400">Popular</span>
                      </div>
                    </div>
                    <CardTitle className="text-2xl text-zinc-100 mb-2">{pack.name}</CardTitle>
                    <p className="text-zinc-400 mb-4">{pack.card_set?.name}</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100 mb-2">Descripción</h3>
                      <p className="text-zinc-400 leading-relaxed">
                        {pack.description || `Booster pack de la expansión ${pack.card_set?.name}. Contiene cartas aleatorias de diferentes rarezas para expandir tu colección.`}
                      </p>
                    </div>

                    {/* Cartas que te pueden tocar */}
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100 mb-4">Cartas Destacadas</h3>
                      <div className="flex overflow-x-auto gap-4 flex-nowrap pb-4 snap-x">
                        {chaseCards.map((card) => (
                          <div
                            key={card.id}
                            className="w-48 shrink-0 snap-center"
                          >
                            <div className="relative group">
                              {card.image_uri ? (
                                <img
                                  src={card.image_uri}
                                  alt={card.name}
                                  className="w-full h-auto aspect-[2.5/3.5] object-contain rounded-xl shadow-md hover:scale-105 transition-transform duration-300 cursor-pointer"
                                  onClick={() => setZoomedCard(card)}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-full aspect-[2.5/3.5] bg-gray-800 rounded-xl flex items-center justify-center"
                                style={{ display: card.image_uri ? 'none' : 'flex' }}
                              >
                                <Package className="h-12 w-12 text-gray-600" />
                              </div>
                              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg p-2">
                                <p className="text-sm font-medium text-zinc-200 truncate">{card.name}</p>
                                <p className="text-xs text-zinc-400">{card.rarity}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pack Contents */}
                    {config && (
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Contenido del Pack</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {config.common > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                              <div className="w-3 h-3 bg-gray-500 rounded-full" />
                              <div>
                                <p className="text-sm font-medium text-zinc-300">Comunes</p>
                                <p className="text-xs text-zinc-500">{config.common} cartas</p>
                              </div>
                            </div>
                          )}
                          {config.uncommon > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                              <div className="w-3 h-3 bg-green-600 rounded-full" />
                              <div>
                                <p className="text-sm font-medium text-zinc-300">Infrecuentes</p>
                                <p className="text-xs text-zinc-500">{config.uncommon} cartas</p>
                              </div>
                            </div>
                          )}
                          {config.rare > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                              <div className="w-3 h-3 bg-blue-600 rounded-full" />
                              <div>
                                <p className="text-sm font-medium text-zinc-300">Raras</p>
                                <p className="text-xs text-zinc-500">{config.rare} cartas</p>
                              </div>
                            </div>
                          )}
                          {config.mythic > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                              <div className="w-3 h-3 bg-orange-600 rounded-full" />
                              <div>
                                <p className="text-sm font-medium text-zinc-300">Míticas</p>
                                <p className="text-xs text-zinc-500">{config.mythic} cartas</p>
                              </div>
                            </div>
                          )}
                          {config.foil > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                              <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
                              <div>
                                <p className="text-sm font-medium text-zinc-300">Foil</p>
                                <p className="text-xs text-zinc-500">{config.foil} cartas</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-sm text-zinc-500">
                            Total: <span className="font-bold text-zinc-300">{totalCards} cartas</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price and Purchase */}
                    <div className="border-t border-zinc-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-zinc-500">Precio</p>
                          <p className="text-3xl font-bold text-emerald-400">€{pack.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 mb-2">Cantidad</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-zinc-700 text-zinc-300"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                              -
                            </Button>
                            <span className="w-12 text-center font-semibold text-zinc-100">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-zinc-700 text-zinc-300"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <Button
                          className={`w-full ${getTypeColor(pack.type)} hover:opacity-90 transition-opacity duration-200`}
                          onClick={handleAddToCart}
                          disabled={isAddingToCart}
                        >
                          {isAddingToCart ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-transparent animate-spin rounded-full" />
                              <span className="ml-2">Añadiendo...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Añadir al Carrito
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tipo</span>
                    <Badge className={getTypeColor(pack.type)}>
                      {getTypeLabel(pack.type)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Cartas</span>
                    <span className="font-semibold text-zinc-100">{totalCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Rareza Máxima</span>
                    <span className="font-semibold text-orange-400">
                      {config?.mythic > 0 ? 'Mítica' : 'Rara'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Set Info */}
              {pack.card_set && (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      {pack.card_set.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Código</span>
                      <span className="font-mono text-zinc-100">{pack.card_set.code}</span>
                    </div>
                    {pack.card_set.released_at && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Lanzamiento</span>
                        <span className="text-zinc-100">
                          {new Date(pack.card_set.released_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Related Packs */}
              {relatedPacks.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                      <Package className="h-5 w-5 text-emerald-400" />
                      Packs Relacionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {relatedPacks.slice(0, 4).map((relatedPack) => (
                        <div
                          key={relatedPack.id}
                          className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors duration-200 cursor-pointer"
                          onClick={() => router.visit(route('pack.detail', relatedPack.card_set?.code || relatedPack.id))}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-200">{relatedPack.name}</p>
                            <p className="text-xs text-zinc-500">{relatedPack.card_set?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-400">€{relatedPack.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Zoom */}
      {zoomedCard && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedCard(null)}
        >
          <div
            className="max-w-md w-full h-auto object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedCard.image_uri}
              alt={zoomedCard.name}
              className="w-full h-full object-contain rounded-xl"
            />
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-zinc-100">{zoomedCard.name}</h3>
              <p className="text-sm text-zinc-400">{zoomedCard.rarity}</p>
            </div>
          </div>
        </div>
      )}
    </TiendaMagicLayout>
  );
}
