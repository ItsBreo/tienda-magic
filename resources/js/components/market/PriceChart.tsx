import React, { useState, useEffect } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { TrendingUp, Activity, AlertCircle, Loader2 } from 'lucide-react';
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
        <div className="h-full w-full">
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
                        formatter={(value: number) => [`${value.toFixed(2)}€`, 'Precio']}
                    />
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
    );
};

export default PriceChart;
