import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/ApiService';

// Asegurar que Pusher esté disponible para Echo
if (typeof window !== 'undefined' && !(window as any).Pusher) {
    (window as any).Pusher = Pusher;
}

export function useAchievementListener() {
    const { user } = useAuth();
    const token = apiService.getToken();

    useEffect(() => {
        if (!user || !token) {
            return;
        }

        let echo: Echo<any> | null = null;

        try {
            const appKey = import.meta.env.VITE_REVERB_APP_KEY;
            const host = import.meta.env.VITE_REVERB_HOST;
            const port = import.meta.env.VITE_REVERB_PORT ?? 80;
            const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';

            if (!appKey || appKey === 'reverb_key') {
                return;
            }


            echo = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: host,
                wsPort: port,
                wssPort: port,
                forceTLS: scheme === 'https',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: '/api/broadcasting/auth',
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                },
            });

            const channelName = `App.Models.User.${user.id}`;
            const channel = echo.private(channelName);


            channel.on('pusher:subscription_succeeded', () => {
            });

            channel.on('pusher:subscription_error', (status: any) => {
                console.error('❌ Error de suscripción al canal de logros:', status);
            });

            channel.listen('.achievement.unlocked', (data: any) => {
                const { achievement } = data;

                toast.success('¡Logro desbloqueado!', {
                    description: achievement.name,
                    icon: '🏆',
                    duration: 6000,
                    action: {
                        label: 'Ver Logros',
                        onClick: () => window.location.href = '/achievements',
                    },
                });

                // Intento de sonido
                try {
                    const audio = new Audio('/sounds/achievement.mp3');
                    audio.play().catch(() => {});
                } catch (e) {}
            });
        } catch (error) {
            console.error('❌ Error fatal inicializando Achievement Echo:', error);
        }

        return () => {
            if (echo) {
                echo.leave(`App.Models.User.${user.id}`);
            }
        };
    }, [user, token]);
}
