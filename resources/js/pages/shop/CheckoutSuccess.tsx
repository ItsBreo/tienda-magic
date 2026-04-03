import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, PackageOpen } from 'lucide-react';

export default function CheckoutSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Limpiar cualquier estado local del carrito
        localStorage.removeItem('cart');
        localStorage.removeItem('cartTimestamp');

        // Redirigir al inventario después de 3 segundos
        const timer = setTimeout(() => {
            navigate('/inventory');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    const sessionId = searchParams.get('session_id');

    return (
        <>
            <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center">
                <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

                <div className="max-w-md mx-auto p-8 text-center">
                    {/* Icono de éxito animado */}
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <CheckCircle className="w-20 h-20 text-emerald-500 animate-pulse" />
                            <div className="absolute inset-0 w-20 h-20 bg-emerald-500/20 rounded-full animate-ping" />
                        </div>
                    </div>

                    {/* Mensaje principal */}
                    <h1 className="text-3xl font-bold mb-4 text-emerald-400">
                        ¡Pago completado con éxito!
                    </h1>

                    <p className="text-zinc-400 mb-8 text-lg">
                        Preparando tu inventario...
                    </p>

                    {/* Indicador visual de progreso */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-3">
                            <PackageOpen className="w-5 h-5 text-emerald-500 animate-bounce" />
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75" />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                            </div>
                        </div>
                    </div>

                    {/* Información técnica */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6">
                        <p className="text-xs text-zinc-500 mb-2">
                            ID de Sesión:
                        </p>
                        <p className="text-sm font-mono text-zinc-300 break-all">
                            {sessionId || 'Procesando...'}
                        </p>
                    </div>

                    {/* Mensaje de redirección */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-sm text-emerald-400 flex items-center justify-center gap-2">
                            <span>Serás redirigido automáticamente a tu inventario</span>
                            <span className="animate-pulse">...</span>
                        </p>
                    </div>

                    {/* Botón manual por si el auto-redirect falla */}
                    <button
                        onClick={() => navigate('/inventory')}
                        className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(5,150,105,0.15)] active:scale-95"
                    >
                        Ir a mi Inventario
                    </button>
                </div>
            </div>
        </>
    );
}
