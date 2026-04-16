import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/ApiService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ManageExchanges() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [completed, setCompleted] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await apiService.getMyRequests();
      setSent(data.sent);
      setReceived(data.received);
      setCompleted(data.completed || []);
    } catch (e) {
      toast.error('Error al cargar tus peticiones');
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const response = await apiService.acceptTradeRequest(id);
      toast.success('Petición aceptada. Entrando a la sala...');
      navigate(`/trade/${response.id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al aceptar');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiService.rejectTradeRequest(id);
      toast.success('Petición rechazada');
      loadRequests();
    } catch (e: any) {
      toast.error('Error al rechazar');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-foreground min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Gestionar Intercambios</h1>
        <p className="text-muted-foreground mt-2">Revisa las ofertas que te han enviado o las que has propuesto a otros.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Recibidas (Código Omitido por Brevedad, mantenemos el mismo de antes) */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-emerald-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            Ofertas Recibidas
          </h2>
          <div className="space-y-4">
            {received.length === 0 && (
              <div className="bg-accent/30 border border-border rounded-xl p-6 text-center text-muted-foreground">
                No tienes ofertas recibidas.
              </div>
            )}
            {received.map((req: any) => (
              <div key={req.id} className="bg-accent/80 border border-border p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-medium text-emerald-400">{req.user?.name} te ofrece:</span>
                    <div className="flex items-center gap-3 mt-2">
                      {req.offered_card?.card?.image_url && (
                        <img 
                          src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`} 
                          alt={req.offered_card.card.name} className="w-12 h-16 object-cover rounded border border-border shadow" 
                        />
                      )}
                      <div>
                        <p className="text-lg font-bold text-foreground">{req.offered_card?.card?.name}</p>
                        <p className="text-xs text-muted-foreground">{req.offered_card?.condition} • {req.offered_card?.language}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-background/50 p-3 rounded-lg flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {req.exchange?.offered_card?.card?.image_url && (
                      <img 
                        src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`} 
                        alt="tu carta" className="w-8 h-12 object-cover rounded border border-border opacity-80" 
                      />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">A cambio de tu:</p>
                      <p className="font-medium text-foreground">{req.exchange?.offered_card?.card?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleAccept(req.id)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-xl transition-all">Aceptar y Abrir Sala</button>
                  <button onClick={() => handleReject(req.id)} className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 py-2 rounded-xl transition-all">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enviadas */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            Ofertas Enviadas
          </h2>
          <div className="space-y-4">
            {sent.length === 0 && (
              <div className="bg-accent/30 border border-border rounded-xl p-6 text-center text-muted-foreground">
                No has enviado ofertas.
              </div>
            )}
            {sent.map((req: any) => (
              <div key={req.id} className="bg-accent/80 border border-border p-5 rounded-2xl shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-1 text-xs rounded-md bg-accent text-muted-foreground uppercase font-semibold tracking-wider">
                      Estado: {req.status}
                    </span>
                 </div>
                 
                 <div className="bg-background/50 p-4 rounded-xl mt-3 space-y-2">
                    <div className="flex justify-between items-center bg-accent/40 p-2 rounded-lg">
                      <span className="text-sm text-muted-foreground">Ofreciste:</span>
                      <div className="flex items-center gap-2">
                        {req.offered_card?.card?.image_url && (
                          <img 
                            src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`} 
                            className="w-6 h-9 object-cover rounded border border-border" alt="carta"
                          />
                        )}
                        <span className="font-medium text-foreground">{req.offered_card?.card?.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-primary/10 p-2 rounded-lg border border-primary/20">
                      <span className="text-sm text-muted-foreground">Por la carta de:</span>
                      <div className="flex items-center gap-2">
                        {req.exchange?.offered_card?.card?.image_url && (
                          <img 
                            src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`} 
                            className="w-6 h-9 object-cover rounded border border-border" alt="carta"
                          />
                        )}
                        <span className="font-medium text-primary">{req.exchange?.offered_card?.card?.name}</span>
                      </div>
                    </div>
                 </div>

                 {req.status === 'accepted' && (
                  <div className="mt-4">
                     <p className="text-sm text-emerald-400 mb-2 font-medium bg-emerald-500/10 p-2 rounded-lg text-center">¡El usuario aceptó tu oferta!</p>
                     <button onClick={() => navigate(`/trade/${req.trade_session?.id || req.id}`)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-all shadow-lg active:scale-95">Ir a Sala de Intercambio</button>
                  </div>
                 )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* HISTORIAL DE INTERCAMBIOS */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2 border-b border-border pb-4">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Historial de Intercambios
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completed.length === 0 && (
            <div className="col-span-full py-10 bg-accent/30 border border-border border-dashed rounded-xl text-center text-muted-foreground">
              Todavía no has completado ningún intercambio.
            </div>
          )}

          {completed.map((hist: any) => {
            const date = new Date(hist.updated_at).toLocaleDateString();
            return (
              <div key={`hist-${hist.id}`} className="bg-accent/50 border border-border/50 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex-1 bg-background/50 p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Carta Entregada</p>
                  <p className="text-sm text-foreground font-medium truncate">{hist.exchange?.user_id === hist.user_id ? hist.exchange?.offered_card?.card?.name : hist.offered_card?.card?.name}</p>
                </div>
                
                <div className="px-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                </div>

                <div className="flex-1 bg-background/50 p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Carta Recibida</p>
                  <p className="text-sm text-primary font-medium truncate">{hist.exchange?.user_id === hist.user_id ? hist.offered_card?.card?.name : hist.exchange?.offered_card?.card?.name}</p>
                </div>
                
                <div className="ml-4 text-right min-w-[70px]">
                  <p className="text-xs text-muted-foreground">{date}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Completado</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
