import { Package, Users, TrendingUp, Map } from 'lucide-react'; // Cambiamos Sparkles por Map
import { Card, CardContent } from '@/components/ui/card';
import { getColorClasses } from '../constants';

interface StatsSectionProps {
    stats: {
        totalPacks: number;
        latestSet: string; // Reflejamos el cambio a string
        activeUsers: number;
        todaySales: number;
    };
    loading: boolean;
}

export function StatsSection({ stats, loading }: StatsSectionProps) {
    const items = [
        { label: 'Packs Disponibles', value: stats.totalPacks, icon: Package, color: 'emerald' },
        // Actualizamos esta línea con latestSet
        { label: 'Último Set (Scryfall)', value: stats.latestSet, icon: Map, color: 'blue' },
        { label: 'Planeswalkers', value: stats.activeUsers.toLocaleString(), icon: Users, color: 'purple' },
        { label: 'Ventas Hoy', value: stats.todaySales, icon: TrendingUp, color: 'orange' },
    ];

    return (
        <div className="px-6 py-16">
            <div className="mx-auto max-w-7xl">
                <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    Estado de la Bóveda
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((stat, index) => (
                        <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="overflow-hidden"> {/* Previene que nombres largos rompan la tarjeta */}
                                        <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
                                        {loading ? (
                                            <div className="h-9 w-24 bg-zinc-800 rounded animate-pulse mt-1"></div>
                                        ) : (
                                            <p className="text-xl md:text-2xl font-bold text-zinc-100 truncate pr-2" title={stat.value.toString()}>
                                                {stat.value}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-800 shrink-0">
                                        <stat.icon className={`h-6 w-6 ${getColorClasses(stat.color).split(' ').pop()}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
