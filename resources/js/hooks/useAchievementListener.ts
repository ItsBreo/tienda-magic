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
            if (user) console.log('📡 AchievementListener: Faltan datos (user o token). No se puede conectar.');
            return;
        }

        let echo: Echo<any> | null = null;

        try {
            // Usamos window.location.hostname para ser dinámicos (funciona en localhost y en red local)
            const host = window.location.hostname;
            const port = import.meta.env.VITE_REVERB_PORT ?? 8080;
            const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';

            console.log(`📡 Conectando a Reverb en ${scheme}://${host}:${port}...`);

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

            console.log(`🔓 Escuchando logros en canal privado: ${channelName}`);

            channel.on('pusher:subscription_succeeded', () => {
                console.log('✅ Conectado con éxito al canal de logros');
            });

            channel.on('pusher:subscription_error', (status: any) => {
                console.error('❌ Error de suscripción al canal de logros:', status);
            });

            channel.listen('.achievement.unlocked', (data: any) => {
                console.log('🎉 EVENTO DE LOGRO RECIBIDO!', data);
                const { achievement } = data;
                
                toast.success('¡Logro desbloqueado!', {
                    description: achievement.name,
                    icon: '🏆',
                    duration: 6000,
                    action: {
                        label: 'Ver Logros',
                        onClick: () => window.location.href = '/achievements'
                    }
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
                console.log(`🔌 Desconectando del canal de logros: App.Models.User.${user.id}`);
                echo.leave(`App.Models.User.${user.id}`);
            }
        };
    }, [user, token]);
}
