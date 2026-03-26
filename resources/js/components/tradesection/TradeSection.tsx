import React, { useState, useEffect, useRef } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { MessageSquare, Send, Users, Swords, X, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/ApiService';

(window as any).Pusher = Pusher;
Pusher.logToConsole = true;

// ── Singleton Echo ───────────────────────────────────────────────
let echoInstance: Echo<any> | null = null;

function getEcho(): Echo<any> {
    if (echoInstance) return echoInstance;

    const jwtToken = localStorage.getItem('auth_token');

    if (!jwtToken) {
        throw new Error('No hay token JWT disponible para Echo. Espera a que el login complete.');
    }

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        // Usamos el endpoint que Laravel acaba de habilitar en api.php
        authEndpoint: '/api/broadcasting/auth',
        auth: {
            headers: {
                // Asegúrate de enviar tu token actual para que Auth::id() funcione en channels.php
                Authorization: `Bearer ${jwtToken}`,
                Accept: 'application/json',
            }
        }
    });

    // Cuando se conecte, inyectamos el Socket ID en tu Axios personalizado
    echoInstance.connector.pusher.connection.bind('connected', () => {
        const socketId = echoInstance?.socketId();
        if (socketId) {
            apiService.axiosInstance.defaults.headers.common['X-Socket-ID'] = socketId;
        }
    });

    // Trampa global para ver TODO lo que entra por Pusher (incluso si el nombre del evento estuviera mal)
    echoInstance.connector.pusher.bind_global((eventName: string, data: any) => {
        console.log(`[Reverb Global] Evento recibido: ${eventName}`, data);
    });

    return echoInstance;
}

// FIX #4: destruye la instancia singleton limpiamente
function destroyEcho(): void {
    if (echoInstance) {
        try {
            echoInstance.disconnect();
        } catch (_) { }
        echoInstance = null;
    }
}
// ─────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────
interface UserOption {
    id: number;
    username: string;
    email: string;
}

interface Message {
    id: number;
    message: string;
    user_id: number;
    username: string;
    created_at: string;
}

