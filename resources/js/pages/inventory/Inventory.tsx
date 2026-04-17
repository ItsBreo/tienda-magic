import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '@/services/ApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import HighlightedText from '@/components/common/HighlightedText';
import {
    Search, Lock, Image as ImageIcon,
    Layers, Package,
    Loader2, Filter, DollarSign
} from 'lucide-react';
import PackOpeningModal from '@/components/inventory/PackOpeningModal';
import SetFilterModal from '@/components/common/SetFilterModal';
import PackDialog from '@/components/packs/PackDialog';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

/* 
  VERSION: 3.2 - FULL LOGIC FIX
  - Fixed search/sort/filter (parity with refined backend)
  - Integrated Carousel response for pack opening
*/

interface SetData {
    id: number;
    name: string;
    code?: string;
    icon_svg_uri?: string;
}

interface BoosterPackData {
    id: number;
    name: string;
    price: number;
    image_uri?: string;
    type: string;
    set: SetData;
}

interface CardData {
    id: number;
    name: string;
    image_url?: string;
    image_uri?: string;
    rarity: string;
    image_uris?: any;
    market_avg_price?: number;
    set: SetData;
}

interface InventoryItem {
    id: number;
    quantity: number;
    quantity_locked: number;
    is_foil: boolean;
    condition: string;
    language: string;
    card: CardData;
}

interface InventoryPack {
    id: number;
    quantity: number;
    quantity_locked: number;
    booster_pack: BoosterPackData;
}

