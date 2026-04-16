import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Wallet, ArrowLeft, CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/ApiService';
import { formatEuro } from '@/utils/formatMoney';

const RECHARGE_AMOUNTS = [
    { amount: 5, label: '5€', bonus: '', description: 'Recarga básica' },
    { amount: 10, label: '10€', bonus: '', description: 'Recarga estándar' },
    { amount: 20, label: '20€', bonus: '+1€', description: 'Recarga con bonificación' },
    { amount: 50, label: '50€', bonus: '+5€', description: 'Super recarga con bonus' },
];

export default function WalletPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const toastShown = useRef(false);

    // Manejar el retorno de Stripe
    useEffect(() => {
        const status = searchParams.get('status');

        if (status && !toastShown.current) {
            toastShown.current = true;

            if (status === 'success') {
                toast.success('¡Recarga completada exitosamente!');
                // Refrescar datos del usuario para mostrar el nuevo saldo
                const refreshUserData = async () => {
                    try {
                        const userData = await apiService.checkAuth();
                        updateUser(userData);
                    } catch (error) {
                        console.error('Error al refrescar datos del usuario:', error);
                    }
                };
                refreshUserData();
            } else if (status === 'canceled') {
                toast.info('Recarga cancelada. Puedes intentarlo cuando quieras.');
            }

            // Limpiar URL usando navigate
            navigate('/wallet', { replace: true });
        }
    }, [searchParams.toString(), updateUser, navigate]);

    const handleRecharge = async (amount: number) => {
        if (!user) {
            toast.error('Debes iniciar sesión para recargar tu saldo');
            navigate('/login');
            return;
        }

        setSelectedAmount(amount);
        setLoading(true);

        try {
            const response = await apiService.rechargeWallet(amount);

            if (response.success && response.session_url) {
                // Redirigir a Stripe Checkout
                window.location.href = response.session_url;
            } else {
                toast.error('Error al generar la sesión de pago');
            }
        } catch (error: any) {
            console.error('Error en recarga:', error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error al procesar la recarga. Inténtalo nuevamente.');
            }
        } finally {
            setLoading(false);
            setSelectedAmount(null);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Wallet className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">Acceso Requerido</h2>
                    <p className="text-muted-foreground mb-6">Debes iniciar sesión para gestionar tu billetera</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-12">
            <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mb-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Dashboard
                        </button>

                        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                            Mi Billetera
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tu saldo y recarga créditos para comprar cartas
                        </p>
                    </div>

                    {/* Saldo Actual */}
                    <div className="bg-card border border-border rounded-2xl p-8 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm mb-1">Saldo Disponible</p>
                                <p className="text-4xl font-bold text-emerald-400">
                                    {formatEuro(user.wallet_balance)}
                                </p>
                            </div>
                            <Wallet className="w-16 h-16 text-emerald-400/20" />
                        </div>
                    </div>

                    {/* Opciones de Recarga */}
                    <div className="bg-card border border-border rounded-2xl p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                            <CreditCard className="h-6 w-6 mr-3 text-emerald-400" />
                            Recargar Saldo
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {RECHARGE_AMOUNTS.map((option) => (
                                <button
                                    key={option.amount}
                                    onClick={() => handleRecharge(option.amount)}
                                    disabled={loading}
                                    className={`
                                        relative p-6 rounded-xl border-2 transition-all duration-200
                                        ${selectedAmount === option.amount && loading
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-background hover:border-primary hover:bg-primary/10'
                                        }
                                        ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    {loading && selectedAmount === option.amount ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                                            <span className="text-muted-foreground">Procesando...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-foreground mb-1">
                                                {option.label}
                                            </div>
                                            {option.bonus && (
                                                <div className="text-sm text-primary font-semibold mb-2">
                                                    {option.bonus} BONUS
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground">
                                                {option.description}
                                            </div>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Información de Pago */}
                        <div className="border-t border-border pt-6">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-muted-foreground">
                                    <p className="mb-2">
                                        <strong>Pago Seguro:</strong> Todas las transacciones son procesadas
                                        de forma segura a través de Stripe.
                                    </p>
                                    <p>
                                        <strong>Recarga Instantánea:</strong> Tu saldo estará disponible
                                        inmediatamente después del pago.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historial de Transacciones */}
                    <div className="mt-8 bg-card border border-border rounded-2xl p-8">
                        <h3 className="text-xl font-semibold text-foreground mb-4">
                            Historial de Transacciones
                        </h3>
                        <p className="text-muted-foreground text-center py-8">
                            El historial detallado estará disponible próximamente.
                        </p>
                    </div>
                </div>
            </div>
    );
}
