import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart, Package, Loader2 } from 'lucide-react';
import apiService from '@/services/ApiService';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';

export default function Cart() {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await apiService.axiosInstance.get('/api/cart');
            const cartData = response.data?.data?.items || response.data?.items || response.data || [];
            setItems(Array.isArray(cartData) ? cartData : []);
        } catch (error) {
            console.error('Error al cargar carrito:', error);
            toast.error('Error al sincronizar el carrito');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            await apiService.axiosInstance.put(`/api/cart/${itemId}`, { quantity: newQuantity });

            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                )
            );

            // Bug 4 Fix: Add visual feedback for successful quantity update
            toast.success('Cantidad actualizada correctamente');
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            toast.error('Error al actualizar la cantidad');
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

    const handleCheckout = async () => {
        if (items.length === 0) {
            toast.error('Tu carrito está vacío');
            return;
        }

        setIsCheckingOut(true);

        try {
            const response = await apiService.axiosInstance.post('/api/checkout');

            toast.success('¡Pedido completado! (Modo Demo)');

            // Limpiar estado local
            setItems([]);

            // Redirigir a dashboard
            navigate('/dashboard');

        } catch (error: any) {
            console.error('Error en checkout:', error);
            toast.error(error.response?.data?.message || 'Error al procesar el pedido');
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
                                />
                            ))}
                        </div>

                        <div className="lg:col-span-4">
                            <CartSummary
                                itemCount={items.length}
                                total={calculateTotal()}
                                onCheckout={handleCheckout}
                                isCheckingOut={isCheckingOut}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
