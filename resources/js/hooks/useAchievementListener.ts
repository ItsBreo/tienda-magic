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

    useEffect(() => {
        if (!user) return;

        const appKey = import.meta.env.VITE_REVERB_APP_KEY;
        const host = import.meta.env.VITE_REVERB_HOST;
        const port = import.meta.env.VITE_REVERB_PORT ?? 80;
        const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';

        if (!appKey || appKey === 'reverb_key') return;

        let echo: Echo<any> | null = null;

        try {
            echo = new Echo({
                broadcaster: 'reverb',
                key: appKey,
                wsHost: host,
                wsPort: port,
                wssPort: port,
                forceTLS: scheme === 'https',
                enabledTransports: ['ws', 'wss'],
                // Axios como autorizador → envía XSRF-TOKEN automáticamente (evita 419)
                authorizer: (channel: any) => ({
                    authorize: (socketId: string, callback: any) => {
                        apiService.axiosInstance
                            .post('/api/broadcasting/auth', {
                                socket_id: socketId,
                                channel_name: channel.name,
                            })
                            .then((res) => callback(null, res.data))
                            .catch((err) => callback(err, null));
                    },
                }),
            });

            const channelName = `App.Models.User.${user.id}`;
            const channel = echo.private(channelName);

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
                        onClick: () => { window.location.href = '/achievements'; },
                    },
                });

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
    }, [user]);
}