// ── Component ────────────────────────────────────────────────────
export default function TradeTestSection() {
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingSession, setLoadingSession] = useState(false);
    const [sending, setSending] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

    const bottomRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth();
    const currentUserId = user?.id;

    // Cargar lista de usuarios
    useEffect(() => {
        apiService.axiosInstance.get('/api/users/list')
            .then(r => setUsers(r.data))
            .catch(console.error)
            .finally(() => setLoadingUsers(false));
    }, []);

    // Scroll al último mensaje
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Calcular posición del dropdown al abrirlo
    useEffect(() => {
        if (!dropdownOpen || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
        });
    }, [dropdownOpen]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    // Suscripción al canal WebSocket
    useEffect(() => {
        if (!sessionId) return;

        let echo: Echo<any>;
        try {
            echo = getEcho();
        } catch (e) {
            console.error('❌ No se puede suscribir al canal WebSocket:', e);
            setConnectionStatus('disconnected');
            return;
        }

        setConnectionStatus('connecting');
        console.log(`📡 Intentando suscribirse al canal: trade.${sessionId}`);

        const channel = echo.private(`trade.${sessionId}`);

        channel.on('pusher:subscription_succeeded', () => {
            console.log('✅ Suscripción exitosa al canal');
            setConnectionStatus('connected');
        });

        channel.on('pusher:subscription_error', (status: any) => {
            console.error('❌ Error de auth en el canal:', status);
            setConnectionStatus('disconnected');
        });

        // FIX #2 + #3: El mensaje llega por WebSocket para AMBOS usuarios.
        // No añadimos el mensaje propio manualmente en sendMessage, así evitamos
        // duplicados. El guard por id es la segunda línea de defensa.
        channel.listen('.message.sent', (e: Message) => {
            console.log('💬 Mensaje entrante del WebSocket:', e);
            setMessages(prev => {
                if (prev.some(m => m.id === e.id)) return prev;
                return [...prev, e];
            });
        });

        return () => {
            console.log(`🔌 Limpiando suscripción de trade.${sessionId}`);
            echo.leave(`trade.${sessionId}`);
            setConnectionStatus('disconnected');
        };
    }, [sessionId]);

    // ── Acciones ─────────────────────────────────────────────────

    const startSession = async () => {
        if (!selectedUser) return;
        setLoadingSession(true);
        try {
            const { data: session } = await apiService.axiosInstance.post('/api/trade/start', {
                receiver_id: selectedUser.id,
            });
            setSessionId(session.id);

            const { data: history } = await apiService.axiosInstance.get(`/api/trade/${session.id}/chat`);
            setMessages(Array.isArray(history) ? history : []);
        } catch (e) {
            console.error('Error al iniciar sesión:', e);
        } finally {
            setLoadingSession(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !sessionId) return;
        setSending(true);
        const optimisticInput = input;
        setInput('');

        // UI Optimista: Creamos un ID temporal para mostrar el mensaje inmediatamente
        const tempId = Date.now();
        const tempMessage: Message = {
            id: tempId,
            message: optimisticInput,
            user_id: currentUserId as number,
            username: user?.username || 'Yo',
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            const response = await apiService.axiosInstance.post(`/api/trade/${sessionId}/chat`, {
                message: optimisticInput,
            });

            // Reemplazamos el mensaje temporal con el real (que tiene el ID de la base de datos)
            setMessages(prev => prev.map(m => m.id === tempId ? response.data : m));
        } catch (e) {
            console.error('Error al enviar mensaje:', e);
            // Si falla, quitamos el mensaje temporal y restauramos el input para reintentar
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInput(optimisticInput);
        } finally {
            setSending(false);
        }
    };

    const closeSession = () => {
        // FIX #4: destruimos el singleton para que el próximo uso cree una instancia
        // con el token actualizado, en vez de reusar uno potencialmente caducado.
        destroyEcho();
        setSessionId(null);
        setMessages([]);
        setSelectedUser(null);
        setConnectionStatus('disconnected');
    };

    // ── Render ───────────────────────────────────────────────────
    return (
        <section className="px-6 md:px-12 py-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Swords className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100 tracking-wide">
                        Chat de Intercambio
                    </h2>
                    <p className="text-xs text-zinc-500">Prueba en tiempo real con otro usuario</p>
                </div>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                    DEV
                </span>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl">

                {/* Selector + botón */}
                {!sessionId && (
                    <div className="p-5 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <button
                                ref={triggerRef}
                                onClick={() => setDropdownOpen(p => !p)}
                                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-sm text-zinc-300 hover:border-zinc-600 transition-colors"
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <Users className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                                    {selectedUser ? (
                                        <>
                                            <span className="text-zinc-100 font-medium truncate">{selectedUser.username}</span>
                                            <span className="text-zinc-500 truncate hidden sm:inline">{selectedUser.email}</span>
                                        </>
                                    ) : (
                                        <span className="text-zinc-500">Selecciona un usuario...</span>
                                    )}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <div
                                    ref={dropdownRef}
                                    style={dropdownStyle}
                                    className="bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-2xl overflow-hidden"
                                >
                                    {loadingUsers ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-4 w-4 text-zinc-500 animate-spin" />
                                        </div>
                                    ) : users.length === 0 ? (
                                        <p className="text-xs text-zinc-500 text-center py-4">No hay otros usuarios registrados</p>
                                    ) : (
                                        <div className="max-h-52 overflow-y-auto">
                                            {users.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => { setSelectedUser(u); setDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-bold text-emerald-400">
                                                            {u.username[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-zinc-200 truncate">{u.username}</p>
                                                        <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={startSession}
                            disabled={!selectedUser || loadingSession}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-lg transition-colors flex-shrink-0"
                        >
                            {loadingSession
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <MessageSquare className="h-4 w-4" />
                            }
                            Iniciar Chat
                        </button>
                    </div>
                )}

                {/* Chat activo */}
                {sessionId && (
                    <div className="flex flex-col">
                        {/* Cabecera */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 bg-zinc-900/80 rounded-t-xl">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                                        ? 'bg-emerald-400 animate-pulse'
                                        : connectionStatus === 'connecting'
                                            ? 'bg-yellow-400 animate-pulse'
                                            : 'bg-red-400'
                                    }`} />
                                <span className="text-sm font-medium text-zinc-200">
                                    Sesión con <span className="text-emerald-400">{selectedUser?.username}</span>
                                </span>
                                <span className="text-xs text-zinc-600 font-mono">#{sessionId}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${connectionStatus === 'connected'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        : connectionStatus === 'connecting'
                                            ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}>
                                    {connectionStatus === 'connected' ? 'Conectado' :
                                        connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                                </span>
                            </div>
                            <button
                                onClick={closeSession}
                                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Mensajes */}
                        <div className="h-64 overflow-y-auto p-4 space-y-2.5">
                            {messages.length === 0 && (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-xs text-zinc-600 text-center">
                                        Sin mensajes aún.<br />¡Empieza la negociación!
                                    </p>
                                </div>
                            )}
                            {messages.map((m, i) => {
                                const isOwn = m.user_id === currentUserId;
                                return (
                                    <div key={m.id ?? i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs lg:max-w-sm flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                                            {!isOwn && (
                                                <span className="text-xs text-zinc-500 px-1">{m.username}</span>
                                            )}
                                            <div className={`px-3.5 py-2 rounded-xl text-sm leading-relaxed ${isOwn
                                                    ? 'bg-emerald-600/90 text-white rounded-br-sm'
                                                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                                                }`}>
                                                {m.message}
                                            </div>
                                            <span className="text-xs text-zinc-600 px-1">
                                                {new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="flex gap-2 p-3 border-t border-zinc-800/60 bg-zinc-900/60 rounded-b-xl">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Escribe tu oferta..."
                                className="flex-1 bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || sending}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-lg transition-colors flex-shrink-0"
                            >
                                {sending
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Send className="h-4 w-4" />
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
