import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@/services/ApiService';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loader2, Trophy, ChevronLeft, Lock } from 'lucide-react';

interface Achievement {
    slug: string;
    name: string;
    description: string;
    badge_icon: string;
    xp_points: number;
    obtained_at: string | null;
}

// Todos los logros posibles actualizados según el último seeder
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
    const totalXp = unlocked.reduce((sum, a) => sum + a.xp_points, 0);
    const maxXp   = ALL_ACHIEVEMENTS.reduce((sum, a) => sum + a.xp_points, 0);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
    );

    return (
        <div className="bg-[var(--bg)] min-h-screen text-[var(--text-primary)]">
            <Breadcrumbs items={[{ title: 'Mi Perfil', href: '/profile' }, { title: 'Logros', href: '/achievements' }]} />
            <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <Link to="/profile" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <Trophy className="h-6 w-6 text-amber-500" />
                    <h1 className="text-2xl font-serif font-bold text-zinc-100">Logros</h1>
                    <span className="ml-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                        {unlocked.length} / {ALL_ACHIEVEMENTS.length}
                    </span>
                </div>
                <p className="text-zinc-500 text-sm mb-8 ml-14">Emblemas desbloqueados en tu aventura</p>

                {/* Barra XP */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-5 mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Experiencia total</span>
                        <span className="text-sm font-semibold text-amber-400">{totalXp} / {maxXp} XP</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                            className="bg-gradient-to-r from-amber-700 to-amber-400 h-1.5 rounded-full transition-all duration-700"
                            style={{ width: maxXp > 0 ? `${(totalXp / maxXp) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                {/* Desbloqueados */}
                {unlocked.length > 0 && (
                    <>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                            Desbloqueados
                            <span className="flex-1 h-px bg-zinc-800" />
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                            {unlocked.map(a => (
                                <AchievementCard key={a.slug} achievement={a} unlocked />
                            ))}
                        </div>
                    </>
                )}

                {/* Bloqueados */}
                {locked.length > 0 && (
                    <>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                            Bloqueados
                            <span className="flex-1 h-px bg-zinc-800" />
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-50">
                            {locked.map(a => (
                                <AchievementCard key={a.slug} achievement={{ ...a, obtained_at: null }} unlocked={false} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function AchievementCard({ achievement: a, unlocked }: { achievement: Achievement; unlocked: boolean }) {
    const isVerified = a.slug === 'verified_trader';

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors
            ${unlocked
                ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                : 'bg-zinc-900/20 border-zinc-800/40'
            }`}
        >
            <div className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0
                ${unlocked ? 'bg-zinc-800/80' : 'bg-zinc-800/40 grayscale'}`}
            >
                {unlocked ? a.badge_icon : <Lock className="h-4 w-4 text-zinc-600" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-semibold text-zinc-200 font-sans">{a.name}</span>
                    {isVerified && unlocked && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 flex-shrink-0">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                                <polyline points="2,5 4,7.5 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                    )}
                </div>
                <p className="text-xs text-zinc-500 font-sans leading-relaxed mb-2">{a.description}</p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        +{a.xp_points} XP
                    </span>
                    {a.obtained_at && (
                        <span className="text-xs text-zinc-600 font-sans">
                            {new Date(a.obtained_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
