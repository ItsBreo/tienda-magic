import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Wallet, ArrowLeft, CreditCard, Loader2, CheckCircle, Download, Calendar, History } from 'lucide-react';
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
                const refreshUserData = async () => {
                    try {
                        const userData = await apiService.checkAuth();
                        updateUser(userData);
                        fetchTransactions(); 
                    } catch (error) {
                        console.error('Error al refrescar datos del usuario:', error);
                    }
                };
                refreshUserData();
            } else if (status === 'canceled') {
                toast.info('Recarga cancelada. Puedes intentarlo cuando quieras.');
            }

            navigate('/wallet', { replace: true });
        }
    }, [searchParams.toString(), updateUser, navigate]);

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
            <div className="min-h-screen flex items-center justify-center p-6 text-foreground bg-background">
                <div className="text-center max-w-sm">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                        <Wallet className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-serif font-black mb-2 uppercase tracking-tight">Acceso Requerido</h2>
                    <p className="text-muted-foreground text-sm mb-8 font-medium">Debes iniciar sesión para gestionar tu billetera virtual y recargar oro.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/20"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-12 text-foreground bg-background">
            <div className="mx-auto max-w-4xl">
                    <div className="mb-10">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mb-6 flex items-center text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Dashboard
                        </button>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-serif font-black mb-2 uppercase tracking-tighter decoration-primary/20 underline underline-offset-8">
                                    Mi Billetera
                                </h1>
                                <p className="text-muted-foreground font-medium text-sm">
                                    Gestiona tu saldo de oro y descarga tus facturas de recarga.
                                </p>
                            </div>
                            
                            <button
                                onClick={handleDownloadPdf}
                                disabled={downloading || transactions.length === 0}
                                className="flex items-center justify-center px-6 py-3 bg-accent hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed text-foreground rounded-xl border border-border transition-all font-black text-xs uppercase tracking-widest"
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

                    <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-2 opacity-60">Saldo Disponible</p>
                                <p className="text-5xl font-serif font-black text-primary drop-shadow-sm">
                                    {formatEuro(user.wallet_balance)}
                                </p>
                            </div>
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                                <Wallet className="w-10 h-10 text-primary" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-xl font-serif font-black text-foreground mb-8 flex items-center uppercase tracking-wider">
                            <CreditCard className="h-5 w-5 mr-3 text-primary" />
                            Recargar Oro
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                            {RECHARGE_AMOUNTS.map((option) => (
                                <button
                                    key={option.amount}
                                    onClick={() => handleRecharge(option.amount)}
                                    disabled={loading}
                                    className={`
                                        relative p-6 rounded-2xl border-2 transition-all duration-300 group/btn
                                        ${selectedAmount === option.amount && loading
                                            ? 'border-primary bg-primary/5 grayscale opacity-50'
                                            : 'border-border bg-accent/30 hover:border-primary hover:translate-y-[-4px] hover:shadow-xl hover:shadow-primary/10'
                                        }
                                        ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    {loading && selectedAmount === option.amount ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">Procesando</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-3xl font-serif font-black text-foreground mb-1 group-hover/btn:text-primary transition-colors">
                                                {option.label}
                                            </div>
                                            {option.bonus && (
                                                <div className="inline-block text-[9px] font-black uppercase px-1.5 py-0.5 bg-primary text-primary-foreground rounded-sm mb-3 tracking-tighter">
                                                    {option.bonus} BONUS
                                                </div>
                                            )}
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">
                                                {option.description}
                                            </div>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-border pt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start space-x-4 p-4 bg-accent/20 rounded-xl border border-border/50">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-foreground mb-1">Pago Encriptado</p>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Procesado de forma segura mediante Stripe con encriptación AES-256.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 p-4 bg-accent/20 rounded-xl border border-border/50">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-foreground mb-1">Entrega Instantánea</p>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">El oro se añadirá a tu cuenta inmediatamente después de la confirmación.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-border bg-accent/10 flex items-center justify-between">
                            <h3 className="text-xl font-serif font-black text-foreground flex items-center uppercase tracking-widest">
                                <History className="w-5 h-5 mr-3 text-muted-foreground" />
                                Historial de Movimientos
                            </h3>
                            <button onClick={() => fetchTransactions()} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Refrescar</button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {transactionsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-accent/5">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sincronizando con el banco central...</p>
                                </div>
                            ) : transactions.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-accent/30 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                            <th className="px-8 py-5">Fecha de Operación</th>
                                            <th className="px-6 py-5">Descripción</th>
                                            <th className="px-6 py-5">Monto</th>
                                            <th className="px-8 py-5 text-right">Saldo Resultante</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {transactions.map((tx) => {
                                            const isPositive = Number(tx.amount) > 0;
                                            const badgeConfig: Record<string, { label: string; cls: string }> = {
                                                deposit:   { label: 'RECIBO', cls: 'bg-primary/10 text-primary border-primary/20' },
                                                purchase:  { label: 'COMPRA', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
                                                withdrawal:{ label: 'RETIRO', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
                                            };
                                            const badge = badgeConfig[tx.type] ?? { label: tx.type, cls: 'bg-muted text-muted-foreground border-border' };

                                            return (
                                            <tr key={tx.id} className="hover:bg-accent/20 transition-all group">
                                                <td className="px-8 py-4 text-[12px] font-bold text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-2 opacity-50" />
                                                        {formatDate(tx.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[13px] font-black text-foreground uppercase tracking-tight">{tx.description || 'Transacción del Sistema'}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border tracking-tighter ${badge.cls}`}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-sm font-black italic ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                                                    {isPositive ? '+' : '-'} {formatEuro(Math.abs(Number(tx.amount)))}
                                                </td>
                                                <td className="px-8 py-4 text-[13px] font-black text-foreground text-right tabular-nums">
                                                    {formatEuro(tx.balance_after)}
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-20 bg-accent/5 flex flex-col items-center gap-3">
                                    <History className="w-10 h-10 text-muted-foreground opacity-20" />
                                    <p className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-40 italic">Aún no has realizado movimientos.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="mt-8 text-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-40">
                        theGathering &copy; 2026 - Sistema de Billetera Virtual Certificado
                    </p>
                </div>
            </div>
    );
}
