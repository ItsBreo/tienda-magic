import {
    CreditCard, Minus, Plus, ShoppingBag, Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TiendaMagicLayout from '@/layouts/TiendaLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

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

export default function Cart() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    useEffect(() => {
        // TODO: Fetch cart items from API
        setCartItems([]);
    }, []);

    const calculateTotal = () => cartItems.reduce((total: number, item: CartItem) => total + item.booster_pack.price * item.quantity, 0);

    const updateQuantity = (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)));
        // TODO: Update cart via API
    };

    const removeItem = (itemId: number) => {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        // TODO: Remove from cart via API
    };

    const proceedToCheckout = () => {
        setProcessing(true);
        navigate('/checkout');
    };

    const canAfford = calculateTotal() <= Number(user?.wallet_balance ?? 0);

    return (
        <TiendaMagicLayout>
            <div className="px-6 py-12">
                <div className="mx-auto max-w-4xl">
                    <h1 className="text-3xl font-serif font-bold text-zinc-100 mb-8 border-b border-zinc-800 pb-4">
                        Carrito de Compras
                    </h1>

                    {cartItems.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <ShoppingBag className="mx-auto h-16 w-16 text-zinc-400 mb-4" />
                                <h2 className="text-xl font-semibold text-zinc-100 mb-2">Tu carrito está vacío</h2>
                                <p className="text-zinc-400 mb-6">Parece que aún no has añadido ningún sobre a tu carrito.</p>
                                <Button onClick={() => navigate('/shop')} className="bg-emerald-600 hover:bg-emerald-700">
                                    Explorar Tienda
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {cartItems.map((item) => (
                                    <Card key={item.id} className="p-6">
                                        <CardContent className="p-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                                                        {item.booster_pack.name}
                                                    </h3>
                                                    <p className="text-sm text-zinc-400 mb-4">
                                                        {item.booster_pack.card_set.name}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            disabled={processing}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-12 text-center font-medium text-zinc-100">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            disabled={processing}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removeItem(item.id)}
                                                            disabled={processing}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-zinc-400">Precio unitario</p>
                                                    <p className="text-lg font-semibold text-zinc-100">
                                                        €
                                                        {item.booster_pack.price.toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-zinc-400">Total</p>
                                                    <p className="text-xl font-bold text-emerald-400">
                                                        €
                                                        {(item.booster_pack.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <Card className="sticky top-6">
                                    <CardHeader>
                                        <CardTitle>Resumen del Pedido</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>
                                                €
                                                {calculateTotal().toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Envío</span>
                                            <span>Gratis</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Total</span>
                                            <span className="text-emerald-400">
                                                €
                                                {calculateTotal().toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 pt-4">
                                            <p className="text-sm text-zinc-400">
                                                Saldo disponible:
                                                {' '}
                                                <span className="text-zinc-100">
                                                    €
                                                    {Number(user?.wallet_balance ?? 0).toFixed(2)}
                                                </span>
                                            </p>
                                            <Button
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                                                onClick={proceedToCheckout}
                                                disabled={!canAfford || processing}
                                            >
                                                {processing ? 'Procesando...' : 'Proceder al Pago'}
                                            </Button>
                                            {!canAfford && (
                                                <p className="text-sm text-amber-400 mt-2">
                                                    No tienes saldo suficiente para completar esta compra.
                                                </p>
                                            )}
                                        </div>
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
