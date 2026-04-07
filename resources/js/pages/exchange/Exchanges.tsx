import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/ApiService';
import { toast } from 'sonner';

export default function Exchanges() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [genericCards, setGenericCards] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [selectedExchange, setSelectedExchange] = useState<any>(null);
  const [selectedInventoryCardId, setSelectedInventoryCardId] = useState<any>('');
  
  const [newOfferCardId, setNewOfferCardId] = useState<any>('');
  const [newRequestCardId, setNewRequestCardId] = useState<any>('');

  useEffect(() => {
    loadExchanges();
    loadInventory();
    loadGenericCards();
  }, []);

  const loadExchanges = async () => {
    try {
      const data = await apiService.getExchanges();
      setExchanges(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      toast.error('Error al cargar intercambios');
    }
  };

  const loadInventory = async () => {
    try {
      const resp = await apiService.getMyInventory();
      let arr = [];
      // Si el backend devuelve { inventoryCards: { data: [...] } }
      if (resp?.inventoryCards?.data) {
        arr = resp.inventoryCards.data;
      } else if (Array.isArray(resp?.inventoryCards)) {
        arr = resp.inventoryCards;
      } else if (Array.isArray(resp)) {
        arr = resp;
      }
      setInventory(arr); 
    } catch (error) {
      toast.error('Error al cargar tu inventario');
    }
  };

  const loadGenericCards = async () => {
    try {
      const data = await apiService.getAllCards();
      let arr = Array.isArray(data) ? data : (data?.data || []);
      setGenericCards(arr);
    } catch (error) {
      // no fallback needed
      setGenericCards([]);
    }
  };

  const handleRequestClick = (exchange: any) => {
    setSelectedExchange(exchange);
    setIsModalOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedInventoryCardId) return toast.error('Selecciona una carta para ofrecer');
    try {
      await apiService.requestExchange(selectedExchange.id, {
        offered_inventory_card_id: selectedInventoryCardId
      });
      toast.success('Solicitud enviada correctamente');
      setIsModalOpen(false);
      setSelectedInventoryCardId('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al enviar solicitud');
    }
  };

  const submitCreateListing = async () => {
    if (!newOfferCardId) return toast.error('Debes ofertar al menos una carta de tu inventario');
    try {
      await apiService.createExchange({
        offered_inventory_card_id: newOfferCardId,
        requested_card_id: newRequestCardId || null,
      });
      toast.success('¡Oferta publicada globalmente!');
      setIsCreateModalOpen(false);
      setNewOfferCardId('');
      setNewRequestCardId('');
      loadExchanges();
      loadInventory();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al crear publicación');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-zinc-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Mercado de Intercambios
          </h1>
          <p className="text-zinc-400 mt-2">Busca cartas y propón intercambios a otros jugadores.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg hover:shadow-indigo-500/20 rounded-lg transition-all"
          >
            Publicar Oferta
          </button>
          <a href="/exchanges/manage" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700 hover:border-zinc-500">
            Gestionar mis Peticiones
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(exchanges || []).map((exchange: any) => (
          <div key={exchange.id} className="bg-zinc-800/50 border border-zinc-700/50 p-5 rounded-2xl shadow-xl hover:shadow-indigo-500/10 transition-all backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
            
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center">
                <span className="text-indigo-400 font-bold">{exchange.user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-zinc-200">{exchange.user?.name}</p>
                <p className="text-xs text-indigo-400 font-medium">Ofrece el siguiente artículo:</p>
              </div>
            </div>
            
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl mb-5 flex gap-4 items-center">
              {exchange.offered_card?.card?.image_url && (
                <img 
                  src={exchange.offered_card.card.image_url.startsWith('http') ? exchange.offered_card.card.image_url : `/storage/${exchange.offered_card.card.image_url}`} 
                  alt={exchange.offered_card?.card?.name} 
                  className="w-16 h-24 object-cover rounded-md shadow-md border border-zinc-700"
                />
              )}
              <div>
                <p className="text-xl font-black text-white">{exchange.offered_card?.card?.name}</p>
                <p className="text-sm text-zinc-400 mt-1 capitalize">
                  {exchange.offered_card?.condition} • {exchange.offered_card?.language} {exchange.offered_card?.is_foil ? '• Foil' : ''}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Busca a cambio:</p>
              {exchange.requested_card ? (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl">
                  {exchange.requested_card.image_url && (
                    <img 
                      src={exchange.requested_card.image_url.startsWith('http') ? exchange.requested_card.image_url : `/storage/${exchange.requested_card.image_url}`} 
                      alt={exchange.requested_card.name} 
                      className="w-10 h-14 object-cover rounded shadow-sm border border-emerald-500/40"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {exchange.requested_card.name}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Cualquier oferta
                </div>
              )}
            </div>

            <button 
              onClick={() => handleRequestClick(exchange)}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 hover:shadow-indigo-900/80 active:scale-95"
            >
              Proponer Intercambio
            </button>
          </div>
        ))}
        {(!exchanges || exchanges.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-zinc-800/30 border border-zinc-800 border-dashed rounded-2xl">
            <svg className="w-16 h-16 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-zinc-400 text-lg">No hay intercambios disponibles en este momento.</p>
          </div>
        )}
      </div>

      {/* Modal para Hacer una Oferta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative z-[70] bg-zinc-900 border border-zinc-700/50 p-8 rounded-3xl w-full max-w-md shadow-2xl shadow-indigo-900/20 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2 text-white">Proponer un Intercambio</h2>
            <p className="text-zinc-400 text-sm mb-6">Selecciona una carta de tu inventario para dársela a <span className="text-indigo-400">{selectedExchange?.user?.name}</span>.</p>
            
            <div className="mb-6 bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Carta a ofrecer</label>
              <select 
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all appearance-none"
                value={selectedInventoryCardId}
                onChange={(e) => setSelectedInventoryCardId(e.target.value)}
              >
                <option value="">-- Elige una carta de tu colección --</option>
                {(inventory || []).map((inv: any) => {
                  const available = inv.quantity - inv.quantity_locked;
                  if (available <= 0) return null;
                  return (
                  <option key={`inv-${inv.id}`} value={inv.id}>
                    {inv.card?.name} ({available} disp.)
                  </option>
                )})}
              </select>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-white font-medium py-3 px-4 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={submitRequest}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Enviar Oferta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Publicación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative z-[70] bg-zinc-900 border border-zinc-700/50 p-8 rounded-3xl w-full max-w-[500px] shadow-2xl shadow-indigo-900/20 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2 text-white">Publicar Oferta Global</h2>
            <p className="text-zinc-400 text-sm mb-6">Ofrece una carta y, opcionalmente, pide una carta específica a cambio.</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
                <label className="block text-xs font-medium text-emerald-400 uppercase tracking-wide mb-2">Paso 1: ¿Qué ofreces?</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={newOfferCardId}
                  onChange={(e) => setNewOfferCardId(e.target.value)}
                >
                  <option value="">-- Elige qué darás (Requerido) --</option>
                  {(inventory || []).map((inv: any) => {
                    const available = inv.quantity - inv.quantity_locked;
                    if (available <= 0) return null;
                    return (
                    <option key={`off-${inv.id}`} value={inv.id}>
                      {inv.card?.name} ({available} disp.)
                    </option>
                  )})}
                </select>
              </div>

              <div className="bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
                <label className="block text-xs font-medium text-indigo-400 uppercase tracking-wide mb-2">Paso 2: ¿Qué quieres a cambio?</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newRequestCardId}
                  onChange={(e) => setNewRequestCardId(e.target.value)}
                >
                  <option value="">Cualquier carta (Abierto a ofertas)</option>
                  {(genericCards || []).map((c: any) => (
                    <option key={`req-${c.id}`} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-2 italic">O déjalo en 'Cualquier carta' para que los usuarios te hagan propuestas libres.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={submitCreateListing}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
