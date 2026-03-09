import { useState, useEffect } from 'react';
import axios from 'axios';

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
                // Disparamos ambas peticiones AL MISMO TIEMPO (más rápido)
                const [statsResponse, setsResponse] = await Promise.all([
                    axios.get('/api/store-stats'), // Va al DashboardController (tu base de datos)
                    axios.get('/api/sets/latest'), // Va al SetController (Scryfall)
                ]);

                // Juntamos la respuesta de ambos en un solo objeto para nuestro componente
                setStats({
                    totalPacks: statsResponse.data.totalPacks,
                    activeUsers: statsResponse.data.activeUsers,
                    todaySales: statsResponse.data.todaySales,
                    latestSet: setsResponse.data.latestSet, // Viene de la segunda petición
                });
            } catch (error) {
                console.error('Error al cargar los datos del Multiverso:', error);
                // Datos de emergencia si algo falla
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
