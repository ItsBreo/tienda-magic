import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import { toast } from 'sonner';

interface ChatMessage {
  id: number;
  content: string;
  user_id: number;
  user_name: string;
  created_at: string;
}

export default function TradeRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadRoom();
    loadUser();
  }, [sessionId]);

  // Start polling once we have the session id
  useEffect(() => {
    if (!sessionId) return;
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setMessages(data.data ?? []);
    } catch {
      // Silencioso — el chat puede no estar inicializado aún
    }
  };

  const handleSendMessage = async () => {
    const content = chatInput.trim();
    if (!content || sendingMsg) return;
    setSendingMsg(true);
    try {
      const msg = await apiService.sendTradeMessage(Number(sessionId), content);
      setChatInput('');
      setMessages((prev) => [...prev, msg]);
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

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (!room || !user) return (
    <div className="p-10 text-center text-muted-foreground flex flex-col items-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      Cargando Sala...
    </div>
  );

  const req = room.exchange_request;
  const exch = req.exchange;

  const isUser1 = (exch.user_id === user.id);
  const mySide = isUser1 ? exch.offered_card : req.offered_card;
  const myStatus = isUser1 ? room.user1_confirmed : room.user2_confirmed;
  const theirSide = isUser1 ? req.offered_card : exch.offered_card;
  const theirStatus = isUser1 ? room.user2_confirmed : room.user1_confirmed;
  const theirName = isUser1 ? req?.user?.name : exch?.user?.name;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Sala de Transferencia
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Revisa las cartas y coordínate con tu rival antes de confirmar.
        </p>
        {room.status === 'completed' && (
          <div className="inline-block mt-4 px-6 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-full font-bold shadow-lg shadow-emerald-500/10">
            ✓ INTERCAMBIO COMPLETADO
          </div>
        )}
      </div>

      {/* Main Grid: Cards left (3/5), Chat right (2/5) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

        {/* ── Trade cards column ── */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch relative">

            {/* Tu lado */}
            <div className="flex-1 bg-background border-2 border-primary/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm shadow-sm text-primary-foreground">Tú</span>
                  Lo que entregas
                </h2>
                <div className="bg-accent/80 p-6 rounded-2xl border border-border flex flex-col items-center">
                  <div className="w-40 h-56 bg-accent rounded-lg mb-4 border-2 border-primary/50 shadow-lg relative flex items-center justify-center overflow-hidden">
                    {mySide?.card?.image_url ? (
                      <img
                        src={mySide.card.image_url.startsWith('http') ? mySide.card.image_url : `/storage/${mySide.card.image_url}`}
                        alt={mySide.card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground font-bold uppercase rotate-45 opacity-20 text-3xl">Carta</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground text-center">{mySide?.card?.name}</p>
                  <p className="text-muted-foreground capitalize mt-1 text-center">
                    {mySide?.condition} • {mySide?.language} {mySide?.is_foil ? '• Foil' : ''}
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                {myStatus ? (
                  <p className="text-emerald-500 font-bold bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20">
                    Has confirmado
                  </p>
                ) : (
                  <p className="text-amber-500 font-medium py-3">Esperando tu confirmación...</p>
                )}
              </div>
            </div>

            {/* Trade Arrow */}
            <div className="flex items-center justify-center md:px-4 z-10 py-4 md:py-0">
              <div className="w-14 h-14 bg-accent rounded-full border-4 border-background shadow-2xl flex items-center justify-center transform md:rotate-0 rotate-90 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>

            {/* Lado rival */}
            <div className="flex-1 bg-background border-2 border-destructive/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-32 h-32 bg-destructive/20 blur-3xl rounded-full"></div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-sm shadow-sm text-destructive-foreground">
                    {(theirName?.charAt(0) || 'U').toUpperCase()}
                  </span>
                  Lo que recibes
                </h2>
                <div className="bg-accent/80 p-6 rounded-2xl border border-border flex flex-col items-center">
                  <div className="w-40 h-56 bg-accent rounded-lg mb-4 border-2 border-destructive/50 shadow-lg relative flex items-center justify-center overflow-hidden">
                    {theirSide?.card?.image_url ? (
                      <img
                        src={theirSide.card.image_url.startsWith('http') ? theirSide.card.image_url : `/storage/${theirSide.card.image_url}`}
                        alt={theirSide.card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground font-bold uppercase -rotate-45 opacity-20 text-3xl">Carta</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground text-center">{theirSide?.card?.name}</p>
                  <p className="text-muted-foreground capitalize mt-1 text-center">
                    {theirSide?.condition} • {theirSide?.language} {theirSide?.is_foil ? '• Foil' : ''}
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                {theirStatus ? (
                  <p className="text-emerald-500 font-bold bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20">
                    {theirName} ha confirmado
                  </p>
                ) : (
                  <p className="text-muted-foreground font-medium py-3">
                    <span className="inline-block animate-pulse">Esperando a que confirme...</span>
                  </p>
                )}
              </div>
            </div>

          </div>{/* end cards row */}

          {/* Confirm button */}
          {room.status === 'active' && !myStatus && (
            <div className="text-center max-w-sm mx-auto">
              <p className="text-muted-foreground text-sm mb-4">
                Nota: Esta acción es irreversible. Asegúrate de verificar las condiciones y la carta recibida.
              </p>
              <button
                id="confirm-trade-btn"
                onClick={handleConfirm}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 border border-primary/50 tracking-wide text-lg"
              >
                CONFIRMAR INTERCAMBIO
              </button>
            </div>
          )}

          {room.status === 'completed' && (
            <div className="text-center">
              <button
                onClick={() => navigate('/inventory')}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all"
              >
                Ir a mi Inventario
              </button>
            </div>
          )}
        </div>

        {/* ── Chat panel ── */}
        <div
          className="xl:col-span-2 flex flex-col bg-background border border-border rounded-3xl shadow-2xl overflow-hidden"
          style={{ minHeight: '520px', maxHeight: '640px' }}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-accent/60 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                💬
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background"></span>
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm leading-none">Chat de la sala</p>
              <p className="text-muted-foreground text-xs mt-0.5">con {theirName ?? 'Rival'}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En vivo
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none pt-12">
                <span className="text-5xl mb-3 opacity-30">💬</span>
                <p className="text-sm">Sin mensajes aún.</p>
                <p className="text-xs mt-1 opacity-70">¡Saluda a tu rival!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user_id === user.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <span className="text-xs text-muted-foreground mb-1 ml-2">{msg.user_name}</span>
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-accent text-foreground border border-border rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 mx-2">{formatTime(msg.created_at)}</span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border bg-accent/40 px-4 py-3 flex-shrink-0">
            {room.status === 'completed' ? (
              <p className="text-center text-muted-foreground text-sm py-2 italic">El intercambio ha finalizado.</p>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  id="chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                  rows={2}
                  className="flex-1 bg-background text-foreground text-sm placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none transition-colors"
                />
                <button
                  id="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={sendingMsg || !chatInput.trim()}
                  className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  {sendingMsg ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>{/* end chat panel */}

      </div>{/* end main grid */}

    </div>
  );
}
