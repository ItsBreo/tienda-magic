import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiService } from '../../services/ApiService';
import { useAuth } from '../../contexts/AuthContext';
import { UserAvatar } from '@/components/common/UserAvatar';

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
      const arr = Array.isArray(data) ? data : (data?.data || []);
      setGenericCards(arr);
    } catch (error) {
      setGenericCards([]);
    }
  };

  const handleRequestClick = (exchange: any) => {
    setSelectedExchange(exchange);
    setIsModalOpen(true);
    loadInventory(true);
  };

  const submitRequest = async () => {
    if (!selectedInventoryCardId) return toast.error('Selecciona una carta para ofrecer');
    try {
      await apiService.requestExchange(selectedExchange.id, {
        offered_inventory_card_id: selectedInventoryCardId,
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
    <div className="flex-1 text-foreground p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header Elegante sin iconos */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border pb-6">
            <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-widest font-black text-primary">Intercambios Globales</span>
                <h1 className="text-4xl md:text-5xl font-forum font-bold text-foreground">
                    Mercado de Intercambios
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-foreground text-background font-black text-xs uppercase tracking-widest h-11 px-8 rounded-xl hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all shadow-md group"
                >
                  Publicar Oferta
                </button>
                <a href="/exchanges/manage" className="bg-accent text-foreground font-black text-xs uppercase tracking-widest h-11 px-8 py-3.5 rounded-xl hover:bg-background hover:border-primary/50 transition-all border border-border shadow-sm text-center leading-none">
                  Gestión
                </a>
            </div>
        </div>

        {/* Grid de ofertas estilo Marketplace */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(exchanges || []).map((exchange: any) => (
            <div key={exchange.id} className="border border-border rounded-xl md:px-4 px-3 py-4 bg-card/40 backdrop-blur-md w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1">

              {/* Contenedor de Imagen de lo que OFRECE */}
              <div className="group/img flex items-center justify-center bg-accent/5 rounded-lg p-2 h-48 relative overflow-hidden">
                {exchange.offered_card?.card?.image_url ? (
                  <img
                    src={exchange.offered_card.card.image_url.startsWith('http') ? exchange.offered_card.card.image_url : `/storage/${exchange.offered_card.card.image_url}`}
                    alt={exchange.offered_card?.card?.name}
                    className="group-hover/img:scale-110 transition-transform duration-500 max-h-full object-contain drop-shadow-md"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase opacity-20">NO IMG</div>
                )}

                <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-sm text-[10px] font-black text-primary px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter shadow-sm">
                  OFRECE
                </div>
              </div>

              {/* Información */}
              <div className="mt-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-foreground font-forum font-bold text-lg leading-tight line-clamp-2 min-h-[2.5rem] flex-1 tracking-tight">
                      {exchange.offered_card?.card?.name}
                    </h3>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <UserAvatar 
                        src={(exchange.user as any)?.avatar_url}
                        name={exchange.user?.name}
                        className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex-shrink-0"
                        fallbackClassName="text-[10px] font-black text-primary"
                    />
                    <p className="text-[11px] font-black tracking-wider uppercase text-muted-foreground truncate flex-1">{exchange.user?.name}</p>
                    {exchange.user_id === user?.id && (
                        <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase tracking-widest font-black shrink-0">
                          Tu oferta
                        </span>
                    )}
                </div>

                {/* Lo que pide a cambio */}
                <div className="w-full mt-auto pt-3 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60 mb-2">Busca a cambio:</p>

                  {exchange.requested_card ? (
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-foreground truncate">{exchange.requested_card.name}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] uppercase font-black tracking-widest text-primary">Cualquier oferta</div>
                  )}
                </div>

                <div className="w-full mt-3">
                  {exchange.user_id === user?.id ? (
                    <button disabled className="h-9 w-full bg-accent text-muted-foreground font-black text-[10px] uppercase tracking-widest border border-border cursor-not-allowed rounded-lg opacity-50">
                      Tus artículos
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestClick(exchange)}
                      className="h-9 w-full bg-primary text-primary-foreground border-none hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 rounded-lg transition-all"
                    >
                      Proponer Intercambio
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!exchanges || exchanges.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-accent/30 rounded-3xl border border-dashed border-border opacity-60">
              <p className="text-foreground text-lg uppercase tracking-widest font-black">No hay intercambios disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Hacer una Oferta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-[70] bg-card/60 backdrop-blur-md border border-border p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-forum font-bold mb-2 text-foreground uppercase tracking-tight">Proponer Intercambio</h2>
            <p className="text-muted-foreground text-sm mb-6">
Ofrece una carta a
<span className="text-primary font-bold">{selectedExchange?.user?.name}</span>
.
</p>

            <div className="mb-6 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Carta a ofrecer</label>
              <select
                className="w-full bg-background border border-border text-sm font-medium text-foreground p-3 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none transition-all"
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
                      {inv.card?.name}
{' '}
(
{available}
{' '}
disp.)
</option>
                  );
                })}
              </select>

              {selectedExchange?.requested_card_id && (inventory || []).filter((inv) => inv.card_id === selectedExchange.requested_card_id && (inv.quantity - inv.quantity_locked) > 0).length === 0 && (
                <p className="text-[10px] text-destructive uppercase font-black tracking-widest mt-2">
                  No tienes la carta requerida.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-accent border border-border hover:bg-background text-foreground font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitRequest}
                disabled={selectedExchange?.requested_card_id && (inventory || []).filter((inv) => inv.card_id === selectedExchange.requested_card_id && (inv.quantity - inv.quantity_locked) > 0).length === 0}
                className="flex-1 bg-primary border border-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative z-[70] bg-card/60 backdrop-blur-md border border-border p-8 rounded-3xl w-full max-w-[500px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-forum font-bold mb-2 text-foreground uppercase tracking-tight">Publicar Oferta</h2>
            <p className="text-muted-foreground text-sm mb-6">Ofrece una carta y opcionalmente pide otra.</p>

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">¿Qué ofreces?</label>
                <select
                  className="w-full bg-background border border-border text-sm font-medium text-foreground p-3 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                  value={newOfferCardId}
                  onChange={(e) => setNewOfferCardId(e.target.value)}
                >
                  <option value="">-- Elige qué darás (Requerido) --</option>
                  {(inventory || []).map((inv: any) => {
                    const available = inv.quantity - inv.quantity_locked;
                    if (available <= 0) return null;
                    return (
                    <option key={`off-${inv.id}`} value={inv.id}>
                      {inv.card?.name}
{' '}
(
{available}
{' '}
disp.)
</option>
                  );
})}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">¿Qué quieres a cambio?</label>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Buscar carta..."
                        className="flex-1 bg-background border border-border text-sm font-medium text-foreground p-2 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') loadGenericCards(cardSearch); }}
                    />
                    <button
                        type="button"
                        onClick={() => loadGenericCards(cardSearch)}
                        className="bg-accent text-foreground hover:bg-primary/20 hover:text-primary border border-border px-4 rounded-lg text-xs font-black uppercase tracking-widest"
                    >
                        Buscar
                    </button>
                </div>

                <select
                  className="w-full bg-background border border-border text-sm font-medium text-foreground p-3 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">O déjalo en 'Cualquier carta' para ofertas libres.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 bg-accent border border-border hover:bg-background text-foreground font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitCreateListing}
                className="flex-1 bg-primary border border-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all"
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
