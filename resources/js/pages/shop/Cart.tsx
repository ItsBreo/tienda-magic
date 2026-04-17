import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
 ShoppingCart, Package, Loader2, CreditCard, Wallet,
} from 'lucide-react';
import apiService from '@/services/ApiService';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';

export default function Cart() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const {
 items, loading, updateQuantity, removeItem, fetchCart,
} = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'stripe'>('wallet');
    const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        if (updatingItems.has(itemId)) {
            return;
        }

        const currentItem = items.find((item) => item.id === itemId);
        if (!currentItem) {
            toast.error('Producto no encontrado en el carrito');
            return;
        }

        const stock = currentItem.stock || currentItem.booster_pack?.stock || currentItem.card?.stock || 0;

        if (newQuantity < 1) {
            await handleRemoveItem(itemId);
            return;
        }

        if (newQuantity > stock) {
            toast.error(`Solo hay ${stock} unidades disponibles`);
            // The context will handle keeping the previous value if we don't call update
            return;
        }

        setUpdatingItems((prev) => new Set(prev).add(itemId));

        try {
            await updateQuantity(itemId, newQuantity);
            toast.success('Cantidad actualizada');
        } catch (error: any) {
            // Error handling is partly in context, but we can add specific page feedback
        } finally {
            setUpdatingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        try {
            await removeItem(itemId);
        } catch (error) {
            console.error('Error al eliminar item:', error);
        }
    };

    const calculateTotal = () => {
        const total = items.reduce((total, item) => {
            const price = item.booster_pack?.price || item.unit_price || 0;
            return total + (Number(price) * item.quantity);
        }, 0);
        return Number(total).toFixed(2);
    };

    const isWalletBalanceInsufficient = () => {
        const total = parseFloat(calculateTotal());
        return (user?.wallet_balance || 0) < total;
    };

    const hasStockIssues = () => items.some((item) => {
            const stock = item.stock || item.booster_pack?.stock || item.card?.stock || 0;
            console.log('Verificando stock para item:', item, 'Stock disponible:', stock);
            return item.quantity > stock;
        });

    const mapItemsToPayload = () => items.map((item) => {
            if (item.card_id) {
                return {
                    purchasable_type: 'App\\Models\\Card',
                    purchasable_id: item.card_id,
                    quantity: item.quantity,
                };
            } if (item.booster_pack_id) {
                return {
                    purchasable_type: 'App\\Models\\BoosterPack',
                    purchasable_id: item.booster_pack_id,
                    quantity: item.quantity,
                };
            }
            return null;
        }).filter(Boolean);

    const handleCheckout = async (paymentMethod: 'wallet' | 'stripe') => {
        if (items.length === 0) {
            toast.error('Tu carrito está vacío');
            return;
        }

        if (paymentMethod === 'wallet' && isWalletBalanceInsufficient()) {
            toast.error('Saldo insuficiente en la billetera');
            return;
        }

        setIsCheckingOut(true);

        try {
            const payload = {
                payment_method: paymentMethod,
                items: mapItemsToPayload(),
            };

            const response = await apiService.axiosInstance.post('/api/checkout/process', payload);

            if (paymentMethod === 'wallet') {
                toast.success('¡Pedido completado con tu billetera!');

                if (response.data?.total_amount !== undefined) {
                    const newBalance = (user?.wallet_balance || 0) - parseFloat(response.data.total_amount);
                    updateUser({ wallet_balance: newBalance });
                }

                await fetchCart();
                navigate('/checkout/success');
            } else if (response.data?.checkout_url) {
                    window.location.href = response.data.checkout_url;
                } else {
                    throw new Error('No se recibió URL de checkout de Stripe');
                }
        } catch (error: any) {
            console.error('Error en checkout:', error);
            if (error.response?.status === 422) {
                toast.error(error.response.data.message || 'Error en el proceso de compra');
            } else {
                toast.error('Error al procesar el pedido. Inténtalo nuevamente.');
            }
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center py-32">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-muted-foreground">Cargando tu carrito...</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

            <div className="max-w-6xl mx-auto px-4 pt-24">

                {/* Header Elegante sin iconos */}
                <div className="mb-6 border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-widest font-black text-primary">Proceso de Compra</span>
                        <h1 className="text-4xl md:text-5xl font-forum font-bold text-foreground">
                            Tu Carrito
                        </h1>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8 text-[11px] font-black uppercase tracking-widest">
                    <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                        ← Catálogo
                    </Link>
                    <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                        Dashboard →
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-2xl mx-auto mt-12">
                        <Package className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-4 text-foreground">Tu carrito está vacío</h2>
                        <p className="text-muted-foreground mb-8">Parece que aún no has añadido ningún artículo a tu carrito.</p>
                        <Link to="/shop" className="inline-flex items-center justify-center px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all">
                            Explorar Tienda
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-4">
                            {[...items].sort((a, b) => a.id - b.id).map((item, index) => (
                                <CartItem
                                    key={item.id || index}
                                    item={item}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onRemove={handleRemoveItem}
                                    isUpdating={updatingItems.has(item.id)}
                                />
                            ))}
                        </div>

                        <div className="lg:col-span-4">
                            <CartSummary
                                itemCount={items.length}
                                total={calculateTotal()}
                                selectedPaymentMethod={selectedPaymentMethod}
                                onPaymentMethodChange={setSelectedPaymentMethod}
                                onCheckout={handleCheckout}
                                isCheckingOut={isCheckingOut}
                                walletBalance={user?.wallet_balance || 0}
                                isWalletInsufficient={isWalletBalanceInsufficient()}
                                hasStockIssues={hasStockIssues()}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
