import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, ArrowRight, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CartItem from './CartItem';

export default function CartDrawer() {
    const { items, loading, isDrawerOpen, setDrawerOpen, totalAmount, updateQuantity, removeItem } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        setDrawerOpen(false);
        navigate('/cart');
    };

    return (
        <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100 p-0">
                <SheetHeader className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <ShoppingCart className="w-6 h-6 text-emerald-500" />
                            Tu Carrito
                        </SheetTitle>
                        <SheetDescription className="sr-only">
                            Revisa y gestiona los artículos en tu carrito de compra.
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-zinc-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-zinc-300">Tu carrito está vacío</h3>
                                <p className="text-sm text-zinc-500 mt-1">¡Explora la tienda y añade algunos sobres!</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => setDrawerOpen(false)}
                            >
                                Continuar Comprando
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <CartItem 
                                            item={item} 
                                            onUpdateQuantity={updateQuantity} 
                                            onRemove={removeItem}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <SheetFooter className="p-6 border-t border-zinc-800 flex-col sm:flex-col gap-4 bg-zinc-900/30">
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-sm text-zinc-400">
                                <span>Subtotal</span>
                                <span>{totalAmount.toFixed(2)}€</span>
                            </div>
                            <Separator className="bg-zinc-800" />
                            <div className="flex justify-between text-lg font-bold text-zinc-100">
                                <span>Total</span>
                                <span className="text-emerald-400">{totalAmount.toFixed(2)}€</span>
                            </div>
                        </div>
                        
                        <div className="w-full grid grid-cols-2 gap-3">
                            <Button 
                                variant="outline" 
                                className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
                                onClick={() => {
                                    setDrawerOpen(false);
                                    navigate('/cart');
                                }}
                            >
                                Ver Carrito
                            </Button>
                            <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                onClick={handleCheckout}
                            >
                                Pagar Ahora
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-center text-zinc-500 mt-2">
                            Envío gratis en pedidos superiores a 50€
                        </p>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
