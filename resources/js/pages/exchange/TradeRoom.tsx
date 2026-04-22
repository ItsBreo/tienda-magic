import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { apiService } from '../../services/ApiService';
import { cn } from '../../lib/utils';
import { UserAvatar } from '@/components/common/UserAvatar';

if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

interface ChatMessage {
  id: number;
  content: string;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  created_at: string;
}

export default function TradeRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const echoRef = useRef<Echo<any> | null>(null);

  // Modal Inventario
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryCards, setInventoryCards] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [changingCard, setChangingCard] = useState(false);

  const openInventoryModal = async () => {
    setShowInventoryModal(true);
    setLoadingInventory(true);
    try {
      const data = await apiService.getMyInventory();
      // El backend devuelve un objeto con { inventoryCards: { data: [...] } } porque es paginado
      const cards = data.inventoryCards?.data || [];
      setInventoryCards(cards);
    } catch {
      toast.error('Error al cargar inventario');
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleChangeCard = async (newCardId: number) => {
    if (changingCard) return;
    setChangingCard(true);
    try {
      const data = await apiService.changeTradeCard(Number(sessionId), newCardId);
      setRoom(data);
      toast.success('Carta cambiada correctamente. Reconfirma el intercambio.');
      setShowInventoryModal(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cambiar la carta');
    } finally {
      setChangingCard(false);
    }
  };

  useEffect(() => {
    loadRoom();
    loadUser();
  }, [sessionId]);

  // Configuración de WebSockets (Echo)
  useEffect(() => {
    if (!sessionId || echoRef.current) return;

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

    echoRef.current = echo;

    echo.private(`trade.${sessionId}`)
        .listen('.trade.updated', () => {
          loadRoom();
        });

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`trade.${sessionId}`);
        echoRef.current = null;
      }
    };
  }, [sessionId]);

  // Start polling once we have the session id
  useEffect(() => {
    if (!sessionId) return;
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 8000); // Polling más lento como respaldo
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive (Targeting only the container)
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const loadUser = async () => {
    const data = await apiService.checkAuth();
    setUser(data.user || data);
  };

  const loadRoom = async () => {
    try {
      const data = await apiService.getTradeRoom(Number(sessionId));
      setRoom(data);
    } catch (e) {
      toast.error('Error al cargar la sala');
      navigate('/exchanges/manage');
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await apiService.getTradeMessages(Number(sessionId));
      setConversationId(data.conversation_id || null);
      setMessages(data.data ?? []);
    } catch {
      // Silencioso — el chat puede no estar inicializado aún
    }
  };

  // Escuchar mensajes entrantes en tiempo real
  useEffect(() => {
    if (!conversationId || !echoRef.current) return;

    const channelName = `conversation.${conversationId}`;
    const channel = echoRef.current.private(channelName);

    channel.listen('.message.sent', (e: any) => {
      setMessages((prev) => {
        // Prevenir duplicados
        if (prev.some((m) => m.id === e.id)) return prev;
        return [...prev, e];
      });
    });

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(channelName);
      }
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    const content = chatInput.trim();
    if (!content || sendingMsg) return;
    setSendingMsg(true);
    try {
      const msg = await apiService.sendTradeMessage(Number(sessionId), content);
      setChatInput('');
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch {
      toast.error('Error al enviar el mensaje');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConfirm = async () => {
    try {
      const data = await apiService.confirmTrade(Number(sessionId));
      setRoom(data);
      if (data.status === 'completed') {
        toast.success('¡Intercambio completado exitosamente!');
      } else {
        toast.success('Confirmado. Esperando al otro jugador.');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al confirmar');
    }
  };

  const handleCancelTrade = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar este intercambio? Esta acción no se puede deshacer.')) return;
    try {
      const data = await apiService.cancelTrade(Number(sessionId));
      setRoom(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cancelar');
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (!room || !user) {
return (
    <div className="p-10 text-center text-muted-foreground flex flex-col items-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      Cargando Sala...
    </div>
  );
}

  const req = room.exchange_request || room.exchangeRequest;

  if (!req || !req.exchange) {
    return (
      <div className="p-10 text-center text-destructive font-bold">
        Error: No se pudo cargar la información estructurada de la sala. (exchangeRequest missing)
      </div>
    );
  }

  const exch = req.exchange;

  const isUser1 = (exch.user_id === user.id);
  const mySide = isUser1 ? exch.offered_card || exch.offeredCard : req.offered_card || req.offeredCard;
  const myStatus = isUser1 ? room.user1_confirmed : room.user2_confirmed;
  const theirSide = isUser1 ? req.offered_card || req.offeredCard : exch.offered_card || exch.offeredCard;
  const theirStatus = isUser1 ? room.user2_confirmed : room.user1_confirmed;
  const theirName = isUser1 ? req?.user?.name : exch?.user?.name;

  return (
    <div className="flex-1 text-foreground p-6">
      <div className="max-w-7xl mx-auto min-h-[calc(100vh-120px)] flex flex-col">

        {/* Header Elegante */}
        <div className="text-center mb-10 border-b border-border pb-8">
            <span className="text-[11px] uppercase tracking-widest font-black text-primary">Operación Segura</span>
            <h1 className="text-4xl md:text-5xl font-forum font-bold text-foreground mt-2">
                SALA DE TRANSFERENCIA
            </h1>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {room.status === 'completed' && (
                <span className="px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full font-black text-[10px] uppercase tracking-widest">
                  ✓ Transacción Finalizada
                </span>
              )}
              {room.status === 'cancelled' && (
                <span className="px-4 py-1 bg-destructive/10 border border-destructive/20 text-destructive rounded-full font-black text-[10px] uppercase tracking-widest">
                  ✕ Operación Anulada
                </span>
              )}
              {room.status === 'active' && (
                <span className="px-4 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-black text-[10px] uppercase tracking-widest animate-pulse">
                  ● Sesión en Vivo
                </span>
              )}
            </div>
        </div>

        {/* Main Grid: Cards (3/5) | Chat (2/5) */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-stretch flex-1">

            {/* Columna de Intercambio (3/5) */}
            <div className="xl:col-span-3 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">

                    {/* TU LADO */}
                    <div className={cn(
                        'border rounded-2xl p-6 bg-card/40 backdrop-blur-md flex flex-col items-center transition-all duration-500',
                        myStatus ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-border',
                    )}>
                        <div className="w-full flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tu Aportación</span>
                            {myStatus && <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded">CONFIRMADO</span>}
                        </div>

                        <div className="w-48 h-64 bg-accent/20 rounded-xl mb-6 relative overflow-hidden group shadow-xl">
                            {mySide?.card?.image_url ? (
                                <img
                                    src={mySide.card.image_url.startsWith('http') ? mySide.card.image_url : `/storage/${mySide.card.image_url}`}
                                    alt={mySide.card.name}
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-black uppercase text-4xl rotate-12">Carta</div>
                            )}
                            {myStatus && <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px]" />}
                        </div>

                        <div className="text-center w-full min-h-[60px]">
                            <h3 className="text-xl font-forum font-bold text-foreground truncate uppercase">{mySide?.card?.name || '---'}</h3>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
                                {mySide?.condition}
{' '}
•
{mySide?.language}
{' '}
{mySide?.is_foil ? '• Foil' : ''}
                            </p>
                        </div>

                        {room.status === 'active' && !myStatus && (
                            <button
                                onClick={openInventoryModal}
                                className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                            >
                                [ Cambiar Carta ]
                            </button>
                        )}
                    </div>

                    {/* FLECHA INTERMEDIA (Absoluta en MD+) */}
                    <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                    </div>

                    {/* LADO RIVAL */}
                    <div className={cn(
                        'border rounded-2xl p-6 bg-card/40 backdrop-blur-md flex flex-col items-center transition-all duration-500',
                        theirStatus ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-border',
                    )}>
                        <div className="w-full flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
Recibes de
{theirName}
</span>
                            {theirStatus && <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded">CONFIRMADO</span>}
                        </div>

                        <div className="w-48 h-64 bg-accent/20 rounded-xl mb-6 relative overflow-hidden group shadow-xl">
                            {theirSide?.card?.image_url ? (
                                <img
                                    src={theirSide.card.image_url.startsWith('http') ? theirSide.card.image_url : `/storage/${theirSide.card.image_url}`}
                                    alt={theirSide.card.name}
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-black uppercase text-4xl -rotate-12">Carta</div>
                            )}
                            {theirStatus && <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px]" />}
                        </div>

                        <div className="text-center w-full min-h-[60px]">
                            <h3 className="text-xl font-forum font-bold text-foreground truncate uppercase">{theirSide?.card?.name || '---'}</h3>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
                                {theirSide?.condition}
{' '}
•
{theirSide?.language}
{' '}
{theirSide?.is_foil ? '• Foil' : ''}
                            </p>
                        </div>

                        {!theirStatus && room.status === 'active' && (
                            <div className="mt-6 flex items-center gap-2">
                                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Acciones principales */}
                <div className="mt-auto pt-6 flex flex-col gap-3">
                    {room.status === 'active' && !myStatus && (
                        <button
                            onClick={handleConfirm}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 border-none"
                        >
                            Confirmar Operación
                        </button>
                    )}

                    {room.status === 'active' && (
                        <button
                            onClick={handleCancelTrade}
                            className="text-destructive font-black text-[10px] uppercase tracking-widest hover:underline pt-2"
                        >
                            Anular Intercambio
                        </button>
                    )}

                    {(room.status === 'completed' || room.status === 'cancelled') && (
                        <button
                            onClick={() => navigate('/inventory')}
                            className="bg-foreground text-background font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                            Volver a mi Inventario
                        </button>
                    )}
                </div>
            </div>

            {/* Panel de Chat (2/5) */}
            <div className="xl:col-span-2 bg-card/40 backdrop-blur-md border border-border rounded-2xl flex flex-col shadow-xl overflow-hidden min-h-[500px]">
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-border bg-accent/10 flex items-center justify-between">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Canal de Chat</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">
Privado con
{theirName}
</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase">Encriptado</span>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin mensajes aún</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.user_id === user.id;
                            return (
                                <div key={msg.id} className={cn('flex items-end gap-2 mb-4', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                                    <UserAvatar 
                                        src={msg.user_avatar}
                                        name={msg.user_name}
                                        className="h-8 w-8 rounded-lg bg-card border border-border flex-shrink-0 mb-5"
                                        fallbackClassName="text-[10px] font-black text-primary"
                                    />
                                    <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                                        <div className={cn(
                                            'max-w-[100%] px-4 py-3 rounded-xl text-sm leading-tight shadow-sm',
                                            isOwn ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground',
                                        )}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground font-medium mt-1 uppercase tracking-tighter px-1">
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border bg-accent/5">
                    {room.status === 'completed' || room.status === 'cancelled' ? (
                        <div className="p-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                            Chat histórico (solo lectura)
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <textarea
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe tu mensaje..."
                                rows={1}
                                className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none transition-all"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={sendingMsg || !chatInput.trim()}
                                className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Modal Inventario (Rediseñado) */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setShowInventoryModal(false)} />
          <div className="relative z-[110] bg-card/60 backdrop-blur-md border border-border p-8 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
              <h2 className="text-2xl font-forum font-bold text-foreground uppercase tracking-tight">Seleccionar Nueva Carta</h2>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="w-8 h-8 rounded-full bg-accent hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loadingInventory ? (
                <div className="flex flex-col justify-center items-center py-20 gap-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analizando Bóveda...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {inventoryCards.map((invCard: any) => {
                    const isAvailable = invCard.quantity > invCard.quantity_locked;
                    return (
                      <div
                        key={invCard.id}
                        className={cn(
                            'border rounded-xl p-3 bg-accent/20 flex flex-col items-center transition-all group',
                            isAvailable ? 'border-border hover:border-primary cursor-pointer' : 'border-destructive/20 opacity-30 cursor-not-allowed',
                        )}
                        onClick={() => isAvailable && handleChangeCard(invCard.id)}
                      >
                       <div className="w-full aspect-[2.5/3.5] bg-background rounded-lg mb-3 overflow-hidden border border-border/50 shadow-md">
                         {invCard.card?.image_url ? (
                           <img src={invCard.card.image_url.startsWith('http') ? invCard.card.image_url : `/storage/${invCard.card.image_url}`} alt={invCard.card.name} className="w-full h-full object-contain" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-[8px] font-black uppercase">Sin Imagen</div>
                         )}
                       </div>
                       <p className="text-foreground text-[11px] font-bold text-center truncate w-full uppercase">{invCard.card?.name}</p>
                       <p className="text-[9px] text-muted-foreground font-black uppercase mt-1 tracking-widest truncate w-full text-center">
x
{invCard.quantity - invCard.quantity_locked}
{' '}
Disp.
</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
