import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { route } from 'ziggy-js';
import { usePage } from '@inertiajs/react';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
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

export default function Checkout() {
  const { props } = usePage();
  const { cart, subtotal, tax, total, stripe_key } = props as any;
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Enviar pago al backend
      router.post(route('checkout.process'), {
        total: total,
        payment_method: 'stripe',
      });
    } catch (error) {
      console.error('Payment error:', error);
      setProcessing(false);
    }
  };

  const handleWalletPayment = () => {
    setProcessing(true);
    router.post(route('checkout.process'), {
      total: total,
      payment_method: 'wallet',
    });
  };

  return (
    <TiendaMagicLayout
      breadcrumbs={[
        { title: 'Tienda', href: route('shop.index') },
        { title: 'Carrito', href: route('cart.index') },
        { title: 'Checkout', href: route('checkout.index') },
      ]}
    >
      <Head title="Checkout - Pago Seguro" />

      <div className="min-h-screen bg-black text-zinc-100 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent mb-2">
              Checkout Seguro
            </h1>
            <p className="text-zinc-500">
              Completa tu compra de forma segura y rápida
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cart.items.map((item: CartItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-zinc-100">
                            {item.quantity}
                            {' '}
                            x
                            {' '}
                            {item.booster_pack.name}
                          </h4>
                          <p className="text-sm text-zinc-500">
                            {item.booster_pack.card_set.name}
                            {' '}
                            •
                            {' '}
                            {item.booster_pack.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-400">
                            €{(item.booster_pack.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-zinc-800" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Subtotal</span>
                      <span className="text-zinc-200">€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">IVA (21%)</span>
                      <span className="text-zinc-200">€{tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="bg-zinc-800" />

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-zinc-100">Total</span>
                    <span className="text-3xl font-bold text-emerald-400">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <div className="lg:col-span-1">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Métodos de Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Wallet Payment */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-zinc-100 mb-3">
                      Pagar con Billetera
                    </h3>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-900/20 border border-emerald-500/50 transition-all duration-200 hover:scale-105"
                      onClick={handleWalletPayment}
                      disabled={processing}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {processing ? 'Procesando...' : 'Pagar con Fondos'}
                    </Button>
                    <p className="text-xs text-zinc-500 text-center">
                      Usa tu balance disponible para pagar instantáneamente
                    </p>
                  </div>

                  <Separator className="bg-zinc-800" />

                  {/* Stripe Payment */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-zinc-100 mb-3">
                      Pagar con Tarjeta
                    </h3>
                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <CreditCard className="h-12 w-12 text-zinc-600 mb-2 mx-auto" />
                          <p className="text-sm text-zinc-500">
                            Pasarela Stripe
                          </p>
                          <p className="text-xs text-zinc-600 mt-1">
                            Pago seguro con encriptación SSL
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 border border-blue-500/50 transition-all duration-200 hover:scale-105"
                      onClick={handlePayment}
                      disabled={processing}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {processing ? 'Procesando...' : 'Pagar con Stripe'}
                    </Button>
                    <p className="text-xs text-zinc-500 text-center">
                      Visa, Mastercard, American Express aceptadas
                    </p>
                  </div>

                  <Separator className="bg-zinc-800" />

                  {/* Security Badge */}
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs text-zinc-400">Pago Seguro</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back Button */}
              <Button
                variant="ghost"
                className="w-full mt-4 text-zinc-400 hover:text-zinc-200"
                onClick={() => router.visit(route('cart.index'))}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Carrito
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TiendaMagicLayout>
  );
}
