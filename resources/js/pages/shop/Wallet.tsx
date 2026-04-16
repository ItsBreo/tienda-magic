import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Wallet, ArrowLeft, CreditCard, Loader2, CheckCircle, XCircle, Download, Calendar, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/ApiService';
import { formatEuro } from '@/utils/formatMoney';
import { formatDate } from '@/utils/formatDate';

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
    const [transactions, setTransactions] = useState<any[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const toastShown = useRef(false);

    // Cargar transacciones
    const fetchTransactions = async (page = 1) => {
        if (!user) return;
        setTransactionsLoading(true);
        try {
            const response = await apiService.getWalletTransactions(page);
            setTransactions(response.transactions.data || []);
        } catch (error) {
            console.error('Error al cargar transacciones:', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

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
                        fetchTransactions(); // Recargar transacciones también
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

    // Cargar transacciones al inicio
    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user?.id]);

    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            const blob = await apiService.downloadWalletTransactionsPdf();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `historial_billetera_${user?.username}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Descargando historial...');
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            toast.error('No se pudo generar el PDF. Inténtalo de nuevo.');
        } finally {
            setDownloading(false);
        }
    };

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
                    <h2 className="text-xl font-semibold text-zinc-100 mb-2">Acceso Requerido</h2>
                    <p className="text-zinc-400 mb-6">Debes iniciar sesión para gestionar tu billetera</p>
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
                            className="mb-4 flex items-center text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Dashboard
                        </button>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-zinc-100 mb-2">
                                    Mi Billetera
                                </h1>
                                <p className="text-zinc-400">
                                    Gestiona tu saldo y recarga créditos para comprar cartas
                                </p>
                            </div>
                            
                            <button
                                onClick={handleDownloadPdf}
                                disabled={downloading || transactions.length === 0}
                                className="flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 rounded-lg border border-zinc-700 transition-all font-medium"
                            >
                                {downloading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Descargar Historial (PDF)
                            </button>
                        </div>
                    </div>

                    {/* Saldo Actual */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-400 text-sm mb-1">Saldo Disponible</p>
                                <p className="text-4xl font-bold text-emerald-400">
                                    {formatEuro(user.wallet_balance)}
                                </p>
                            </div>
                            <Wallet className="w-16 h-16 text-emerald-400/20" />
                        </div>
                    </div>

                    {/* Opciones de Recarga */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                        <h2 className="text-2xl font-semibold text-zinc-100 mb-6 flex items-center">
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
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-zinc-700 bg-zinc-800/50 hover:border-emerald-600 hover:bg-emerald-600/10'
                                        }
                                        ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    {loading && selectedAmount === option.amount ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                                            <span className="text-zinc-400">Procesando...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-zinc-100 mb-1">
                                                {option.label}
                                            </div>
                                            {option.bonus && (
                                                <div className="text-sm text-emerald-400 font-semibold mb-2">
                                                    {option.bonus} BONUS
                                                </div>
                                            )}
                                            <div className="text-xs text-zinc-400">
                                                {option.description}
                                            </div>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Información de Pago */}
                        <div className="border-t border-zinc-700 pt-6">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-zinc-300">
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
                    <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="p-8 border-b border-zinc-800">
                            <h3 className="text-xl font-semibold text-zinc-100 flex items-center">
                                <History className="w-5 h-5 mr-3 text-zinc-400" />
                                Historial de Transacciones
                            </h3>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {transactionsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-zinc-500 animate-spin mb-4" />
                                    <p className="text-zinc-400">Cargando transacciones...</p>
                                </div>
                            ) : transactions.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-zinc-800/30 text-zinc-400 text-xs uppercase tracking-wider">
                                            <th className="px-8 py-4 font-medium">Fecha</th>
                                            <th className="px-6 py-4 font-medium">Descripción</th>
                                            <th className="px-6 py-4 font-medium">Monto</th>
                                            <th className="px-8 py-4 font-medium text-right">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-zinc-800/20 transition-colors">
                                                <td className="px-8 py-4 text-sm text-zinc-400">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-2 opacity-50" />
                                                        {formatDate(tx.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-100">
                                                    {tx.description || 'Transacción'}
                                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                                        tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                        {tx.type === 'deposit' ? 'Entrada' : 'Gasto'}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-sm font-bold ${
                                                    tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                    {tx.type === 'deposit' ? '+' : '-'}{formatEuro(tx.amount)}
                                                </td>
                                                <td className="px-8 py-4 text-sm font-medium text-zinc-100 text-right">
                                                    {formatEuro(tx.balance_after)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-zinc-500 italic">No se han encontrado movimientos en tu billetera.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
    );
}
