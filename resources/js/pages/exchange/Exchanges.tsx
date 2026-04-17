import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/ApiService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { User, ShieldCheck } from 'lucide-react';

export default function Exchanges() {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [genericCards, setGenericCards] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  
  const [selectedExchange, setSelectedExchange] = useState<any>(null);
  const [selectedInventoryCardId, setSelectedInventoryCardId] = useState<any>('');
  
  const [newOfferCardId, setNewOfferCardId] = useState<any>('');
  const [newRequestCardId, setNewRequestCardId] = useState<any>('');
  const [cardSearch, setCardSearch] = useState('');

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

  const loadInventory = async (showLoading = false) => {
    if (showLoading) setLoadingInventory(true);
    try {
      const resp = await apiService.getMyInventory();
      let arr = [];
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
    } finally {
      if (showLoading) setLoadingInventory(false);
    }
  };

  const loadGenericCards = async (search: string = '') => {
    try {
      const data = await apiService.getAllCards(1, search);
      let arr = Array.isArray(data) ? data : (data?.data || []);
      setGenericCards(arr);
    } catch (error) {
      setGenericCards([]);
    }
  };

  const handleRequestClick = (exchange: any) => {
    setSelectedExchange(exchange);
    setIsModalOpen(true);
    loadInventory(true); // Sincronización fresca al abrir modal
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
    <div className="p-6 max-w-7xl mx-auto text-foreground min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
            Mercado de Intercambios
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Busca cartas y propón intercambios a otros jugadores.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              loadInventory(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-lg transition-all active:scale-95"
          >
            Publicar Oferta
          </button>
          <a href="/exchanges/manage" className="px-4 py-2 bg-card hover:bg-accent text-foreground font-semibold rounded-lg transition-colors border border-border">
            Gestionar mis Peticiones
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(exchanges || []).map((exchange: any) => (
          <div key={exchange.id} className="bg-card/50 border border-border p-5 rounded-2xl shadow-xl hover:shadow-primary/10 transition-all backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
            
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">{exchange.user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{exchange.user?.name}</p>
                  {exchange.user_id === user?.id && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30 font-bold uppercase tracking-tighter">
                      Tu oferta
                    </span>
                  )}
                </div>
                <p className="text-xs text-primary font-medium">Ofrece el siguiente artículo:</p>
              </div>
            </div>
            
            <div className="bg-accent/60 border border-border p-4 rounded-xl mb-5 flex gap-4 items-center">
              <div className="w-16 h-24 bg-background rounded-md shadow-md border border-border overflow-hidden shrink-0">
                {exchange.offered_card?.card?.image_url ? (
                  <img 
                    src={exchange.offered_card.card.image_url.startsWith('http') ? exchange.offered_card.card.image_url : `/storage/${exchange.offered_card.card.image_url}`} 
                    alt={exchange.offered_card?.card?.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase opacity-20">No Img</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-foreground truncate">{exchange.offered_card?.card?.name}</p>
                <p className="text-sm text-muted-foreground mt-1 capitalize truncate">
                  {exchange.offered_card?.condition} • {exchange.offered_card?.language} {exchange.offered_card?.is_foil ? '• Foil' : ''}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Busca a cambio:</p>
              {exchange.requested_card ? (
                <div className="flex items-center gap-3 bg-secondary/10 border border-secondary/30 p-2 rounded-xl">
                  <div className="w-10 h-14 bg-background rounded shadow-sm border border-secondary/40 overflow-hidden shrink-0">
                    {exchange.requested_card.image_url ? (
                      <img 
                        src={exchange.requested_card.image_url.startsWith('http') ? exchange.requested_card.image_url : `/storage/${exchange.requested_card.image_url}`} 
                        alt={exchange.requested_card.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted-foreground uppercase opacity-20">?</div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-secondary font-bold flex items-center gap-1 truncate text-sm">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {exchange.requested_card.name}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold uppercase">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Cualquier oferta
                </div>
              )}
            </div>

            {exchange.user_id === user?.id ? (
              <button 
                disabled
                className="w-full bg-accent text-muted-foreground font-bold py-3 px-4 rounded-xl border border-border cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Tu publicación
              </button>
            ) : (
              <button 
                onClick={() => handleRequestClick(exchange)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Proponer Intercambio
              </button>
            )}
          </div>
        ))}
        {(!exchanges || exchanges.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card/30 border border-border border-dashed rounded-2xl">
            <svg className="w-16 h-16 text-muted-foreground mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-muted-foreground text-lg">No hay intercambios disponibles en este momento.</p>
          </div>
        )}
      </div>

      {/* Modal para Hacer una Oferta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative z-[70] bg-card border border-border p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Proponer un Intercambio</h2>
            <p className="text-muted-foreground text-sm mb-6">Selecciona una carta de tu inventario para dársela a <span className="text-primary font-bold">{selectedExchange?.user?.name}</span>.</p>
            
            <div className="mb-6 bg-accent border border-border p-4 rounded-xl">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Carta a ofrecer</label>
              <select 
                className="w-full bg-background border border-border text-foreground p-3.5 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none transition-all appearance-none disabled:opacity-50"
                value={selectedInventoryCardId}
                onChange={(e) => setSelectedInventoryCardId(e.target.value)}
                disabled={loadingInventory}
              >
                <option value="">{loadingInventory ? 'Actualizando inventario...' : '-- Elige una carta de tu colección --'}</option>
                {!loadingInventory && (inventory || []).filter((inv: any) => {
                  const available = inv.quantity - inv.quantity_locked;
                  if (available <= 0) return false;
                  if (selectedExchange?.requested_card_id) {
                    return inv.card_id === selectedExchange.requested_card_id;
                  }
                  return true;
                }).map((inv: any) => {
                  const available = inv.quantity - inv.quantity_locked;
                  return (
                    <option key={`inv-${inv.id}`} value={inv.id}>
                      {inv.card?.name} ({available} disp.)
                    </option>
                  );
                })}
              </select>
              
              {selectedExchange?.requested_card_id && (inventory || []).filter(inv => inv.card_id === selectedExchange.requested_card_id && (inv.quantity - inv.quantity_locked) > 0).length === 0 && (
                <div className="text-xs text-destructive mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-tighter">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Requisito no cumplido
                  </div>
                  {inventory.length > 0 ? (
                    <p className="opacity-80">Tienes cartas en tu colección, pero {selectedExchange?.user?.name} solicita específicamente la carta <span className="underline italic text-destructive font-black">"{selectedExchange.requested_card?.name}"</span>.</p>
                  ) : (
                    <p className="opacity-80">Actualmente no tienes cartas disponibles en tu inventario para proponer este intercambio.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-background border border-border hover:bg-accent text-foreground font-bold py-3 px-4 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={submitRequest}
                disabled={selectedExchange?.requested_card_id && (inventory || []).filter(inv => inv.card_id === selectedExchange.requested_card_id && (inv.quantity - inv.quantity_locked) > 0).length === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale"
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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative z-[70] bg-card border border-border p-8 rounded-3xl w-full max-w-[500px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Publicar Oferta Global</h2>
            <p className="text-muted-foreground text-sm mb-6">Ofrece una carta y, opcionalmente, pide una carta específica a cambio.</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-accent border border-border p-4 rounded-xl">
                <label className="block text-xs font-bold text-primary uppercase tracking-wide mb-2">Paso 1: ¿Qué ofreces?</label>
                <select 
                  className="w-full bg-background border border-border text-foreground p-3 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
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

              <div className="bg-accent border border-border p-4 rounded-xl">
                <label className="block text-xs font-bold text-primary uppercase tracking-wide mb-2">Paso 2: ¿Qué quieres a cambio?</label>
                
                <div className="flex gap-2 mb-3">
                    <input 
                        type="text" 
                        placeholder="Buscar carta..." 
                        className="flex-1 bg-background border border-border text-foreground p-2 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') loadGenericCards(cardSearch); }}
                    />
                    <button 
                        type="button"
                        onClick={() => loadGenericCards(cardSearch)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 rounded-lg text-xs font-bold"
                    >
                        Buscar
                    </button>
                </div>

                <select 
                  className="w-full bg-background border border-border text-foreground p-3 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
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
                <p className="text-xs text-muted-foreground mt-2 italic">O déjalo en 'Cualquier carta' para recibir propuestas libres.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 bg-background border border-border hover:bg-accent text-foreground font-bold py-3 px-4 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={submitCreateListing}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95"
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
