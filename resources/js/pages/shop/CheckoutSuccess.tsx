import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, PackageOpen, ShieldCheck } from 'lucide-react';

export default function CheckoutSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Clear cart local state
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

            // Redirect to inventory after verify (or fallback)
            setTimeout(() => {
                navigate('/inventory');
            }, 5000);
        };

        verifyAndRedirect();
    }, [navigate, sessionId]);

    return (
        <div className="flex-1 flex flex-col justify-center items-center py-20 px-4 relative min-h-[80vh]">
            {/* Ambient background glow */}
            <div className="absolute inset-x-0 top-1/4 -z-10 flex justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="max-w-md w-full bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden group">
                {/* Decorative corner light */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-700" />
                
                {/* Success Icon Section */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative bg-primary/10 border border-primary/20 p-5 rounded-full">
                            <CheckCircle className="w-16 h-16 text-primary animate-in zoom-in duration-700 ease-out" />
                        </div>
                        <div className="absolute -inset-2 border border-primary/30 rounded-full animate-[ping_3s_infinite]" />
                    </div>
                </div>

                {/* Main Content */}
                <h1 className="text-3xl font-forum font-bold mb-4 text-foreground tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                    ¡Ritual de Compra Completado!
                </h1>

                <p className="text-muted-foreground mb-10 text-lg font-literata italic opacity-80 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    Invocando tus cartas al inventario...
                </p>

                {/* Progress Indicator */}
                <div className="mb-10 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center gap-4">
                    <PackageOpen className="w-6 h-6 text-primary animate-bounce shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse delay-100" />
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse delay-200" />
                    </div>
                </div>

                {/* Session Info */}
                <div className="mb-8 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1">Sello de Sesión</p>
                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/5 group/code">
                        <code className="text-xs font-mono text-primary/80 break-all leading-relaxed">
                            {sessionId || 'Procesando Sello de Seguridad...'}
                        </code>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Transacción Asegurada</span>
                    </div>
                </div>

                {/* Primary Action */}
                <button
                    onClick={() => navigate('/inventory')}
                    className="group relative w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] overflow-hidden"
                >
                    <span className="relative z-10">Ir a mi Inventario</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
                
                <p className="mt-6 text-[10px] text-muted-foreground/40 font-medium uppercase tracking-tighter">
                    Serás redirigido automáticamente en unos instantes
                </p>
            </div>
        </div>
    );
}
