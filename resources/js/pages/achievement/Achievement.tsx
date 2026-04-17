import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@/services/ApiService';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loader2, Trophy, ChevronLeft, Lock, Star, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Achievement {
    slug: string;
    name: string;
    description: string;
    badge_icon: string;
    xp_points: number;
    obtained_at: string | null;
}

const ALL_ACHIEVEMENTS: Omit<Achievement, 'obtained_at'>[] = [
    { slug: 'first_register',    name: 'Bienvenido Planeswalker', description: 'Creaste tu cuenta en la Tienda Magic.',           badge_icon: '🧙', xp_points: 10  },
    { slug: 'first_pack_purchase',name: 'Primer Sobre',           description: 'Abriste tu primer sobre.',                       badge_icon: '📦', xp_points: 30  },
    { slug: 'first_card_purchase',name: 'Primera Carta',          description: 'Compraste tu primera carta en el mercado.',      badge_icon: '🃏', xp_points: 30  },
    { slug: 'first_card_listed', name: 'Primer Vendedor',         description: 'Pusiste una carta a la venta por primera vez.',  badge_icon: '🏪', xp_points: 25  },
    { slug: 'transactions_10',   name: 'Comerciante',             description: 'Completaste 10 transacciones en total.',          badge_icon: '💰', xp_points: 50  },
    { slug: 'transactions_50',   name: 'Mercader Experto',        description: 'Completaste 50 transacciones en total.',          badge_icon: '💎', xp_points: 150 },
    { slug: 'verified_trader',   name: 'Verificado',              description: 'Alcanzaste 1000 de reputación en la comunidad.', badge_icon: '🔵', xp_points: 100 },
];

export default function Achievements() {
    const [unlocked, setUnlocked] = useState<Achievement[]>([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        apiService.axiosInstance.get('/api/achievements')
            .then(res => {
                const data = res.data?.achievements ?? res.data?.data ?? res.data ?? [];
                setUnlocked(Array.isArray(data) ? data : []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const unlockedSlugs = new Set(unlocked.map(a => a.slug));
    const locked = ALL_ACHIEVEMENTS.filter(a => !unlockedSlugs.has(a.slug));
    
    // Stats
    const totalXp = unlocked.reduce((sum, a) => sum + a.xp_points, 0);
    const maxXp   = ALL_ACHIEVEMENTS.reduce((sum, a) => sum + a.xp_points, 0);
    const progress = maxXp > 0 ? (totalXp / maxXp) * 100 : 0;

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="flex-1 bg-background text-foreground pb-20 font-literata">
            <Breadcrumbs items={[
                { title: 'Mi Perfil', href: '/profile' }, 
                { title: 'Logros', href: '/achievements' }
            ]} />
            
            {/* ACTION TOOLBAR (Parity with Inventory/Shop) */}
            <div className="bg-background/90 backdrop-blur-sm border-b border-border sticky top-[72px] md:top-[88px] z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                         <Link to="/profile" className="p-2 rounded-lg bg-accent/20 border border-border hover:bg-primary/10 hover:border-primary/50 transition-all">
                             <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                         </Link>
                         <h1 className="text-xl font-montserrat font-black text-foreground uppercase tracking-tight">Salón de Logros</h1>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <Badge variant="outline" className="h-10 px-4 bg-accent/20 border-border text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <Trophy size={14} className="text-amber-500" /> {unlocked.length}/{ALL_ACHIEVEMENTS.length}
                        </Badge>
                        <Badge variant="outline" className="h-10 px-4 bg-accent/20 border-border text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <Star size={14} className="text-primary" /> {totalXp} XP
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-12">
                
                {/* VAULT PROGRESS (Simplified to match style) */}
                <div className="mb-16 space-y-4">
                    <div className="flex items-center justify-between font-montserrat">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sincronización de Hazañas</span>
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{Math.round(progress)}% Completado</span>
                    </div>
                    <div className="h-2 w-full bg-accent/30 rounded-full overflow-hidden border border-border/50">
                        <div 
                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(108,92,231,0.2)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-16">
                    {/* Desbloqueados Section */}
                    {unlocked.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <h2 className="text-xl font-montserrat font-black text-foreground uppercase tracking-tight">Emblemas de Poder</h2>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground bg-accent/30 px-3 py-1 rounded-full uppercase">Obtenidos</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {unlocked.map(a => (
                                    <AchievementCard key={a.slug} achievement={a} unlocked />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bloqueados Section */}
                    {locked.length > 0 && (
                        <div className="space-y-6">
                             <div className="flex items-center justify-between border-b border-border pb-2 opacity-50">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-xl font-montserrat font-black text-muted-foreground uppercase tracking-tight">Hazañas Ocultas</h2>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground bg-accent/10 px-3 py-1 rounded-full uppercase">Cerradas</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-40 grayscale">
                                {locked.map(a => (
                                    <AchievementCard key={a.slug} achievement={{ ...a, obtained_at: null }} unlocked={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AchievementCard({ achievement: a, unlocked }: { achievement: Achievement; unlocked: boolean }) {
    return (
        <div className={cn(
            "border border-border p-5 bg-card w-full flex flex-col group transition-all duration-300 rounded-xl",
            unlocked ? "hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1" : ""
        )}>
            <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                    "w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-transform duration-500",
                    unlocked ? "bg-accent/30 border border-primary/20 shadow-inner" : "bg-accent/10 border border-border/50"
                )}>
                    {unlocked ? a.badge_icon : <Lock className="h-6 w-6 text-muted-foreground/30" />}
                </div>
                <div className="flex-1 min-w-0">
                     <h3 className="text-foreground font-forum font-bold text-lg md:text-xl leading-tight truncate uppercase tracking-tight">
                        {a.name}
                     </h3>
                     <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest",
                            unlocked ? "bg-primary/10 text-primary border-primary/20" : "bg-accent text-muted-foreground border-border"
                        )}>
                            +{a.xp_points} XP
                        </span>
                     </div>
                </div>
            </div>
            
            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4 line-clamp-2 h-10 italic">
                {a.description}
            </p>

            {unlocked && a.obtained_at && (
                <div className="mt-auto pt-4 border-t border-border/40 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <span>Sincronizado</span>
                    <span>{new Date(a.obtained_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                </div>
            )}
        </div>
    );
}
