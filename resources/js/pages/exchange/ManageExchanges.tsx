import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';

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
    <div className="flex-1 text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border pb-6">
            <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-widest font-black text-primary">Intercambios Personales</span>
                <h1 className="text-4xl md:text-5xl font-forum font-bold text-foreground">
                    Gestión de Peticiones
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <a href="/exchanges" className="bg-accent text-foreground font-black text-xs uppercase tracking-widest h-11 px-8 py-3.5 rounded-xl hover:bg-background hover:border-primary/50 transition-all border border-border shadow-sm text-center leading-none">
                  Volver al Mercado
                </a>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Recibidas */}
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-2">
              <h2 className="text-lg font-forum font-bold text-foreground">OFERTAS RECIBIDAS</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
{received.length}
{' '}
RESULTADOS
</span>
            </div>

            <div className="space-y-4">
              {received.length === 0 && (
                <div className="bg-accent/30 border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                  <p className="text-xs uppercase tracking-widest font-black opacity-60">No tienes ofertas recibidas</p>
                </div>
              )}
              {received.map((req: any) => (
                <div key={req.id} className="border border-border rounded-xl p-4 bg-card/40 backdrop-blur-md w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1">

                  <div className="flex items-center gap-3 border-b border-border/50 pb-3 mb-3">
                    <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0">
                      {req.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-primary flex-1 truncate">
{req.user?.name}
{' '}
ofrece:
</p>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-20 bg-accent rounded-md overflow-hidden shrink-0 shadow-sm">
                      {req.offered_card?.card?.image_url ? (
                        <img
                          src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`}
                          alt={req.offered_card.card.name}
className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-black uppercase">No img</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-foreground tracking-tight">{req.offered_card?.card?.name}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                        {req.offered_card?.condition}
{' '}
•
{req.offered_card?.language}
                      </p>
                    </div>
                  </div>

                  <div className="bg-accent/30 p-3 rounded-lg flex items-center gap-3 mb-4">
                    <div className="w-8 h-12 bg-background rounded overflow-hidden shrink-0 grayscale opacity-80">
                      {req.exchange?.offered_card?.card?.image_url && (
                        <img
                          src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`}
                          alt="tu carta"
className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">Por tu carta:</p>
                      <p className="text-sm font-bold text-foreground truncate mt-0.5">{req.exchange?.offered_card?.card?.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleReject(req.id)} className="flex-1 bg-accent border border-border hover:bg-background text-foreground font-black text-[10px] uppercase tracking-widest py-2 rounded-lg transition-all">Rechazar</button>
                    <button onClick={() => handleAccept(req.id)} className="flex-1 bg-primary border border-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest py-2 rounded-lg shadow-lg transition-all">Aceptar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enviadas */}
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-2">
              <h2 className="text-lg font-forum font-bold text-foreground">OFERTAS ENVIADAS</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
{sent.length}
{' '}
RESULTADOS
</span>
            </div>

            <div className="space-y-4">
              {sent.length === 0 && (
                <div className="bg-accent/30 border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                  <p className="text-xs uppercase tracking-widest font-black opacity-60">No has enviado ofertas</p>
                </div>
              )}
              {sent.map((req: any) => (
                <div key={req.id} className="border border-border rounded-xl p-4 bg-card/40 backdrop-blur-md w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">ESTADO</span>
                      <span className={req.status === 'accepted' ? 'px-2 py-1 text-[9px] rounded bg-emerald-500/10 text-emerald-500 uppercase font-black' : 'px-2 py-1 text-[9px] rounded bg-accent text-primary uppercase font-black'}>
                        {req.status}
                      </span>
                   </div>

                   <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center bg-accent/40 p-2.5 rounded-lg border border-border/50">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0 mr-2">Ofreciste:</span>
                        <div className="flex items-center gap-2 min-w-0">
                          {req.offered_card?.card?.image_url && (
                            <img
                              src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`}
                              className="w-5 h-7 object-cover rounded"
alt="carta"
                            />
                          )}
                          <span className="font-bold text-foreground truncate text-sm">{req.offered_card?.card?.name}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-primary/5 p-2.5 rounded-lg border border-primary/20">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest shrink-0 mr-2">Por:</span>
                        <div className="flex items-center gap-2 min-w-0">
                          {req.exchange?.offered_card?.card?.image_url && (
                            <img
                              src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`}
                              className="w-5 h-7 object-cover rounded"
alt="carta"
                            />
                          )}
                          <span className="font-bold text-primary truncate text-sm">{req.exchange?.offered_card?.card?.name}</span>
                        </div>
                      </div>
                   </div>

                   {req.status === 'accepted' && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                       <button
                          onClick={() => navigate(`/trade/${req.trade_session?.id || req.id}`)}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-2.5 rounded-lg transition-all shadow-lg text-[10px] uppercase tracking-widest"
                       >
                          Ir a Sala
                       </button>
                    </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="mt-16">
          <div className="mb-6 border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-xl font-forum font-bold text-foreground">HISTORIAL DE COMPLETADOS</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
{completed.length}
{' '}
RESULTADOS
</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completed.length === 0 && (
              <div className="col-span-full py-16 bg-accent/30 border border-dashed border-border rounded-xl text-center text-muted-foreground">
                 <p className="text-xs uppercase tracking-widest font-black opacity-60">No hay historial</p>
              </div>
            )}

            {completed.map((hist: any) => {
              const date = new Date(hist.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
              const myCard = hist.exchange?.user_id === hist.user_id ? hist.exchange?.offered_card?.card?.name : hist.offered_card?.card?.name;
              const theirCard = hist.exchange?.user_id === hist.user_id ? hist.offered_card?.card?.name : hist.exchange?.offered_card?.card?.name;

              return (
                <div key={`hist-${hist.id}`} className="border border-border rounded-xl p-4 bg-card/40 backdrop-blur-md w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30">
                  <div className="flex justify-between items-center mb-3">
                      <p className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">{date}</p>
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tight">✓ ÉXITO</p>
                  </div>

                  <div className="flex-1 bg-accent/40 p-3 rounded-lg border border-border/50 min-w-0 mb-2">
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-80">Entregaste</p>
                    <p className="text-sm text-foreground font-bold truncate leading-tight">{myCard}</p>
                  </div>

                  <div className="flex-1 bg-primary/5 p-3 rounded-lg border border-primary/20 min-w-0">
                    <p className="text-[8px] text-primary uppercase font-black tracking-widest mb-1 opacity-80">Recibiste</p>
                    <p className="text-sm text-primary font-bold truncate leading-tight">{theirCard}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
