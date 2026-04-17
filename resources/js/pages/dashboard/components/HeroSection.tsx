import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="border-b border-border relative overflow-hidden">
            {/* Un pequeño toque visual sutil de fondo, como el reflejo foil de una carta oscura */}
            <div className="absolute top-0 right-0 -mt-32 -mr-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10">
                <div className="max-w-3xl">
                    

                    {/* font-serif da el toque inconfundible de libro de fantasía/Magic */}
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-5 leading-tight">
                        Saludos,
                    {' '}
                    {user?.name || 'Viajero'}
                    .
                    </h1>

                    <p className="text-lg text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                        El Multiverso te espera. Explora las últimas expansiones, amplía tu colección o abre los sobres que has adquirido en la tienda.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Botón Principal: Estilo "Rareza Mítica" (Naranja/Oro) */}
                        <Button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 rounded-sm font-semibold px-6 py-6 text-md transition-colors"
                            onClick={() => navigate('/shop')}
                        >
                            <ShoppingBag className="h-5 w-5 mr-2" />
                            Explorar la Tienda
                        </Button>

                        {/* Botón Secundario: Estilo "Infrecuente" (Plata/Zinc) */}
                        <Button
                            className="bg-background text-foreground border border-border hover:bg-accent hover:text-accent-foreground rounded-sm font-semibold px-6 py-6 text-md transition-colors"
                            onClick={() => navigate('/inventory')}
                        >
                            <Sparkles className="h-5 w-5 mr-2" />
                            Mi Colección
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
