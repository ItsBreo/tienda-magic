import { useNavigate } from 'react-router-dom';
import { Flame, Crown, ShoppingBag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
            <div className="relative px-6 py-24 text-center">
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-500/10 rounded-full">
                            <Flame className="h-8 w-8 text-emerald-400 animate-pulse" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-zinc-100 via-emerald-400 to-zinc-100 bg-clip-text text-transparent">
                            Tienda Magic
                        </h1>
                        <div className="p-3 bg-emerald-500/10 rounded-full">
                            <Crown className="h-6 w-6 text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                        Hola {user?.name}, la tienda definitiva para coleccionistas de Magic: The Gathering.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-900/20 border border-emerald-500/50 transition-all duration-200 hover:scale-105"
                            onClick={() => navigate('/shop')}
                        >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Explorar Packs
                        </Button>
                        <Button
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200"
                            onClick={() => navigate('/cart')}
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Mi Carrito
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
