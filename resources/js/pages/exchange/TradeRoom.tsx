import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import { toast } from 'sonner';

export default function TradeRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [user, setUser] = useState<any>(null); // current user

  useEffect(() => {
    loadRoom();
    loadUser();
  }, [id]);

  const loadUser = async () => {
    const data = await apiService.checkAuth();
    setUser(data.user || data);
  };

  const loadRoom = async () => {
    try {
      const data = await apiService.getTradeRoom(Number(id));
      setRoom(data);
    } catch (e) {
      toast.error('Error al cargar la sala');
      navigate('/exchanges/manage');
    }
  };

  const handleConfirm = async () => {
    try {
      const data = await apiService.confirmTrade(Number(id));
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

  if (!room || !user) return <div className="p-10 text-center text-zinc-400 flex flex-col items-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>Cargando Sala...</div>;

  const req = room.exchange_request;
  const exch = req.exchange;

  // Determinar quién es quién
  const isUser1 = (exch.user_id === user.id); // el que la creó
  const mySide = isUser1 ? exch.offered_card : req.offered_card;
  const myStatus = isUser1 ? room.user1_confirmed : room.user2_confirmed;
  
  const theirSide = isUser1 ? req.offered_card : exch.offered_card;
  const theirStatus = isUser1 ? room.user2_confirmed : room.user1_confirmed;
  const theirName = isUser1 ? req?.user?.name : exch?.user?.name;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Sala de Transferencia</h1>
        <p className="text-zinc-400 mt-2 text-lg">Revisa las cartas antes de confirmar el intercambio definitivo.</p>
        
        {room.status === 'completed' && (
          <div className="inline-block mt-4 px-6 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full font-bold shadow-lg shadow-emerald-500/10">
            ✓ INTERCAMBIO COMPLETADO
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch relative">
        
        {/* Tu lado */}
        <div className="flex-1 bg-zinc-900 border-2 border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(99,102,241,0.5)]">Tú</span> 
              Lo que entregas
            </h2>
            <div className="bg-zinc-800/80 p-6 rounded-2xl border border-zinc-700/50 flex flex-col items-center">
              <div className="w-40 h-56 bg-zinc-700 rounded-lg mb-4 border-2 border-indigo-500/50 shadow-lg relative flex items-center justify-center overflow-hidden">
                {mySide?.card?.image_url ? (
                  <img src={mySide.card.image_url.startsWith('http') ? mySide.card.image_url : `/storage/${mySide.card.image_url}`} alt={mySide.card.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-400 font-bold uppercase rotate-45 opacity-20 text-3xl">Carta</span>
                )}
              </div>
              <p className="text-2xl font-bold text-white text-center">{mySide?.card?.name}</p>
              <p className="text-zinc-400 capitalize mt-1 text-center">{mySide?.condition} • {mySide?.language} {mySide?.is_foil ? '• Foil' : ''}</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            {myStatus ? (
              <p className="text-emerald-400 font-bold bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20">Has confirmado</p>
            ) : (
              <p className="text-amber-400 font-medium py-3">Esperando tu confirmación...</p>
            )}
          </div>
        </div>

        {/* The Trade Arrow */}
        <div className="flex items-center justify-center md:px-4 z-10 py-6 md:py-0">
          <div className="w-16 h-16 bg-zinc-800 rounded-full border-4 border-zinc-900 shadow-2xl flex items-center justify-center transform md:rotate-0 rotate-90 relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
        </div>

        {/* Lado del otro jugador */}
        <div className="flex-1 bg-zinc-900 border-2 border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full"></div>
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(244,63,94,0.5)]">{(theirName?.charAt(0) || 'U').toUpperCase()}</span> 
              Lo que recibes
            </h2>
            <div className="bg-zinc-800/80 p-6 rounded-2xl border border-zinc-700/50 flex flex-col items-center">
              <div className="w-40 h-56 bg-zinc-700 rounded-lg mb-4 border-2 border-rose-500/50 shadow-lg relative flex items-center justify-center overflow-hidden">
                {theirSide?.card?.image_url ? (
                  <img src={theirSide.card.image_url.startsWith('http') ? theirSide.card.image_url : `/storage/${theirSide.card.image_url}`} alt={theirSide.card.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-400 font-bold uppercase -rotate-45 opacity-20 text-3xl">Carta</span>
                )}
              </div>
              <p className="text-2xl font-bold text-white text-center">{theirSide?.card?.name}</p>
              <p className="text-zinc-400 capitalize mt-1 text-center">{theirSide?.condition} • {theirSide?.language} {theirSide?.is_foil ? '• Foil' : ''}</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            {theirStatus ? (
              <p className="text-emerald-400 font-bold bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20">{theirName} ha confirmado</p>
            ) : (
              <p className="text-zinc-500 font-medium py-3 relative overflow-hidden">
                <span className="inline-block animate-pulse">Esperando a que confirme...</span>
              </p>
            )}
          </div>
        </div>

      </div>

      {room.status === 'active' && !myStatus && (
        <div className="mt-12 text-center max-w-sm mx-auto">
          <p className="text-zinc-400 text-sm mb-4">Nota: Esta acción es irreversible. Asegúrate de verificar las condiciones y la carta recibida.</p>
          <button 
            onClick={handleConfirm}
            className="w-full bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all active:scale-95 border border-emerald-400/50 tracking-wide text-lg"
          >
            CONFIRMAR INTERCAMBIO
          </button>
        </div>
      )}
      
      {room.status === 'completed' && (
        <div className="mt-12 text-center">
          <button onClick={() => navigate('/inventory')} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all">
            Ir a mi Inventario
          </button>
        </div>
      )}

    </div>
  );
}
