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
        <h1 className="text-3xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
            Gestionar Intercambios
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">Revisa las ofertas que te han enviado o las que has propuesto a otros.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Recibidas */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            Ofertas Recibidas
          </h2>
          <div className="space-y-4">
            {received.length === 0 && (
              <div className="bg-card/30 border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                No tienes ofertas recibidas en este momento.
              </div>
            )}
            {received.map((req: any) => (
              <div key={req.id} className="bg-card border border-border p-5 rounded-2xl shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                <div className="flex justify-between items-start mb-3 pl-2">
                  <div>
                    <span className="text-sm font-bold text-primary italic">{req.user?.name} te ofrece:</span>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="w-14 h-20 bg-accent rounded-md border border-border overflow-hidden shrink-0 shadow-sm">
                        {req.offered_card?.card?.image_url && (
                          <img 
                            src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`} 
                            alt={req.offered_card.card.name} className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-black text-foreground truncate">{req.offered_card?.card?.name}</p>
                        <p className="text-xs text-muted-foreground font-medium uppercase mt-1">
                          {req.offered_card?.condition} • {req.offered_card?.language}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/40 p-3 rounded-xl flex items-center justify-between gap-3 mb-4 ml-2 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-12 bg-background rounded border border-border overflow-hidden shrink-0">
                      {req.exchange?.offered_card?.card?.image_url && (
                        <img 
                          src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`} 
                          alt="tu carta" className="w-full h-full object-cover opacity-60" 
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">A cambio de tu:</p>
                      <p className="text-sm font-bold text-foreground truncate">{req.exchange?.offered_card?.card?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pl-2">
                  <button onClick={() => handleAccept(req.id)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl transition-all shadow-lg active:scale-95">Aceptar y Abrir Sala</button>
                  <button onClick={() => handleReject(req.id)} className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 py-2.5 rounded-xl transition-all font-bold">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enviadas */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            Ofertas Enviadas
          </h2>
          <div className="space-y-4">
            {sent.length === 0 && (
              <div className="bg-card/30 border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                No has enviado ofertas recientemente.
              </div>
            )}
            {sent.map((req: any) => (
              <div key={req.id} className="bg-card border border-border p-5 rounded-2xl shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
                 <div className="absolute top-0 right-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                 <div className="flex justify-between items-center mb-2 pr-2">
                    <span className="px-2 py-1 text-[10px] rounded-md bg-accent text-primary border border-primary/20 uppercase font-black tracking-widest">
                      Estado: {req.status}
                    </span>
                 </div>
                 
                 <div className="bg-accent/40 p-4 rounded-xl mt-3 space-y-2 pr-2 border border-border/50">
                    <div className="flex justify-between items-center bg-background/60 p-2 rounded-lg border border-border/50">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ofreciste:</span>
                      <div className="flex items-center gap-2 min-w-0">
                        {req.offered_card?.card?.image_url && (
                          <img 
                            src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`} 
                            className="w-6 h-9 object-cover rounded border border-border shadow-sm" alt="carta"
                          />
                        )}
                        <span className="font-bold text-foreground truncate text-sm">{req.offered_card?.card?.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-primary/5 p-2 rounded-lg border border-primary/20">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Por la carta de:</span>
                      <div className="flex items-center gap-2 min-w-0">
                        {req.exchange?.offered_card?.card?.image_url && (
                          <img 
                            src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`} 
                            className="w-6 h-9 object-cover rounded border border-border shadow-sm" alt="carta"
                          />
                        )}
                        <span className="font-bold text-primary truncate text-sm">{req.exchange?.offered_card?.card?.name}</span>
                      </div>
                    </div>
                 </div>

                 {req.status === 'accepted' && (
                  <div className="mt-4 pr-2">
                     <p className="text-xs text-primary mb-3 font-black bg-primary/10 border border-primary/20 p-2.5 rounded-xl text-center uppercase tracking-widest">¡Tu oferta ha sido aceptada!</p>
                     <button 
                        onClick={() => navigate(`/trade/${req.trade_session?.id || req.id}`)} 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-3 rounded-xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wider"
                     >
                        Ir a Sala de Intercambio
                     </button>
                  </div>
                 )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* HISTORIAL DE INTERCAMBIOS */}
      <div className="mt-20">
        <h2 className="text-2xl font-black mb-8 text-foreground flex items-center gap-3 border-b border-border pb-5">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Historial de Intercambios
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completed.length === 0 && (
            <div className="col-span-full py-20 bg-card/30 border border-border border-dashed rounded-2xl text-center text-muted-foreground shadow-inner">
               <svg className="w-16 h-16 mx-auto mb-4 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
               <p className="text-lg">Todavía no has operado ningún intercambio completado.</p>
            </div>
          )}

          {completed.map((hist: any) => {
            const date = new Date(hist.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <div key={`hist-${hist.id}`} className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-xl hover:border-primary/30 transition-colors">
                <div className="flex-1 bg-background/50 p-3 rounded-xl border border-border min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5 opacity-60">Entregaste</p>
                  <p className="text-sm text-foreground font-bold truncate">{hist.exchange?.user_id === hist.user_id ? hist.exchange?.offered_card?.card?.name : hist.offered_card?.card?.name}</p>
                </div>
                
                <div className="px-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                </div>

                <div className="flex-1 bg-background/50 p-3 rounded-xl border border-border min-w-0">
                  <p className="text-[10px] text-primary/70 uppercase font-black tracking-widest mb-1.5">Recibiste</p>
                  <p className="text-sm text-primary font-bold truncate">{hist.exchange?.user_id === hist.user_id ? hist.offered_card?.card?.name : hist.exchange?.offered_card?.card?.name}</p>
                </div>
                
                <div className="ml-5 text-right min-w-[85px] border-l border-border pl-4">
                  <p className="text-[11px] text-muted-foreground font-medium">{date}</p>
                  <p className="text-[10px] text-emerald-500 font-black uppercase mt-1 tracking-tight">✓ Éxito</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
