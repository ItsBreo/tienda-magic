import {
 useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/ApiService';

// Hacer Pusher disponible globalmente para Echo
if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

interface Message {
  id: number;
  conversation_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  is_system_message: boolean;
  metadata: any;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
  } | null;
  can_edit: boolean;
  can_delete: boolean;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

// El parámetro authToken se mantiene en la firma por compatibilidad con ChatWidget,
// pero ya no se usa — la autenticación se gestiona vía cookie Sanctum.
export function useChat(conversationId: string | null, _authToken?: string | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const { user } = useAuth();
  const echoRef = useRef<Echo<any> | null>(null);
  const channelRef = useRef<any>(null);

    const echoInstance = useMemo(() => {
    if (!user) return null;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
      wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
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

    // Inyectar Socket ID en Axios cuando se conecte
    echo.connector.pusher.connection.bind('connected', () => {
      const socketId = echo?.socketId();
      if (socketId) {
        apiService.axiosInstance.defaults.headers.common['X-Socket-ID'] = socketId;
      }
    });

    return echo;
  }, [user]);

  // Cargar historial inicial
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await apiService.axiosInstance.get(`/api/conversations/${conversationId}/messages`);
        const messagesData = response.data.data || response.data;

        // Ordenación explícita por fecha (cronológica ascendente)
        const sortedMessages = Array.isArray(messagesData)
          ? [...messagesData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          : [];

        setMessages(sortedMessages);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('No se pudieron cargar los mensajes');
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      loadMessages();
    } else {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Suscripción a WebSocket
  useEffect(() => {
    if (!conversationId || !echoInstance) return;

    let channel: any;

    try {

      channel = echoInstance.private(`conversation.${conversationId}`);
      channelRef.current = channel;

      channel.on('pusher:subscription_succeeded', () => {
        setConnectionStatus('connected');
      });

      channel.on('pusher:subscription_error', (status: any) => {
        console.error('❌ Error de auth en el canal:', status);
        setConnectionStatus('disconnected');
        setError('Error de conexión al chat');
      });

      // Escuchar mensajes nuevos
      channel.listen('.message.sent', (e: any) => {
        const nuevoMensaje = e.message || e;

        setMessages((prev) => {
          if (prev.some((m) => m.id === nuevoMensaje.id)) return prev;
          return [...prev, nuevoMensaje];
        });
      });
    } catch (e) {
      console.error('❌ No se puede suscribir al canal WebSocket:', e);
      setConnectionStatus('disconnected');
      setError('Error de conexión');
    }

    return () => {
      if (channel && echoInstance) {
        echoInstance.leave(`conversation.${conversationId}`);
      }
      setConnectionStatus('disconnected');
    };
  }, [conversationId, echoInstance]);

  // Enviar mensaje
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !conversationId) return;

    try {
      const response = await apiService.axiosInstance.post(`/api/conversations/${conversationId}/messages`, {
        content: content.trim(),
        type: 'text',
      });

      const newMessage = response.data.data || response.data;

      // Actualización instantánea (optimista)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('No se pudo enviar el mensaje');
      throw err;
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    connectionStatus,
  };
}
