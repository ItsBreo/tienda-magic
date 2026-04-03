import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart, Package, Loader2, CreditCard, Wallet } from 'lucide-react';
import apiService from '@/services/ApiService';
import { useAuth } from '@/contexts/AuthContext';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';

export default function Cart() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'stripe'>('wallet');
    const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await apiService.axiosInstance.get('/api/cart');
            const cartData = response.data?.data?.items || response.data?.items || response.data || [];
            setItems(Array.isArray(cartData) ? cartData : []);
        } catch (error) {
            console.error('Error al cargar carrito:', error);
            if (showLoader) toast.error('Error al sincronizar el carrito');
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        if (updatingItems.has(itemId)) {
            return;
        }

        const currentItem = items.find((item) => item.id === itemId);
        if (!currentItem) {
            toast.error('Producto no encontrado en el carrito');
            return;
        }

        const stock = currentItem.stock || (currentItem.card?.stock) || 0;

        if (newQuantity < 1) {
            await handleRemoveItem(itemId);
            return;
        }

        if (newQuantity > stock) {
            toast.error(`Solo hay ${stock} unidades disponibles`);
            setItems([...items]);
            return;
        }

        setUpdatingItems(prev => new Set(prev).add(itemId));

        try {
            await apiService.updateCartItemQuantity(itemId, newQuantity, stock);
            await fetchCart(false);
            toast.success('Cantidad actualizada correctamente');
        } catch (error: any) {
            console.error('Error al actualizar cantidad:', error);

            if (error.response?.status === 422) {
                const backendMessage = error.response.data?.message ||
                                       error.response.data?.error ||
                                       'Límite de stock alcanzado para esta carta';
                toast.error(backendMessage);
                await fetchCart(false);
            } else if (error.message) {
                toast.error(error.message);
                await fetchCart(false);
            } else {
                toast.error('Error al actualizar la cantidad');
                await fetchCart(false);
            }
        } finally {
            setUpdatingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        try {
            await apiService.axiosInstance.delete(`/api/cart/${itemId}`);
            setItems(prevItems => prevItems.filter(item => item.id !== itemId));
            toast.success('Producto eliminado del carrito');
        } catch (error) {
            console.error('Error al eliminar item:', error);
            toast.error('Error al eliminar el producto');
        }
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            const price = item.booster_pack?.price || item.unit_price || 0;
            return total + (price * item.quantity);
        }, 0).toFixed(2);
    };

    const isWalletBalanceInsufficient = () => {
        const total = parseFloat(calculateTotal());
        return (user?.wallet_balance || 0) < total;
    };

    const hasStockIssues = () => {
        return items.some(item => {
            const stock = item.stock || (item.card?.stock) || 0;
            return item.quantity > stock;
        });
    };

    const mapItemsToPayload = () => {
        return items.map(item => {
            if (item.card_id) {
                return {
                    purchasable_type: 'App\\Models\\Card',
                    purchasable_id: item.card_id,
                    quantity: item.quantity
                };
            } else if (item.booster_pack_id) {
                return {
                    purchasable_type: 'App\\Models\\BoosterPack',
                    purchasable_id: item.booster_pack_id,
                    quantity: item.quantity
                };
            }
            return null;
        }).filter(Boolean);
    };

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
                items: mapItemsToPayload()
            };

            const response = await apiService.axiosInstance.post('/api/checkout/process', payload);

            if (paymentMethod === 'wallet') {
                toast.success('¡Pedido completado con tu billetera!');

                if (response.data?.total_amount !== undefined) {
                    const newBalance = (user?.wallet_balance || 0) - parseFloat(response.data.total_amount);
                    updateUser({ wallet_balance: newBalance });
                }

                setItems([]);
                navigate('/checkout/success');
            } else {
                if (response.data?.checkout_url) {
                    window.location.href = response.data.checkout_url;
                } else {
                    throw new Error('No se recibió URL de checkout de Stripe');
                }
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
            <div className="min-h-screen bg-black flex flex-col justify-center items-center">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-zinc-400">Cargando tu carrito...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-zinc-100 pb-20">
            <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

            <div className="max-w-6xl mx-auto px-4 pt-24">
                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    <ShoppingCart className="text-emerald-500" />
                    Tu Carrito de Compras
                </h1>

                <div className="flex items-center justify-between mb-8 text-sm">
                    <Link to="/shop" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                        ← Seguir explorando el catálogo
                    </Link>
                    <Link to="/dashboard" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                        Ir a mi Panel (Dashboard) →
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center max-w-2xl mx-auto mt-12">
                        <Package className="w-20 h-20 text-zinc-600 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
                        <p className="text-zinc-400 mb-8">Parece que aún no has añadido ningún sobre legendario a tu colección.</p>
                        <a href="/shop" className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all">
                            Explorar Tienda
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-4">
                            {items.map((item, index) => (
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
