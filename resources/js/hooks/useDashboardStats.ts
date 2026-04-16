import { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';

export function useDashboardStats() {
    const [stats, setStats] = useState({
        totalPacks: 0,
        latestSet: 'Cargando...', // Texto inicial
        activeUsers: 0,
        todaySales: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                // Disparamos ambas peticiones AL MISMO TIEMPO
                const [statsData, setsData] = await Promise.all([
                    apiService.getDashboardStats(),
                    apiService.getLatestSets(),
                ]);

                // Juntamos la respuesta de ambos
                setStats({
                    totalPacks: statsData.totalPacks,
                    activeUsers: statsData.activeUsers,
                    todaySales: statsData.todaySales,
                    latestSet: setsData.latestSet,
                });
            } catch (error) {
                console.error('Error al cargar los datos del Multiverso:', error);
                setStats({
                    totalPacks: 150,
                    activeUsers: 300,
                    todaySales: 12,
                    latestSet: 'Error de conexión',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAllStats();
    }, []);

    return { stats, loading };
}
