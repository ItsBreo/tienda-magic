import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, PackageOpen } from 'lucide-react';

export default function CheckoutSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Limpiar cualquier estado local del carrito
        localStorage.removeItem('cart');
        localStorage.removeItem('cartTimestamp');

        const verifyAndRedirect = async () => {
            if (sessionId) {
                try {
                    const apiService = (await import('../../services/ApiService')).default;
                    await apiService.axiosInstance.post('/api/checkout/verify', { session_id: sessionId });
                } catch (error) {
                    console.error('Error verifying Stripe session:', error);
                }
            }

            // Redirigir al inventario después de que se verifique (o con timeout como fallback)
            setTimeout(() => {
                navigate('/inventory');
            }, 3000);
        };

        verifyAndRedirect();

    }, [navigate, sessionId]);

    return (
        <>
            <div className="flex-1 flex flex-col justify-center items-center py-20">
                <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

                <div className="max-w-md mx-auto p-8 text-center">
                    {/* Icono de éxito animado */}
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <CheckCircle className="w-20 h-20 text-primary animate-pulse" />
                            <div className="absolute inset-0 w-20 h-20 bg-primary/20 rounded-full animate-ping" />
                        </div>
                    </div>

                    {/* Mensaje principal */}
                    <h1 className="text-3xl font-bold mb-4 text-primary">
                        ¡Pago completado con éxito!
                    </h1>

                    <p className="text-muted-foreground mb-8 text-lg">
                        Preparando tu inventario...
                    </p>

                    {/* Indicador visual de progreso */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-3">
                            <PackageOpen className="w-5 h-5 text-primary animate-bounce" />
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                            </div>
                        </div>
                    </div>

                    {/* Información técnica */}
                    <div className="bg-card border border-border rounded-xl p-4 mb-6">
                        <p className="text-xs text-muted-foreground mb-2">
                            ID de Sesión:
                        </p>
                        <p className="text-sm font-mono text-foreground break-all">
                            {sessionId || 'Procesando...'}
                        </p>
                    </div>

                    {/* Mensaje de redirección */}
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                        <p className="text-sm text-primary flex items-center justify-center gap-2">
                            <span>Serás redirigido automáticamente a tu inventario</span>
                            <span className="animate-pulse">...</span>
                        </p>
                    </div>

                    {/* Botón manual por si el auto-redirect falla */}
                    <button
                        onClick={() => navigate('/inventory')}
                        className="mt-6 w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(var(--primary),0.15)] active:scale-95"
                    >
                        Ir a mi Inventario
                    </button>
                </div>
            </div>
        </>
    );
}
