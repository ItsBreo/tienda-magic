import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
 CreditCard, ArrowLeft, Loader2, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
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
    const [loading, setLoading] = useState(true);

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState('wallet');

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const resp = await apiService.getCart();
            setCartItems(resp.items || []);
        } catch (err) {
            toast.error('Error al cargar el carrito');
        } finally {
            setLoading(false);
        }
    };

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
            await apiService.processCheckout({ payment_method: paymentMethod });
            toast.success('¡Compra realizada con éxito!');
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 422) {
                const validationErrors = err.response.data.errors;
                const firstError = Object.values(validationErrors)[0] as string[];
                setError(firstError[0] || 'Error de validación');
                toast.error(firstError[0] || 'Error de validación');
            } else {
                const msg = err.response?.data?.message || 'Error al procesar el pago. Inténtalo nuevamente.';
                setError(msg);
                toast.error(msg);
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
return (
         TiendaMagicLayout({ children: <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> })
    );
}

    return (
        <TiendaMagicLayout>
            <div className="px-6 py-12 text-foreground">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/cart')}
                            className="bg-accent border-border text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Carrito
                        </Button>
                    </div>

                    <h1 className="text-4xl font-serif font-black mb-10 border-b border-border pb-6 bg-gradient-to-r from-primary to-primary/40 bg-clip-text text-transparent">
                        Finalizar Compra
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Order Summary */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-card border-border shadow-2xl">
                                <CardHeader className="border-b border-border/50">
                                    <CardTitle className="text-xl font-bold font-serif">Resumen del Pedido</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {cartItems.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center opacity-20">
                                                <CreditCard className="w-8 h-8" />
                                            </div>
                                            <p className="text-muted-foreground">No hay artículos en tu carrito.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/50">
                                            {cartItems.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center p-5 hover:bg-accent/30 transition-colors">
                                                    <div className="flex gap-4 items-center min-w-0">
                                                        <div className="w-14 h-20 bg-accent rounded-md border border-border shadow-md overflow-hidden shrink-0">
                                                            {item.card?.image_uri ? (
                                                                <img src={item.card.image_uri} alt={item.card.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase opacity-20">Pack</div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-foreground truncate">
                                                                {item.booster_pack_id ? item.booster_pack?.name : item.card?.name}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 truncate">
                                                                {item.booster_pack_id ? item.booster_pack?.card_set?.name : `Rareza: ${item.card?.rarity}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right pl-4">
                                                        <p className="text-[11px] text-muted-foreground font-bold">
                                                            €
{Number(item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0).toFixed(2)}
{' '}
×
{' '}
{item.quantity}
                                                        </p>
                                                        <p className="font-black text-primary text-lg">
                                                            €
{(Number(item.booster_pack_id ? item.booster_pack?.price || 0 : item.card?.market_avg_price || 0) * item.quantity).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Selection & Summary */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="bg-card border-border shadow-2xl overflow-hidden sticky top-24">
                                <CardHeader className="bg-primary/10 border-b border-primary/20">
                                    <CardTitle className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
                                        <CreditCard className="h-4 w-4" />
                                        Método de Pago
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-8">
                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                <Wallet className="w-4 h-4" />
                                            </div>
                                            <p className="text-primary font-bold text-sm flex items-center gap-2">
                                                Billetera Virtual
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            </p>
                                        </div>
                                        <p className="text-muted-foreground text-[11px] font-medium leading-relaxed">
                                            El importe se descontará de tu saldo de oro actual de forma segura e instantánea.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-tight">
                                            <span>Subtotal</span>
                                            <span className="text-foreground">
€
{Number(subtotal).toFixed(2)}
</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-tight">
                                            <span>IVA (21%)</span>
                                            <span className="text-foreground">
€
{Number(tax).toFixed(2)}
</span>
                                        </div>
                                        <Separator className="bg-border/50" />
                                        <div className="flex justify-between items-end pt-2">
                                            <span className="text-foreground font-serif font-black text-lg">Total</span>
                                            <div className="text-right">
                                                <span className="text-3xl font-black text-primary leading-none block">
€
{Number(total).toFixed(2)}
</span>
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-60">Impuestos incl.</span>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in shake-in-1 duration-300">
                                            <p className="text-destructive text-xs text-center font-black uppercase tracking-tight">{error}</p>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-14 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                                        onClick={handlePayment}
                                        disabled={processing || cartItems.length === 0}
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Procesando...
                                            </span>
                                        ) : 'Finalizar y Pagar'}
                                    </Button>

                                    <div className="flex items-start gap-2 opacity-40 hover:opacity-100 transition-opacity">
                                        <div className="w-4 h-4 shrink-0 bg-primary/20 rounded-full flex items-center justify-center text-[10px] font-bold text-primary">i</div>
                                        <p className="text-muted-foreground text-[9px] font-medium leading-normal">
                                            Al confirmar el pago, aceptas que los bienes digitales no son reembolsables una vez abiertos o añadidos a la colección.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </TiendaMagicLayout>
    );
}
