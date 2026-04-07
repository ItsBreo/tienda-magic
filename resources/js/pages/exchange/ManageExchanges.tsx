import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/ApiService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ManageExchanges() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await apiService.getMyRequests();
      setSent(data.sent);
      setReceived(data.received);
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
    <div className="p-6 max-w-5xl mx-auto text-zinc-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gestionar Intercambios</h1>
        <p className="text-zinc-400 mt-2">Revisa las ofertas que te han enviado o las que has propuesto a otros.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recibidas */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-emerald-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            Ofertas Recibidas
          </h2>
          <div className="space-y-4">
            {received.length === 0 && (
              <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500">
                No tienes ofertas recibidas.
              </div>
            )}
            {received.map((req: any) => (
              <div key={req.id} className="bg-zinc-800/80 border border-zinc-700 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-medium text-emerald-400">{req.user?.name} te ofrece:</span>
                    <div className="flex items-center gap-3 mt-2">
                      {req.offered_card?.card?.image_url && (
                        <img 
                          src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`} 
                          alt={req.offered_card.card.name} className="w-12 h-16 object-cover rounded border border-zinc-700 shadow" 
                        />
                      )}
                      <div>
                        <p className="text-lg font-bold text-white">{req.offered_card?.card?.name}</p>
                        <p className="text-xs text-zinc-400">{req.offered_card?.condition} • {req.offered_card?.language}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {req.exchange?.offered_card?.card?.image_url && (
                      <img 
                        src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`} 
                        alt="tu carta" className="w-8 h-12 object-cover rounded border border-zinc-700 opacity-80" 
                      />
                    )}
                    <div>
                      <p className="text-xs text-zinc-500">A cambio de tu:</p>
                      <p className="font-medium text-zinc-300">{req.exchange?.offered_card?.card?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleAccept(req.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-all">Aceptar y Abrir Sala</button>
                  <button onClick={() => handleReject(req.id)} className="flex-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-600/30 py-2 rounded-xl transition-all">Rechazar</button>
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
              <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500">
                No has enviado ofertas.
              </div>
            )}
            {sent.map((req: any) => (
              <div key={req.id} className="bg-zinc-800/80 border border-zinc-700 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-1 text-xs rounded-md bg-zinc-700 text-zinc-300 uppercase font-semibold tracking-wider">
                      Estado: {req.status}
                    </span>
                 </div>
                 
                 <div className="bg-zinc-900/50 p-4 rounded-xl mt-3 space-y-2">
                    <div className="flex justify-between items-center bg-zinc-800/40 p-2 rounded-lg">
                      <span className="text-sm text-zinc-400">Ofreciste:</span>
                      <div className="flex items-center gap-2">
                        {req.offered_card?.card?.image_url && (
                          <img 
                            src={req.offered_card.card.image_url.startsWith('http') ? req.offered_card.card.image_url : `/storage/${req.offered_card.card.image_url}`} 
                            className="w-6 h-9 object-cover rounded" alt="carta"
                          />
                        )}
                        <span className="font-medium text-white">{req.offered_card?.card?.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-indigo-900/10 p-2 rounded-lg border border-indigo-500/10">
                      <span className="text-sm text-zinc-400">Por la carta de:</span>
                      <div className="flex items-center gap-2">
                        {req.exchange?.offered_card?.card?.image_url && (
                          <img 
                            src={req.exchange.offered_card.card.image_url.startsWith('http') ? req.exchange.offered_card.card.image_url : `/storage/${req.exchange.offered_card.card.image_url}`} 
                            className="w-6 h-9 object-cover rounded" alt="carta"
                          />
                        )}
                        <span className="font-medium text-indigo-400">{req.exchange?.offered_card?.card?.name}</span>
                      </div>
                    </div>
                 </div>

                 {req.status === 'accepted' && (
                  <div className="mt-4">
                     <p className="text-sm text-emerald-400 mb-2 font-medium bg-emerald-500/10 p-2 rounded-lg text-center">¡El usuario aceptó tu oferta!</p>
                     <button onClick={() => navigate(`/trade/${req.trade_session?.id || req.id}`)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg active:scale-95">Ir a Sala de Intercambio</button>
                  </div>
                 )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
