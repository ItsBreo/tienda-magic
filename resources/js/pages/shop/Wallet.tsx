import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Wallet, CreditCard,
    Loader2, CheckCircle, Download,
    Calendar, History, ShieldCheck,
    Coins, Zap, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/ApiService';
import { formatEuro } from '@/utils/formatMoney';
import { formatDate } from '@/utils/formatDate';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const RECHARGE_AMOUNTS = [
    {
 amount: 5, label: '5€', bonus: '', description: 'Ofrenda Menor',
},
    {
 amount: 10, label: '10€', bonus: '', description: 'Tesorillo Estándar',
},
    {
 amount: 20, label: '20€', bonus: '+1€', description: 'Bolsa del Viajero',
},
    {
 amount: 50, label: '50€', bonus: '+5€', description: 'Cofre del Planeswalker',
},
];

export default function WalletPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [downloading, setDownloading] = useState(false);
    const toastShown = useRef(false);

    // Cargar transacciones
    const fetchTransactions = async (page = 1) => {
        if (!user) return;
        setTransactionsLoading(true);
        try {
            const response = await apiService.getWalletTransactions(page);
            setTransactions(response.transactions.data || []);
            setCurrentPage(response.transactions.current_page || 1);
            setLastPage(response.transactions.last_page || 1);
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
                toast.success('¡Riquezas añadidas a tu cuenta!', {
                    description: 'Tu saldo de oro ha sido actualizado correctamente.',
                });
                const refreshUserData = async () => {
                    try {
                        const userData = await apiService.checkAuth();
                        updateUser(userData);
                        fetchTransactions();
                    } catch (error) { console.error(error); }
                };
                refreshUserData();
            } else if (status === 'canceled') {
                toast.info('Recarga cancelada. El oro sigue en el cofre.');
            }
            navigate('/wallet', { replace: true });
        }
    }, [searchParams.toString()]);

    useEffect(() => {
        if (user) fetchTransactions(currentPage);
    }, [user?.id, currentPage]);

    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            const blob = await apiService.downloadWalletTransactionsPdf();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `registro_oro_${user?.username}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Registro de transacciones descargado');
        } catch (error) {
            toast.error('No se pudo generar el pergamino de transacciones');
        } finally {
            setDownloading(false);
        }
    };

    const handleRecharge = async (amount: number) => {
        if (!user) {
            toast.error('Debes identificarte para gestionar tu oro');
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
                toast.error('Error al conectar con la bóveda de Stripe');
            }
        } catch (error: any) {
            toast.error('Error al procesar la transferencia de oro');
        } finally {
            setLoading(false);
            setSelectedAmount(null);
        }
    };

    if (!user) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <div className="text-center max-w-sm animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-card/40 backdrop-blur-md border border-border rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <Wallet className="w-12 h-12 text-muted-foreground/30" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-montserrat font-black mb-4 uppercase tracking-tighter">Bóveda Privada</h2>
                    <p className="text-muted-foreground text-sm mb-10 font-literata italic">Identifícate con tu chispa de Planeswalker para gestionar tu fortuna.</p>
                    <Button onClick={() => navigate('/login')} className="w-full h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                        Entrar al Sistema
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 text-foreground pb-20 font-literata">

            <main className="max-w-7xl mx-auto px-4 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* LEFT COLUMN: BALANCE */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* PREMIUM BALANCE CARD */}
                        <div className="relative bg-card/40 backdrop-blur-md border border-border rounded-xl p-8 shadow-2xl overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform group-hover:scale-110" />
                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Tesoro Disponible</h2>
                                    <div className="p-3 bg-primary/10 rounded-xl shadow-inner border border-primary/5">
                                        <Wallet className="h-6 w-6 text-primary" strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-6xl md:text-7xl font-forum font-bold text-foreground tracking-tighter block mb-1">
                                        {formatEuro(user.wallet_balance)}
                                    </span>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                         <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/10 text-[8px] font-black uppercase tracking-widest gap-1 py-1 px-3">
                                             <ShieldCheck size={10} />
{' '}
Transacciones seguras
</Badge>
                                         <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[8px] font-black uppercase tracking-widest gap-1 py-1 px-3">
                                             <Zap size={10} className="fill-current" />
{' '}
Entrega Instantánea
</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-accent/10 border border-border/40 rounded-xl space-y-4">
                             <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"><CheckCircle className="h-4 w-4 text-primary" /></div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Sello de Bóveda</p>
                             </div>
                             <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                                 Todas las transmisiones de oro son registradas permanentemente en el Archivo del Multiverso. Tu seguridad es nuestra prioridad mágica.
                             </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RECHARGE & HISTORY */}
                    <div className="lg:col-span-8 space-y-12">

                         {/* RECHARGE SECTION AT THE TOP OF THIS COLUMN */}
                         <section className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-primary/10 rounded-xl"><Coins className="w-6 h-6 text-primary" /></div>
                                     <div>
                                         <h2 className="text-2xl font-montserrat font-black text-foreground uppercase tracking-tight">Infusión de Oro</h2>
                                         <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Aumenta tus riquezas de Planeswalker</p>
                                     </div>
                                 </div>
                                 <Badge variant="outline" className="h-10 px-4 py-0 bg-accent/20 border-border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 self-start md:self-center">
                                     <ShieldCheck size={14} className="text-emerald-500" />
{' '}
Transacciones Encriptadas
</Badge>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 {RECHARGE_AMOUNTS.map((option) => (
                                     <button
                                         key={option.amount}
                                         onClick={() => handleRecharge(option.amount)}
                                         disabled={loading}
                                         className={cn(
                                             'relative flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-card/20 backdrop-blur-md transition-all duration-300 group overflow-hidden shadow-sm',
                                             loading ? 'opacity-30 cursor-not-allowed' : 'hover:border-primary hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1',
                                         )}
                                     >
                                         {loading && selectedAmount === option.amount ? (
                                             <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                         ) : (
                                             <>
                                                 <span className="text-4xl font-forum font-bold text-foreground group-hover:text-primary transition-colors text-center block mb-1">
                                                     {option.label}
                                                 </span>
                                                 {option.bonus && (
                                                     <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 mb-2">
                                                         {option.bonus}
{' '}
BONUS
</Badge>
                                                 )}
                                                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center opacity-60 group-hover:opacity-100 transition-opacity">
                                                     {option.description}
                                                 </span>
                                             </>
                                         )}
                                     </button>
                                 ))}
                             </div>
                         </section>

                         {/* HISTORY SECTION BELOW RECHARGE */}
                         <section className="space-y-6 pt-4">
                             <div className="flex items-center justify-between border-b border-border pb-4">
                                 <div className="flex items-center gap-3">
                                     <History className="w-6 h-6 text-primary" />
                                     <h2 className="text-2xl font-montserrat font-black text-foreground uppercase tracking-tight">Registro de Movimientos</h2>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadPdf}
                                        disabled={downloading || transactions.length === 0}
                                        className="h-9 px-4 text-[9px] font-black uppercase tracking-widest gap-2 bg-background border-border shadow-sm"
                                     >
                                        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                        Exportar Registro
                                     </Button>
                                     <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => fetchTransactions()}
                                        disabled={transactionsLoading}
                                        className="h-9 w-9 shadow-sm"
                                     >
                                        <RefreshCw className={cn('h-4 w-4', transactionsLoading && 'animate-spin')} />
                                     </Button>
                                 </div>
                             </div>

                             <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl overflow-hidden shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                 <div className="overflow-x-auto">
                                     <table className="w-full text-left">
                                         <thead>
                                             <tr className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-black tracking-widest border-b border-border">
                                                 <th className="px-6 py-4">Fecha de Inscripción</th>
                                                 <th className="px-6 py-4">Concepto</th>
                                                 <th className="px-6 py-4 text-right">Variación / Saldo</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-border/30">
                                             {transactionsLoading ? (
                                                 <tr>
                                                     <td colSpan={3} className="py-20 text-center">
                                                         <div className="flex flex-col items-center gap-4">
                                                             <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Abriendo el Gran Libro...</p>
                                                         </div>
                                                     </td>
                                                 </tr>
                                             ) : transactions.length > 0 ? (
                                                 transactions.map((tx) => {
                                                     const isPositive = Number(tx.amount) > 0;
                                                     return (
                                                         <tr key={tx.id} className="hover:bg-primary/[0.02] transition-colors group">
                                                             <td className="px-6 py-5">
                                                                 <div className="flex flex-col">
                                                                     <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 font-literata">
                                                                         <Calendar size={10} className="text-primary/40" />
                                                                         {formatDate(tx.created_at)}
                                                                     </span>
                                                                 </div>
                                                             </td>
                                                             <td className="px-6 py-5">
                                                                 <div className="flex flex-col gap-1">
                                                                     <span className="text-xs font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                                         {tx.description || 'Intervención de Sistema'}
                                                                     </span>
                                                                     <div className="flex gap-2">
                                                                        <span className={cn(
                                                                            "px-2 py-0.5 rounded text-[8px] font-black border tracking-tighter",
                                                                            tx.type === 'deposit' ? 'bg-primary/5 text-primary border-primary/20'
                                                                            : tx.type === 'purchase' ? 'bg-destructive/5 text-destructive border-destructive/20'
                                                                            : 'bg-amber-500/5 text-amber-500 border-amber-500/20',
                                                                        )}>
                                                                            {tx.type.toUpperCase()}
                                                                        </span>
                                                                     </div>
                                                                 </div>
                                                             </td>
                                                             <td className="px-6 py-5 text-right space-y-1">
                                                                 <span className={cn(
                                                                     'text-sm font-black italic block',
                                                                     isPositive ? 'text-primary' : 'text-destructive',
                                                                 )}>
                                                                     {isPositive ? '+' : '-'}
{' '}
{formatEuro(Math.abs(Number(tx.amount)))}
                                                                 </span>
                                                                 <span className="text-[10px] font-medium text-muted-foreground font-forum italic opacity-60">
                                                                     Saldo:
{' '}
{formatEuro(tx.balance_after)}
                                                                 </span>
                                                             </td>
                                                         </tr>
                                                     );
                                                 })
                                             ) : (
                                                 <tr>
                                                     <td colSpan={3} className="py-24 text-center">
                                                         <div className="flex flex-col items-center gap-3 opacity-20">
                                                             <History className="h-12 w-12 text-muted-foreground" />
                                                             <p className="text-[10px] font-black uppercase tracking-widest italic">El libro de cuentas está en blanco.</p>
                                                         </div>
                                                     </td>
                                                 </tr>
                                             )}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>

                             {/* PAGINACIÓN DE TRANSACCIONES */}
                             {lastPage > 1 && (
                                 <div className="flex items-center justify-center gap-4 mt-6">
                                     <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                         disabled={currentPage === 1 || transactionsLoading}
                                         className="font-bold border-border bg-card/50 hover:bg-primary/20 hover:text-primary transition-all text-xs h-8"
                                     >
                                         Anterior
                                     </Button>
                                     <div className="flex items-center gap-1">
                                         {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                                             const p = i + 1;
                                             return (
                                                 <button
                                                     key={p}
                                                     onClick={() => setCurrentPage(p)}
                                                     disabled={transactionsLoading}
                                                     className={cn(
                                                         'w-8 h-8 rounded-lg text-[10px] font-black transition-all',
                                                         currentPage === p
                                                             ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                             : 'bg-card/50 text-muted-foreground hover:bg-accent border border-border',
                                                     )}
                                                 >
                                                     {p}
                                                 </button>
                                             );
                                         })}
                                     </div>
                                     <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                                         disabled={currentPage === lastPage || transactionsLoading}
                                         className="font-bold border-border bg-card/50 hover:bg-primary/20 hover:text-primary transition-all text-xs h-8"
                                     >
                                         Siguiente
                                     </Button>
                                 </div>
                             )}
                         </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
