import { CreditCard, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { route } from 'ziggy-js';
import { usePage } from '@inertiajs/react';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CartItem {
  id: number;
  quantity: number;
  booster_pack: {
    id: number;
    name: string;
    price: number;
    type: string;
    card_set: {
      name: string;
    };
  };
}

interface CartData {
  id: number;
  items: CartItem[];
}

export default function Cart() {
  const { props } = usePage();
  const { cart, auth } = props as any;
  const [processing, setProcessing] = useState(false);

  const calculateTotal = () => {
    return cart.items.reduce((total: number, item: CartItem) => {
      return total + item.booster_pack.price * item.quantity;
    }, 0);
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    router.patch(
      route('cart.update', itemId),
      { quantity: newQuantity },
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  const removeItem = (itemId: number) => {
    router.delete(
      route('cart.destroy', itemId),
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  const proceedToCheckout = () => {
    setProcessing(true);
    router.visit(route('checkout.index'));
  };

  const canAfford = calculateTotal() <= Number(auth.user.wallet_balance ?? 0);

  return (
    <TiendaMagicLayout
      breadcrumbs={[
        { title: 'Tienda', href: route('shop.index') },
        { title: 'Carrito', href: route('cart.index') },
      ]}
    >
      <Head title="Carrito de Compras" />

      <div className="min-h-screen bg-black text-zinc-100 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-emerald-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Tu Carrito
                </h1>
                <p className="text-zinc-500">
                  {cart?.items?.length || 0} {(cart?.items?.length || 0) === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-zinc-500">Balance disponible</p>
              <p className="text-2xl font-bold text-emerald-400">
                €{Number(auth.user.wallet_balance ?? 0).toFixed(2)}
              </p>
            </div>
          </div>

          {(!cart?.items || cart.items.length === 0) ? (
            /* Empty Cart */
            <div className="text-center py-24 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
              <h3 className="text-xl font-medium text-zinc-200">
                Tu carrito está vacío
              </h3>
              <p className="text-zinc-500 mt-2">
                ¡Explora nuestro catálogo y añade algunos booster packs!
              </p>
              <Button
                className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold"
                onClick={() => router.visit(route('shop.index'))}
              >
                Explorar Catálogo
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart?.items?.map((item: CartItem) => (
                  <Card
                    key={item.id}
                    className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Imagen del pack */}
                        <div className="w-20 h-28 aspect-[2.5/3.5] object-contain rounded-lg overflow-hidden bg-zinc-800">
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-zinc-600" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                            {item.booster_pack.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge
                              className={`${
                                item.booster_pack.type === 'collector'
                                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {item.booster_pack.type}
                            </Badge>
                            <span className="text-sm text-zinc-500">
                              {item.booster_pack.card_set.name}
                            </span>
                          </div>
                          <div className="text-xl font-bold text-emerald-400">
                            €{item.booster_pack.price.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-zinc-800 rounded-lg">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-sm text-zinc-500">Subtotal</span>
                        <span className="font-semibold text-zinc-100">
                          €{(item.booster_pack.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Resumen del Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {cart?.items?.map((item: CartItem) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-zinc-400">
                            {item.quantity}
                            {' '}
                            x
                            {' '}
                            {item.booster_pack.name}
                          </span>
                          <span className="text-zinc-200">
                            €{(item.booster_pack.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-zinc-800" />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Subtotal</span>
                        <span className="text-zinc-200">
                          €{calculateTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">IVA (21%)</span>
                        <span className="text-zinc-200">
                          €{(calculateTotal() * 0.21).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Separator className="bg-zinc-800" />

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-zinc-100">Total</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        €{(calculateTotal() * 1.21).toFixed(2)}
                      </span>
                    </div>

                    {!canAfford && (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                        <p className="text-sm text-red-400">
                          Fondos insuficientes. Necesitas
                          {' '}
                          €{(calculateTotal() * 1.21 - Number(auth.user.wallet_balance ?? 0)).toFixed(2)}
                          {' '}
                          adicionales.
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-900/20 border border-emerald-500/50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={proceedToCheckout}
                      disabled={!canAfford || processing}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {processing ? 'Procesando...' : 'Proceder al Pago'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </TiendaMagicLayout>
  );
}
