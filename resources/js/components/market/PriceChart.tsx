import React, { useState, useEffect, useMemo } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine
} from 'recharts';
import { TrendingUp, Activity, AlertCircle, Loader2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import apiService from '@/services/ApiService';

interface PricePoint {
    recorded_at: string;
    price: number;
}

interface PriceChartProps {
    data?: PricePoint[]; // Opcional si se pasa type/id
    type?: 'card' | 'pack';
    id?: number;
    color?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data: initialData, type, id, color = '#6366f1' }) => {
    const [data, setData] = useState<PricePoint[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData && !!type && !!id);
    const api = apiService;

    useEffect(() => {
        if (!initialData && type && id) {
            fetchHistory();
        }
    }, [type, id]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const history = await api.getPriceHistory(type!, id!);
            setData(history);
        } catch (error) {
            console.error('Error fetching price history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cálculos estadísticos
    const stats = useMemo(() => {
        if (data.length === 0) return null;

        const prices = data.map(d => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = sum / prices.length;

        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;

        return { min, max, avg, change };
    }, [data]);

    // Formatear fechas para el eje X
    const formattedData = data.map(point => ({
        ...point,
        date: new Date(point.recorded_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        }),
        fullDate: new Date(point.recorded_at).toLocaleString()
    }));

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-zinc-900/10 dark:bg-zinc-900/30">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-500 p-6 text-center">
                <Activity className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No hay datos históricos suficientes</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">El seguimiento de precios diario ha comenzado recientemente para este artículo.</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            {/* Stats Header */}
            {stats && (
                <div className="grid grid-cols-4 gap-2 mb-6 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Mínimo</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{stats.min.toFixed(2)}€</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Máximo</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{stats.max.toFixed(2)}€</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Promedio</p>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.avg.toFixed(2)}€</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Variación</p>
                        <div className={`flex items-center justify-center gap-0.5 text-sm font-bold ${stats.change > 0 ? 'text-emerald-500' : stats.change < 0 ? 'text-rose-500' : 'text-zinc-400'}`}>
                            {stats.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : stats.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(stats.change).toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} opacity={0.3} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#a1a1aa" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis 
                            stroke="#a1a1aa" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}€`}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e4e4e7',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: color, fontWeight: 'bold' }}
                            formatter={(value: any) => [`${parseFloat(value).toFixed(2)}€`, 'Precio']}
                        />
                        
                        {stats && (
                            <ReferenceLine 
                                y={stats.avg} 
                                stroke="#a1a1aa" 
                                strokeDasharray="3 3" 
                                label={{ value: 'Media', position: 'right', fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} 
                            />
                        )}

                        <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke={color} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorPrice)" 
                            animationDuration={1500}
                            activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PriceChart;