// --- Componente de Card (Paridad con PackCard de la Tienda) ---
function InventoryPackCard({ pack, searchTerm, onView, onSell }: {
    pack: InventoryPack;
    searchTerm: string;
    onView: (id: number) => void;
    onSell: (id: number, name: string) => void;
}) {
    const data = pack.booster_pack;
    const setIcon = data.set?.icon_svg_uri;
    const cleanName = data.name.replace(/\(DRAFT\)|DRAFT/gi, '').trim();

    return (
        <div className="border border-border rounded-xl md:px-4 px-3 py-4 bg-card w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1">
            <div className="group/img cursor-pointer flex items-center justify-center bg-accent/5 rounded-lg p-2 h-48 relative overflow-hidden" onClick={() => onView(pack.id)}>
                {data.image_uri ? (
                    <img src={data.image_uri} alt={cleanName} className="group-hover/img:scale-110 transition-transform duration-500 max-h-full object-contain drop-shadow-md" />
                ) : (
                    <Package className="w-12 h-12 text-muted-foreground/40" />
                )}
                
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter shadow-lg">
                    x{pack.quantity}
                </div>

                {pack.quantity_locked > 0 && (
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground p-1.5 rounded-md shadow-lg">
                        <Lock size={10} strokeWidth={4} />
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-foreground font-forum font-bold text-lg md:text-xl leading-tight line-clamp-2 min-h-[2.5rem] flex-1 uppercase tracking-tight">
                        <HighlightedText text={cleanName} highlight={searchTerm} />
                    </h3>
                    {setIcon && (
                         <img src={setIcon} alt="" className="w-5 h-5 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all filter dark:invert shrink-0 mt-0.5" />
                    )}
                </div>

                <div className="flex items-center gap-2 h-5 mt-1 font-literata">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                        {data.type || 'BOOSTER'}
                    </span>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => onSell(pack.id, data.name)}
                        className="h-9 px-4 bg-accent/50 text-foreground hover:bg-primary/20 hover:text-primary font-black uppercase tracking-widest text-[9px] rounded-lg transition-all border border-border/60"
                        disabled={pack.quantity <= pack.quantity_locked}
                    >
                        <DollarSign size={12} className="mr-1" />
                        {pack.quantity <= pack.quantity_locked ? 'Publicado' : 'Vender'}
                    </Button>
                    <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => onView(pack.id)}
                        disabled={pack.quantity <= pack.quantity_locked}
                        className={cn(
                            "h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg",
                            pack.quantity <= pack.quantity_locked 
                                ? "bg-accent text-muted-foreground border-border cursor-not-allowed opacity-50" 
                                : "bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-primary/20"
                        )}
                    >
                        {pack.quantity <= pack.quantity_locked ? 'En Venta' : 'Abrir Pack'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function InventoryCardItem({ item, searchTerm, onSell }: {
    item: InventoryItem;
    searchTerm: string;
    onSell: (id: number, name: string) => void;
}) {
    const card = item.card;
    const img = card.image_uris?.normal || card.image_uri || card.image_url;

    return (
        <div className="border border-border rounded-xl md:px-4 px-3 py-4 bg-card w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1">
             <div className="group/img flex items-center justify-center bg-accent/5 rounded-lg p-2 h-48 relative overflow-hidden">
                {img ? (
                    <img src={img} alt={card.name} className="group-hover/img:scale-105 transition-transform duration-500 max-h-full object-contain drop-shadow-md" />
                ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                )}

                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter shadow-lg">
                    x{item.quantity}
                </div>

                {item.quantity_locked > 0 && (
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground p-1.5 rounded-md shadow-lg">
                        <Lock size={10} strokeWidth={4} />
                    </div>
                )}
             </div>

             <div className="mt-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-foreground font-forum font-bold text-lg md:text-xl leading-tight line-clamp-2 min-h-[2.5rem] flex-1 uppercase tracking-tight">
                        <HighlightedText text={card.name} highlight={searchTerm} />
                    </h3>
                </div>

                <div className="flex items-center gap-2 h-5 mt-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter truncate">
                        {card.set?.name}
                    </span>
                </div>

                <div className="flex items-end justify-between mt-auto pt-4">
                    <div className="flex flex-col">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Mercado</p>
                        <p className="md:text-lg text-base font-black text-foreground">€{card.market_avg_price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => onSell(item.id, card.name)}
                        className="h-9 px-4 bg-accent/50 text-foreground hover:bg-primary/20 hover:text-primary font-black uppercase tracking-widest text-[9px] rounded-lg transition-all border border-border/60"
                        disabled={item.quantity <= item.quantity_locked}
                    >
                        <DollarSign size={12} className="mr-1" />
                        {item.quantity <= item.quantity_locked ? 'Publicada' : 'Vender'}
                    </Button>
                </div>
             </div>
        </div>
    );
}

export default function Inventory() {
    const navigate = useNavigate();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [packs, setPacks] = useState<InventoryPack[]>([]);
    const [stats, setStats] = useState({ totalCards: 0, totalPacks: 0 });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSets, setSelectedSets] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest'>('newest');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Opening State
    const [openedPacks, setOpenedPacks] = useState<any[]>([]); // Soportar estructura de carrusel
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [selectedPackForModal, setSelectedPackForModal] = useState<InventoryPack | null>(null);

    // Selling State
    const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
    const [selectedItemForSell, setSelectedItemForSell] = useState<{ id: number, name: string, type: 'card' | 'pack' } | null>(null);
    const [amountToSeller, setAmountToSeller] = useState('');
    const [isSubmittingSell, setIsSubmittingSell] = useState(false);

    const fetchInventory = async (page: number) => {
        setLoading(true);
        try {
            const setsParam = selectedSets.length > 0 ? selectedSets.join(',') : '';
            const response = await apiService.axiosInstance.get('/api/inventory', {
                params: { page, search: searchTerm, sets: setsParam, sort: sortBy }
            });
            setItems(response.data?.inventoryCards?.data || []);
            setPacks(response.data?.inventoryPacks || []);
            setCurrentPage(response.data?.inventoryCards?.current_page || 1);
            setLastPage(response.data?.inventoryCards?.last_page || 1);
            setStats(response.data?.stats || { totalCards: 0, totalPacks: 0 });
        } catch (error) { 
            console.error('Inventory Fetch Error:', error);
            setItems([]);
            setPacks([]);
            toast.error('Ocurrió un error al cargar tu colección.');
        } finally { setLoading(false); }
    };

    useEffect(() => { 
        const delayDebounceFn = setTimeout(() => {
            fetchInventory(1); 
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedSets, sortBy]);

    useEffect(() => { fetchInventory(currentPage); }, [currentPage]);

    const handleOpenPack = async (packId: number, count: number) => {
        try {
            setLoading(true);
            const response = await apiService.axiosInstance.post(`/api/inventory/packs/${packId}/open`, { count });
            if (response.data.success) {
                setOpenedPacks(response.data.packs); // Nueva estructura de carrusel
                setIsOpeningModalOpen(true);
                toast.success(response.data.message);
                setSelectedPackForModal(null);
                fetchInventory(currentPage);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al abrir');
        } finally { setLoading(false); }
    };
    
    const handleConfirmSell = async () => {
        if (!selectedItemForSell || !amountToSeller) return;
        
        const price = parseFloat(amountToSeller);
        if (isNaN(price) || price <= 0) {
            toast.error('Por favor, ingresa un precio válido mayor a 0');
            return;
        }

        try {
            setIsSubmittingSell(true);
            const response = await apiService.listOnMarket({
                inventory_item_id: selectedItemForSell.id,
                type: selectedItemForSell.type, 
                amount_to_seller: price
            });
            
            toast.success(response.message || 'Carta puesta a la venta con éxito');
            setIsSellDialogOpen(false);
            setSelectedItemForSell(null);
            setAmountToSeller('');
            
            // Redirigir al mercado secundario después de un breve delay para que vean el toast
            setTimeout(() => {
                navigate('/market');
            }, 1000);
            
            fetchInventory(currentPage);
        } catch (error: any) {
            console.error('Error listing on market:', error);
            toast.error(error.response?.data?.message || 'Error al poner a la venta');
        } finally {
            setIsSubmittingSell(false);
        }
    };

    const availableSets = useMemo(() => {
        const setsMap = new Map();
        // Recoger sets de los sobres y cartas cargados actualmente para el filtro
        packs.forEach(p => p.booster_pack?.set && setsMap.set(String(p.booster_pack.set.id), p.booster_pack.set));
        items.forEach(i => i.card?.set && setsMap.set(String(i.card.set.id), i.card.set));
        return Array.from(setsMap.values());
    }, [packs, items]);

    return (
        <div className="flex-1 bg-background text-foreground pb-20">
            {/* Toolbar (Exact Parity with Shop) */}
            <div className="bg-background/90 backdrop-blur-sm border-b border-border sticky top-[72px] md:top-[88px] z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar en mi inventario..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-4 bg-background border-border text-foreground focus-visible:ring-primary h-10 shadow-sm"
                        />
                    </div>

                    {/* Stats Badges */}
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="h-10 px-4 bg-accent/20 border-border text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} className="text-primary" />
                            {stats.totalCards} Cartas
                        </Badge>
                        <Badge variant="outline" className="h-10 px-4 bg-accent/20 border-border text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Package size={14} className="text-primary" />
                            {stats.totalPacks} Sobres
                        </Badge>
                    </div>

                    {/* Sort & Filter */}
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                            className="bg-background border border-border text-foreground px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest h-10 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                        >
                            <option value="newest">Recientes</option>
                            <option value="price_asc">Menor Valor</option>
                            <option value="price_desc">Mayor Valor</option>
                            <option value="name_asc">A-Z</option>
                            <option value="name_desc">Z-A</option>
                        </select>

                        <Button
                            variant="outline"
                            onClick={() => setIsFilterModalOpen(true)}
                            className={cn(
                                "bg-background border-border text-xs font-black uppercase tracking-widest gap-2 hover:bg-primary/10 hover:border-primary/50 hover:text-primary h-10 px-4 shadow-sm",
                                selectedSets.length > 0 && "border-primary/50 text-primary bg-primary/5"
                            )}
                        >
                            <Filter className="h-4 w-4" />
                            Sets
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="animate-spin text-primary w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Bóveda...</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Sección Sobres */}
                        {packs.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border pb-2">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-primary" />
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Sobres en Bóveda</h2>
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground bg-accent/30 px-3 py-1 rounded-full">{packs.length} Resultados</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                    {packs.map(p => (
                                        <InventoryPackCard 
                                            key={p.id} 
                                            pack={p} 
                                            searchTerm={searchTerm} 
                                            onView={() => setSelectedPackForModal(p)} 
                                            onSell={(id, name) => { setSelectedItemForSell({id, name, type: 'pack'}); setIsSellDialogOpen(true); }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sección Cartas */}
                        {items.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border pb-2">
                                    <div className="flex items-center gap-3">
                                        <Layers className="w-5 h-5 text-primary" />
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Cartas Coleccionadas</h2>
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground bg-accent/30 px-3 py-1 rounded-full">{items.length} Resultados</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                    {items.map(i => (
                                        <InventoryCardItem key={i.id} item={i} searchTerm={searchTerm} onSell={(id, name) => { setSelectedItemForSell({id, name, type: 'card'}); setIsSellDialogOpen(true); }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {packs.length === 0 && items.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-40 text-center opacity-30">
                                <Search size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-xl font-black uppercase tracking-[0.2em]">No se encontraron resultados</p>
                                <p className="text-sm font-bold mt-2">Prueba a limpiar tus filtros o cambiar la búsqueda</p>
                                {searchTerm !== '' && (
                                    <Button variant="ghost" className="mt-6 font-bold" onClick={() => setSearchTerm('')}>Limpiar Búsqueda</Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PAGINACIÓN */}
            {lastPage > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 bg-card/50 backdrop-blur-md pb-10">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="font-bold border-border">Anterior</Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                            const p = i + 1;
                            return (
                                <button 
                                    key={p} 
                                    onClick={() => setCurrentPage(p)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                                        currentPage === p ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground hover:bg-accent"
                                    )}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))} disabled={currentPage === lastPage} className="font-bold border-border">Siguiente</Button>
                </div>
            )}

            {/* MODALES */}
            <PackDialog 
                pack={selectedPackForModal?.booster_pack as any}
                isOpen={!!selectedPackForModal}
                onClose={() => setSelectedPackForModal(null)}
                mode="inventory"
                availableQuantity={selectedPackForModal ? (selectedPackForModal.quantity - selectedPackForModal.quantity_locked) : 0}
                onOpenPack={(qty) => selectedPackForModal && handleOpenPack(selectedPackForModal.id, qty)}
            />

            <SetFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} availableSets={availableSets} selectedSets={selectedSets} onApply={(selection) => { setSelectedSets(selection); setCurrentPage(1); }} accentColor="primary" />
            
            <PackOpeningModal 
                isOpen={isOpeningModalOpen} 
                onClose={() => setIsOpeningModalOpen(false)} 
                packs={openedPacks} 
                packName={openedPacks[0]?.cards[0]?.set?.name || 'Sobres Abiertos'} 
            />
        
             {/* DIALOG DE VENTA */}
            <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
                <DialogContent className="bg-card border-border rounded-xl p-6 max-w-sm">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Vender {selectedItemForSell?.type === 'pack' ? 'Sobre' : 'Carta'}</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-bold">{selectedItemForSell?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary">Precio de Venta (€)</label>
                            <Input type="number" step="0.01" className="h-12 bg-background border-border text-lg font-black" placeholder="0.00" value={amountToSeller} onChange={e => setAmountToSeller(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button variant="ghost" className="flex-1 font-bold text-xs uppercase h-10" onClick={() => setIsSellDialogOpen(false)} disabled={isSubmittingSell}>Cancelar</Button>
                        <Button 
                            className="flex-1 bg-primary text-primary-foreground font-black uppercase text-xs h-10 shadow-lg shadow-primary/20"
                            onClick={handleConfirmSell}
                            disabled={isSubmittingSell}
                        >
                            {isSubmittingSell ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
