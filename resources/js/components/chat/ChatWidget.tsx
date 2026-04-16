import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';

interface User {
  id: number;
  username: string;
}

interface ChatWidgetProps {
  conversationId: string | null;
  currentUser: User;
  token: string | null;
  onClose?: () => void;
}

export default function ChatWidget({ conversationId, currentUser, token, onClose }: ChatWidgetProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage, connectionStatus } = useChat(conversationId, token);

  // Auto-scroll interno al contenedor de mensajes
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      const container = chatScrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]); // Se ejecuta cuando cambian los mensajes

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;

    const optimisticInput = input;
    setInput('');
    setSending(true);

    try {
      await sendMessage(optimisticInput);
    } catch (err) {
      // Restaurar input si falla
      setInput(optimisticInput);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // CRÍTICO: Evita el salto de línea visual nativo del navegador
      handleSendMessage();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-400';
      case 'connecting': return 'bg-yellow-400';
      default: return 'bg-red-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      default: return 'Desconectado';
    }
  };

  return (
    <section className="px-6 md:px-12 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <MessageSquare className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 tracking-wide">
            Chat
          </h2>
          <p className="text-xs text-zinc-500">Conversación en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-xs text-zinc-600 font-mono">
            {getStatusText()}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl">
        {/* Messages */}
        <div ref={chatScrollContainerRef} className="h-96 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
                <p className="text-xs text-zinc-600">Cargando mensajes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-red-400 mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-zinc-600 text-center">
                Sin mensajes aún.
                <br />
                ¡Inicia la conversación!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user?.id === currentUser.id;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-sm flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && message.user && (
                      <span className="text-xs text-zinc-500 px-1">{message.user?.username || 'Usuario'}</span>
                    )}
                    <div className={`px-3.5 py-2 rounded-xl text-sm leading-relaxed ${isOwn
                      ? 'bg-emerald-600/90 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                    }`}>
                      {message.content}
                      {message.edited_at && (
                        <span className="text-xs opacity-70 ml-1">(editado)</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-600 px-1">
                      {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 p-3 border-t border-zinc-800/60 bg-zinc-900/60 rounded-b-xl">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
            disabled={connectionStatus !== 'connected' || isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || sending || connectionStatus !== 'connected' || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-lg transition-colors flex-shrink-0"
          >
            {sending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
      </div>
    </section>
  );
}
