import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, Lock, Image as ImageIcon,
    Layers, Package,
    Loader2, Filter, DollarSign, X
} from 'lucide-react';
import { toast } from 'sonner';
import apiService from '@/services/ApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import HighlightedText from '@/components/common/HighlightedText';
import PackOpeningModal from '@/components/inventory/PackOpeningModal';
import { useTitle } from '@/hooks/useTitle';
import SetFilterModal from '@/components/common/SetFilterModal';
import PackDialog from '@/components/packs/PackDialog';
import PacksPagination from '@/components/packs/PacksPagination';
import CardDetailModal from '@/components/common/CardDetailModal';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

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
    oracle_text?: string;
    type_line?: string;
    data?: {
        oracle_text?: string;
        flavor_text?: string;
        artist?: string;
        power?: string;
        toughness?: string;
        mana_cost?: string;
    };
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

// Limpiador estricto de DRAFT
const cleanDraftName = (name: string) => name.replace(/\[DRAFT\]|\(DRAFT\)|DRAFT/gi, '').trim();

// --- Componente de Card Pack ---
function InventoryPackCard({
 pack, searchTerm, onView, onSell,
}: {
    pack: InventoryPack;
    searchTerm: string;
    onView: (id: number) => void;
    onSell: (id: number, name: string) => void;
}) {
    const data = pack.booster_pack;
    const setIcon = data.set?.icon_svg_uri;
    const cleanName = cleanDraftName(data.name);

    return (
        <div className="border border-border rounded-xl md:px-4 px-3 py-4 bg-card w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 h-full">
            <div className="group/img cursor-pointer flex items-center justify-center bg-accent/5 rounded-lg p-2 h-48 relative overflow-hidden shrink-0" onClick={() => onView(pack.id)}>
                {data.image_uri ? (
                    <img src={data.image_uri} alt={cleanName} className="group-hover/img:scale-110 transition-transform duration-500 max-h-full object-contain drop-shadow-md" />
                ) : (
                    <Package className="w-12 h-12 text-muted-foreground/40" />
                )}

                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter shadow-lg">
                    x
{pack.quantity}
                </div>

                {pack.quantity_locked > 0 && (
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground p-1.5 rounded-md shadow-lg">
                        <Lock size={10} strokeWidth={4} />
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-col flex-1 h-full">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-foreground font-forum font-bold text-lg md:text-xl leading-tight line-clamp-2 h-14 flex-1 uppercase tracking-tight">
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

                <div className="flex flex-col gap-2 w-full mt-auto pt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSell(pack.id, cleanName)}
                        className="h-9 w-full bg-accent/50 text-foreground hover:bg-primary/20 hover:text-primary font-black uppercase tracking-widest text-[9px] rounded-lg transition-all border border-border/60"
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
                            'h-9 w-full font-black text-[10px] uppercase tracking-widest shadow-lg',
                            pack.quantity <= pack.quantity_locked
                                ? 'bg-accent text-muted-foreground border-border cursor-not-allowed opacity-50'
                                : 'bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-primary/20',
                        )}
                    >
                        {pack.quantity <= pack.quantity_locked ? 'En Venta' : 'Abrir Pack'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Componente de Card Suelta ---
function InventoryCardItem({
 item, searchTerm, onSell, onView,
}: {
    item: InventoryItem;
    searchTerm: string;
    onSell: (id: number, name: string) => void;
    onView: (card: CardData) => void;
}) {
    const { card } = item;
    const img = card.image_uris?.normal || card.image_uri || card.image_url;
    const cleanName = cleanDraftName(card.name);

    return (
        <div className="border border-border rounded-xl md:px-4 px-3 py-4 bg-card w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 h-full">
             <div className="group/img flex items-center cursor-pointer justify-center bg-accent/5 rounded-lg p-2 h-48 relative overflow-hidden shrink-0" onClick={() => onView(card)}>
                {img ? (
                    <img src={img} alt={cleanName} className="group-hover/img:scale-105 transition-transform duration-500 max-h-full object-contain drop-shadow-md" />
                ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                )}

                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter shadow-lg">
                    x
{item.quantity}
                </div>

                {item.quantity_locked > 0 && (
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground p-1.5 rounded-md shadow-lg">
                        <Lock size={10} strokeWidth={4} />
                    </div>
                )}
             </div>

             <div className="mt-4 flex flex-col flex-1 h-full">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-foreground font-forum font-bold text-lg md:text-xl leading-tight line-clamp-2 h-14 flex-1 uppercase tracking-tight">
                        <HighlightedText text={cleanName} highlight={searchTerm} />
                    </h3>
                </div>

                <div className="flex items-center gap-2 h-5 mt-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter truncate">
                        {card.set?.name}
                    </span>
                </div>

                {/* Info Directa (Lore/Artist) */}
                {card.data && (
                    <div className="space-y-3 mb-4 mt-3">
                        {(card.data.oracle_text || card.oracle_text) && (
                            <p className="text-[10px] text-foreground/70 font-literata line-clamp-2 leading-relaxed italic opacity-80 border-l border-primary/20 pl-2">
                                {card.data.oracle_text || card.oracle_text}
                            </p>
                        )}
                        {card.data.flavor_text && (
                            <p className="text-[9px] text-muted-foreground italic line-clamp-2 leading-relaxed border-l border-border pl-2 opacity-60">
                                {card.data.flavor_text}
                            </p>
                        )}
                        {card.data.artist && (
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/40">
                                Art: {card.data.artist}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col w-full mt-auto pt-4 gap-2">
                    <div className="flex items-end justify-between mb-2">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Mercado</p>
                            <p className="md:text-lg pl-0.5 text-base font-black text-foreground">
€
{card.market_avg_price?.toFixed(2) || '0.00'}
</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSell(item.id, cleanName)}
                        className="h-9 w-full bg-accent/50 text-foreground hover:bg-primary/20 hover:text-primary font-black uppercase tracking-widest text-[9px] rounded-lg transition-all border border-border/60"
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
    useTitle('Inventario');
    const navigate = useNavigate();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [packs, setPacks] = useState<InventoryPack[]>([]);
    const [stats, setStats] = useState({ totalCards: 0, totalPacks: 0 });
    const [loading, setLoading] = useState(true);
    const [cardsPage, setCardsPage] = useState(1);
    const [cardsLastPage, setCardsLastPage] = useState(1);
    const [packsPage, setPacksPage] = useState(1);
    const [packsLastPage, setPacksLastPage] = useState(1);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSets, setSelectedSets] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest'>('newest');
    const [category, setCategory] = useState<'all' | 'packs' | 'cards'>('all');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Opening State
    const [openedPacks, setOpenedPacks] = useState<any[]>([]);
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [selectedPackForModal, setSelectedPackForModal] = useState<InventoryPack | null>(null);

    // Card Info State
    const [selectedCardForModal, setSelectedCardForModal] = useState<CardData | null>(null);

    // Selling State
    const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
    const [selectedItemForSell, setSelectedItemForSell] = useState<{ id: number, name: string, type: 'card' | 'pack' } | null>(null);
    const [amountToSeller, setAmountToSeller] = useState('');
    const [isSubmittingSell, setIsSubmittingSell] = useState(false);

    const fetchInventory = async (pageObj: { cards?: number, packs?: number } = {}) => {
        setLoading(true);
        try {
            const page = pageObj.cards || cardsPage;
            const pPage = pageObj.packs || packsPage;
            const setsParam = selectedSets.length > 0 ? selectedSets.join(',') : '';
            
            const response = await apiService.axiosInstance.get('/api/inventory', {
                params: {
                    page,
                    packs_page: pPage,
                    search: searchTerm,
                    sets: setsParam,
                    sort: sortBy,
                },
            });
            
            setItems(response.data?.inventoryCards?.data || []);
            setPacks(response.data?.inventoryPacks?.data || []);
            setCardsPage(response.data?.inventoryCards?.current_page || 1);
            setCardsLastPage(response.data?.inventoryCards?.last_page || 1);
            setPacksPage(response.data?.inventoryPacks?.current_page || 1);
            setPacksLastPage(response.data?.inventoryPacks?.last_page || 1);
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
            fetchInventory({ cards: 1, packs: 1 });
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedSets, sortBy]);

    useEffect(() => { 
        // No fetch directly here if we want to distinguish which page changed, 
        // but since fetchInventory fetches both, it's fine.
        fetchInventory(); 
    }, [cardsPage, packsPage]);

    const handleOpenPack = async (packId: number, count: number) => {
        try {
            setLoading(true);
            const response = await apiService.axiosInstance.post(`/api/inventory/packs/${packId}/open`, { count });
            if (response.data.success) {
                setOpenedPacks(response.data.packs);
                setIsOpeningModalOpen(true);
                toast.success(response.data.message);
                setSelectedPackForModal(null);
                fetchInventory();
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
                amount_to_seller: price,
            });

            toast.success(response.message || 'Puesto a la venta con éxito');
            setIsSellDialogOpen(false);
            setSelectedItemForSell(null);
            setAmountToSeller('');

            setTimeout(() => {
                navigate('/market');
            }, 1000);

            fetchInventory();
        } catch (error: any) {
            console.error('Error listing on market:', error);
            toast.error(error.response?.data?.message || 'Error al poner a la venta');
        } finally {
            setIsSubmittingSell(false);
        }
    };

    const availableSets = useMemo(() => {
        const setsMap = new Map();
        packs.forEach((p) => p.booster_pack?.set && setsMap.set(String(p.booster_pack.set.id), p.booster_pack.set));
        items.forEach((i) => i.card?.set && setsMap.set(String(i.card.set.id), i.card.set));
        return Array.from(setsMap.values());
    }, [packs, items]);

    const showPacks = category === 'all' || category === 'packs';
    const showCards = category === 'all' || category === 'cards';

    return (
        <div className="flex-1 text-foreground pb-20">
            {/* Toolbar (Parity with Shop) */}
            <div className="bg-background/40 backdrop-blur-md border-b border-border sticky top-[72px] md:top-[88px] z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar en inventario..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCardsPage(1); setPacksPage(1); }}
                            className="pl-9 pr-4 bg-background border-border text-foreground focus-visible:ring-primary h-11 shadow-sm text-sm"
                        />
                    </div>

                    {/* Category toggle */}
                    <div className="flex bg-accent/50 p-1 rounded-xl h-11">
                        <button
                            onClick={() => { setCategory('all'); setCardsPage(1); setPacksPage(1); }}
                            className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                category === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Todo
                        </button>
                        <button
                            onClick={() => { setCategory('packs'); setCardsPage(1); setPacksPage(1); }}
                            className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                category === 'packs' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Sobres
                        </button>
                        <button
                            onClick={() => { setCategory('cards'); setCardsPage(1); setPacksPage(1); }}
                            className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                category === 'cards' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Cartas Sueltas
                        </button>
                    </div>

                    {/* Sort & Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value as any); setCardsPage(1); setPacksPage(1); }}
                            className="bg-background border border-border text-foreground px-4 py-2 rounded-xl text-sm h-11 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-medium cursor-pointer"
                        >
                            <option value="newest">Novedades</option>
                            <option value="price_asc">Menor Valor</option>
                            <option value="price_desc">Mayor Valor</option>
                            <option value="name_asc">A-Z</option>
                            <option value="name_desc">Z-A</option>
                        </select>

                        <Button
                            variant="outline"
                            onClick={() => setIsFilterModalOpen(true)}
                            className={cn(
                                'bg-background border-border text-sm gap-2 hover:bg-primary/10 hover:border-primary/50 hover:text-primary font-bold h-11 px-5 rounded-xl shadow-sm',
                                selectedSets.length > 0 && 'border-primary/50 text-primary bg-primary/5',
                            )}
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Filtrar por Set</span>
                            {selectedSets.length > 0 && (
                                <Badge className="ml-1 bg-primary text-primary-foreground px-1.5 h-4 min-w-[1.25rem] flex items-center justify-center text-[10px] font-black">
                                    {selectedSets.length}
                                </Badge>
                            )}
                        </Button>

                        {selectedSets.length > 0 && (
                            <button
                                onClick={() => { setSelectedSets([]); setCardsPage(1); setPacksPage(1); }}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2"
                                title="Limpiar filtros"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
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
                        {showPacks && packs.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border pb-2">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-primary" />
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Sobres en Bóveda</h2>
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground bg-accent/30 px-3 py-1 rounded-full">
{packs.length}
{' '}
Resultados
</span>
                                </div>
                                <motion.div 
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        show: {
                                            opacity: 1,
                                            transition: {
                                                staggerChildren: 0.05
                                            }
                                        }
                                    }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                                >
                                    {packs.map((p) => (
                                        <motion.div
                                            key={p.id}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                        >
                                            <InventoryPackCard
                                                pack={p}
                                                searchTerm={searchTerm}
                                                onView={() => setSelectedPackForModal(p)}
                                                onSell={(id, name) => { setSelectedItemForSell({ id, name, type: 'pack' }); setIsSellDialogOpen(true); }}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}

                        {/* Sección Cartas */}
                        {showCards && items.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border pb-2">
                                    <div className="flex items-center gap-3">
                                        <Layers className="w-5 h-5 text-primary" />
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Cartas Coleccionadas</h2>
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground bg-accent/30 px-3 py-1 rounded-full">
{items.length}
{' '}
Resultados
</span>
                                    </div>
                                    <motion.div 
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        show: {
                                            opacity: 1,
                                            transition: {
                                                staggerChildren: 0.03
                                            }
                                        }
                                    }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                                >
                                    {items.map((i) => (
                                        <motion.div
                                            key={i.id}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                        >
                                            <InventoryCardItem
                                                item={i}
                                                searchTerm={searchTerm}
                                                onView={(card) => { setSelectedCardForModal(card); }}
                                                onSell={(id, name) => { setSelectedItemForSell({ id, name, type: 'card' }); setIsSellDialogOpen(true); }}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}

                        {((showPacks && packs.length === 0) && (showCards && items.length === 0)) && (
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

            {/* PAGINACIÓN CARTAS */}
            {category !== 'packs' && cardsLastPage > 1 && (
                <div className="border-t border-border mt-12">
                    <PacksPagination
                        currentPage={cardsPage}
                        totalPages={cardsLastPage}
                        totalPacks={stats.totalCards}
                        onPageChange={setCardsPage}
                        category="cards"
                    />
                </div>
            )}

            {/* PAGINACIÓN SOBRES */}
            {category !== 'cards' && packsLastPage > 1 && (
                <div className="border-t border-border mt-8">
                    <PacksPagination
                        currentPage={packsPage}
                        totalPages={packsLastPage}
                        totalPacks={stats.totalPacks}
                        onPageChange={setPacksPage}
                        category="packs"
                    />
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

            <SetFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} availableSets={availableSets} selectedSets={selectedSets} onApply={(selection) => { setSelectedSets(selection); setCardsPage(1); setPacksPage(1); }} accentColor="primary" />

            <PackOpeningModal
                isOpen={isOpeningModalOpen}
                onClose={() => setIsOpeningModalOpen(false)}
                packs={openedPacks}
                packName={openedPacks[0]?.cards[0]?.set?.name || 'Sobres Abiertos'}
            />

            {/* MODAL UNIVERSAL DETALLE CARTA */}
            <CardDetailModal
                card={selectedCardForModal}
                onClose={() => setSelectedCardForModal(null)}
            />

             {/* DIALOG DE VENTA */}
            <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
                <DialogContent className="bg-card border-border rounded-xl p-6 max-w-sm">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">
Vender
{selectedItemForSell?.type === 'pack' ? 'Sobre' : 'Carta'}
</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-bold">{selectedItemForSell?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary">Precio de Venta (€)</label>
                            <Input type="number" step="0.01" className="h-12 bg-background border-border text-lg font-black" placeholder="0.00" value={amountToSeller} onChange={(e) => setAmountToSeller(e.target.value)} />
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
