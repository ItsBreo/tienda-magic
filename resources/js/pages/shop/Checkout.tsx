import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import TiendaMagicLayout from '@/layouts/TiendaLayout';
import { Button } from '@/components/ui/button';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiService } from '@/services/ApiService';

interface CartItem {
    id: number;
    quantity: number;
    booster_pack_id?: number;
    card_id?: number;
    booster_pack?: {
        id: number;
        name: string;
        price: number;
        type: string;
        card_set: {
            name: string;
        };
    };
    card?: {
        id: number;
        name: string;
        market_avg_price: number;
        rarity: string;
        image_uri?: string;
    };
}

export default function Checkout() {
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const subtotal = cartItems.reduce((sum, item) => {
        const price = item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0;
        return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    const handlePayment = async () => {
        if (cartItems.length === 0) return;

        setProcessing(true);
        setError(null);

        try {
            await apiService.processCheckout();
            setCartItems([]);
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 422) {
                setError(err.response.data.message || 'Error en el checkout');
            } else {
                setError('Error al procesar el pago. Inténtalo nuevamente.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <TiendaMagicLayout>
            <div className="px-6 py-12">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/cart')}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Carrito
                        </Button>
                    </div>

                    <h1 className="text-3xl font-serif font-bold text-zinc-100 mb-8 border-b border-zinc-800 pb-4">
                        Finalizar Compra
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Order Summary */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resumen del Pedido</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {cartItems.length === 0 ? (
                                        <p className="text-zinc-400 text-center py-8">No hay artículos en tu carrito.</p>
                                    ) : (
                                        cartItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-3 border-b border-zinc-700">
                                                <div>
                                                    <p className="font-medium text-zinc-100">
                                                        {item.booster_pack_id ? item.booster_pack?.name : item.card?.name}
                                                    </p>
                                                    <p className="text-sm text-zinc-400">
                                                        {item.booster_pack_id ? item.booster_pack?.card_set?.name : `Rarity: ${item.card?.rarity}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-zinc-400">
                                                        €
                                                        {(item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0).toFixed(2)}
                                                        {' '}
                                                        ×
                                                        {item.quantity}
                                                    </p>
                                                    <p className="font-medium text-zinc-100">
                                                        €
                                                        {((item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0) * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Form */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        <CreditCard className="h-5 w-5 mr-2" />
                                        Información de Pago
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div>
                                            <label htmlFor="card-name" className="block text-sm font-medium text-zinc-100 mb-1">
                                                Nombre en la tarjeta
                                            </label>
                                            <input
                                                id="card-name"
                                                type="text"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100"
                                                placeholder="Juan Pérez"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="card-number" className="block text-sm font-medium text-zinc-100 mb-1">
                                                Número de tarjeta
                                            </label>
                                            <input
                                                id="card-number"
                                                type="text"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100"
                                                placeholder="1234 5678 9012 3456"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="card-expiry" className="block text-sm font-medium text-zinc-100 mb-1">
                                                Fecha de expiración
                                            </label>
                                            <input
                                                id="card-expiry"
                                                type="text"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100"
                                                placeholder="MM/AA"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="card-cvv" className="block text-sm font-medium text-zinc-100 mb-1">
                                                CVV
                                            </label>
                                            <input
                                                id="card-cvv"
                                                type="text"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100"
                                                placeholder="123"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>
                                                €
                                                {subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Impuestos (21%)</span>
                                            <span>
                                                €
                                                {tax.toFixed(2)}
                                            </span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Total</span>
                                            <span className="text-emerald-400">
                                                €
                                                {total.toFixed(2)}
                                            </span>
                                        </div>
                                        {error && (
                                            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-md">
                                                <p className="text-red-200">{error}</p>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                                        onClick={handlePayment}
                                        disabled={processing || cartItems.length === 0}
                                    >
                                        {processing ? 'Procesando Pago...' : 'Confirmar Pago'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </TiendaMagicLayout>
    );
}
