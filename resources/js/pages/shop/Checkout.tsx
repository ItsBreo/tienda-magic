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

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState('wallet');

    const subtotal = cartItems.reduce((sum, item) => {
        const price = item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0;
        return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setPaymentMethod(e.target.value);
    };

    const handlePayment = async () => {
        if (cartItems.length === 0) return;

        setProcessing(true);
        setError(null);

        try {
            await apiService.processCheckout({ payment_method: paymentMethod });
            setCartItems([]);
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 422) {
                const validationErrors = err.response.data.errors;
                const firstError = Object.values(validationErrors)[0] as string[];
                setError(firstError[0] || 'Error de validación');
            } else {
                setError(err.response?.data?.message || 'Error al procesar el pago. Inténtalo nuevamente.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <TiendaMagicLayout>
            <div className="px-6 py-12 text-zinc-100">
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

                    <h1 className="text-4xl font-serif font-bold mb-8 border-b border-zinc-800 pb-4 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                        Finalizar Compra
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Order Summary */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl">Resumen del Pedido</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {cartItems.length === 0 ? (
                                        <p className="text-zinc-400 text-center py-8">No hay artículos en tu carrito.</p>
                                    ) : (
                                        cartItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-4 border-b border-zinc-800 last:border-0">
                                                <div className="flex gap-4 items-center">
                                                    {item.card?.image_uri && (
                                                        <img src={item.card.image_uri} alt={item.card.name} className="w-12 h-16 object-cover rounded shadow-lg" />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-zinc-100">
                                                            {item.booster_pack_id ? item.booster_pack?.name : item.card?.name}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 uppercase tracking-wider">
                                                            {item.booster_pack_id ? item.booster_pack?.card_set?.name : `Rareza: ${item.card?.rarity}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-zinc-400">
                                                        €{Number(item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0).toFixed(2)} × {item.quantity}
                                                    </p>
                                                    <p className="font-bold text-emerald-400">
                                                        €{(Number(item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0) * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Selection & Summary */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden">
                                <CardHeader className="bg-emerald-600/10 border-b border-emerald-600/20">
                                    <CardTitle className="flex items-center gap-2 text-emerald-400">
                                        <CreditCard className="h-5 w-5" />
                                        Método de Pago
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="p-4 bg-emerald-600/5 border border-emerald-600/20 rounded-xl">
                                        <p className="text-emerald-400 font-medium mb-1 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                            Billetera Virtual
                                        </p>
                                        <p className="text-zinc-500 text-xs">
                                            El importe se descontará de tu saldo actual de forma instantánea.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Subtotal</span>
                                            <span>€{Number(subtotal).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-400">
                                            <span>IVA (21%)</span>
                                            <span>€{Number(tax).toFixed(2)}</span>
                                        </div>
                                        <Separator className="bg-zinc-800" />
                                        <div className="flex justify-between text-xl font-bold">
                                            <span className="text-zinc-100">Total</span>
                                            <span className="text-emerald-400">€{Number(total).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-900/30 border border-red-900/50 rounded-lg">
                                            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                                        onClick={handlePayment}
                                        disabled={processing || cartItems.length === 0}
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Procesando...
                                            </span>
                                        ) : 'Finalizar y Pagar'}
                                    </Button>

                                    <p className="text-zinc-500 text-[10px] text-center leading-relaxed">
                                        Al hacer clic en "Finalizar y Pagar", aceptas nuestros términos de servicio y la política de devoluciones de productos digitales.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </TiendaMagicLayout>
    );
}
