import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '@/services/ApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import HighlightedText from '@/components/common/HighlightedText';
import {
    Search, Sparkles, Lock, Image as ImageIcon,
    ChevronLeft, ChevronRight, Layers, Package, TrendingUp,
    Loader2, Tag, X, PackageOpen, Filter
} from 'lucide-react';
import PackOpeningModal from '@/components/inventory/PackOpeningModal';
import SetFilterModal from '@/components/common/SetFilterModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SetData {
    id: number;
    name: string;
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
    image_uri?: string;
    image_url?: string;
    image_uris?: {
        small?: string;
        normal?: string;
        large?: string;
        png?: string;
    };
    rarity: string;
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

interface InventoryStats {
    totalCards: number;
    totalPacks: number;
}

// --- Pack Card Component ---
function PackCard({ pack, isSellingMode, searchTerm, onSell, onOpen }: {
    pack: InventoryPack;
    isSellingMode: boolean;
    searchTerm: string;
    onSell: (id: number, name: string, type: 'card' | 'pack') => void;
    onOpen: (pack: InventoryPack) => void;
}) {
    return (
        <div className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
            <div className="relative aspect-[2.5/3.5] bg-accent/50 flex items-center justify-center p-2">
                {pack.booster_pack.image_uri ? (
                    <img src={pack.booster_pack.image_uri} alt={pack.booster_pack.name} className="w-full h-full object-contain rounded drop-shadow-md" loading="lazy" />
                ) : (
                    <div className="text-center"><Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><span className="text-xs text-muted-foreground font-serif px-2">{pack.booster_pack.name}</span></div>
                )}
                {pack.quantity_locked > 0 && (
                    <div className="absolute top-2 left-2 bg-destructive/80 backdrop-blur-sm border border-destructive/50 text-destructive-foreground text-xs px-1.5 py-1 rounded-sm shadow-lg" title={`${pack.quantity_locked} en venta`}>
                        <Lock className="h-3.5 w-3.5" />
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm border border-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-sm shadow-lg">x{pack.quantity}</div>
            </div>
            <div className="p-3 border-t border-border flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate" title={pack.booster_pack.name}>
                        <HighlightedText text={pack.booster_pack.name} highlight={searchTerm} />
                    </h3>
                    <div className="flex flex-col gap-2">
                        {isSellingMode && (
                            <Button size="sm" className="h-8 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground font-bold transition-all" onClick={() => onSell(pack.id, pack.booster_pack.name, 'pack')}>
                                <TrendingUp className="h-4 w-4 mr-1.5" />Vender
                            </Button>
                        )}
                        {!isSellingMode && (
                            <Button size="sm" className="h-8 bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary hover:text-secondary-foreground font-bold transition-all" onClick={() => onOpen(pack)}>
                                <PackageOpen className="h-4 w-4 mr-1.5" />Abrir Sobre
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-secondary/10 border border-secondary/30 text-secondary uppercase">{pack.booster_pack.type}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-accent border border-border text-muted-foreground">{pack.booster_pack.set?.name || 'Unknown'}</span>
                </div>
            </div>
        </div>
    );
}

// --- Card Item Component ---
function CardItem({ item, isSellingMode, searchTerm, getConditionColor, onSell }: {
    item: InventoryItem;
    isSellingMode: boolean;
    searchTerm: string;
    getConditionColor: (c: string) => string;
    onSell: (id: number, name: string, type: 'card' | 'pack') => void;
}) {
    if (!item.card) return null;

    return (
        <div className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
            <div className="relative aspect-[2.5/3.5] bg-accent/50 flex items-center justify-center p-2">
                {item.card.image_uris?.normal || item.card.image_uri || item.card.image_url ? (
                    <img 
                        src={item.card.image_uris?.normal || item.card.image_uri || item.card.image_url} 
                        alt={item.card.name} 
                        className="w-full h-full object-contain rounded drop-shadow-md" 
                        loading="lazy" 
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-card.png';
                        }}
                    />
                ) : (
                    <div className="text-center"><ImageIcon className="h-8 w-8 text-zinc-700 mx-auto mb-2" /><span className="text-xs text-zinc-600 font-serif px-2">{item.card.name}</span></div>
                )}
                <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm border border-border text-primary-foreground text-xs font-bold px-2 py-1 rounded-sm shadow-lg">x{item.quantity}</div>
                {item.quantity_locked > 0 && (
                    <div className="absolute top-2 left-2 bg-destructive/80 backdrop-blur-sm border border-destructive/50 text-destructive-foreground text-xs px-1.5 py-1 rounded-sm shadow-lg" title={`${item.quantity_locked} en venta`}>
                        <Lock className="h-3.5 w-3.5" />
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-border flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate" title={item.card.name}>
                        <HighlightedText text={item.card.name} highlight={searchTerm} />
                    </h3>
                    {isSellingMode && (
                        <Button size="sm" className="h-8 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground font-bold transition-all" onClick={() => onSell(item.id, item.card.name, 'card')}>
                            <TrendingUp className="h-4 w-4 mr-1.5" />Vender
                        </Button>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getConditionColor(item.condition)}`}>{item.condition}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-accent border border-border text-muted-foreground uppercase">{item.language}</span>
                    {item.is_foil && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-accent border border-border text-accent-foreground flex items-center gap-0.5" title="Foil">
                            <Sparkles className="h-3 w-3" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Inventory() {
    const navigate = useNavigate();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [packs, setPacks] = useState<InventoryPack[]>([]);
    const [stats, setStats] = useState<InventoryStats>({ totalCards: 0, totalPacks: 0 });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSets, setSelectedSets] = useState<any[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest'>('newest');

    const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
    const [selectedItemForSell, setSelectedItemForSell] = useState<{ id: number, name: string, type: 'card' | 'pack' } | null>(null);
    const [amountToSeller, setAmountToSeller] = useState<string>('');
    const [listingLoading, setListingLoading] = useState(false);

    const [openingPack, setOpeningPack] = useState<InventoryPack | null>(null);
    const [openedCards, setOpenedCards] = useState<any[]>([]);
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);

    const handleOpenPack = async (pack: InventoryPack) => {
        try {
            setLoading(true);
            const response = await apiService.axiosInstance.post(`/api/inventory/packs/${pack.id}/open`);
            if (response.data.success) {
                setOpeningPack(pack);
                setOpenedCards(response.data.cards);
                setIsOpeningModalOpen(true);
                toast.success(response.data.message);
                fetchInventory(currentPage);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al abrir el sobre');
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async (page: number) => {
        setLoading(true);
        try {
            // Convertimos la selección de sets a una cadena separada por comas (códigos o IDs)
            const setsParam = selectedSets.length > 0 ? selectedSets.join(',') : '';
            
            const response = await apiService.axiosInstance.get('/api/inventory', {
                params: {
                    page,
                    search: searchTerm,
                    sets: setsParam,
                    sort: sortBy
                }
            });
            
            setItems(response.data.inventoryCards.data);
            setPacks(response.data.inventoryPacks || []);
            setCurrentPage(response.data.inventoryCards.current_page);
            setLastPage(response.data.inventoryCards.last_page);
            setStats(response.data.stats);
        } catch (error) {
            console.error("Error al cargar la colección:", error);
        } finally {
            setLoading(false);
        }
    };

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isSellingMode = queryParams.get('mode') === 'sell';

    useEffect(() => { 
        // Cuando cambian los filtros, volvemos a la página 1
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchInventory(1);
        }
    }, [searchTerm, selectedSets, sortBy]);

    useEffect(() => { 
        fetchInventory(currentPage); 
    }, [currentPage]);

    const handleOpenSellDialog = (id: number, name: string, type: 'card' | 'pack') => {
        setSelectedItemForSell({ id, name, type });
        setAmountToSeller('');
        setIsSellDialogOpen(true);
    };

    const handleListOnMarket = async () => {
        if (!selectedItemForSell || !amountToSeller) return;
        const price = parseFloat(amountToSeller);
        if (isNaN(price) || price <= 0) { toast.error('Ingresa un precio válido'); return; }
        try {
            setListingLoading(true);
            await apiService.listOnMarket({ inventory_item_id: selectedItemForSell.id, type: selectedItemForSell.type, amount_to_seller: price });
            toast.success('Artículo puesto a la venta');
            setIsSellDialogOpen(false);
            fetchInventory(currentPage);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al listar el artículo');
        } finally {
            setListingLoading(false);
        }
    };

    const getConditionColor = (condition: string) => {
        const colors: Record<string, string> = {
            'NM': 'text-primary bg-primary/10 border-primary/20',
            'LP': 'text-secondary bg-secondary/10 border-secondary/20',
            'MP': 'text-accent-foreground bg-accent border-border',
            'HP': 'text-destructive bg-destructive/10 border-destructive/20',
        };
        return colors[condition] || 'text-muted-foreground bg-accent border-border';
    };

    // Derive available sets from inventory with robust data
    const availableSets = useMemo(() => {
        const setsMap = new Map<string, { id: number | string, name: string, code: string, icon_svg_uri?: string }>();
        packs.forEach(p => { 
            if (p.booster_pack?.set) {
                const s = p.booster_pack.set;
                setsMap.set(String(s.id), { 
                    id: s.id, 
                    name: s.name, 
                    code: (s as any).code || '',
                    icon_svg_uri: s.icon_svg_uri 
                }); 
            }
        });
        items.forEach(i => { 
            if (i.card?.set) {
                const s = i.card.set;
                setsMap.set(String(s.id), { 
                    id: s.id, 
                    name: s.name, 
                    code: (s as any).code || '', 
                    icon_svg_uri: s.icon_svg_uri
                }); 
            }
        });
        return Array.from(setsMap.values());
    }, [packs, items]);

    const toggleSet = (id: string) => setSelectedSets(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

    // Filtered + sorted collections
    const filteredSobres = useMemo(() => {
        let result = packs.filter(pack => {
            const matchSearch = !searchTerm.trim() || pack.booster_pack.name.toLowerCase().includes(searchTerm.toLowerCase());
            const setId = String(pack.booster_pack.set?.id || '');
            const setCode = (pack.booster_pack.set as any)?.code || '';
            const matchSet = selectedSets.length === 0 || 
                selectedSets.includes(setId) || 
                (setCode && selectedSets.includes(setCode));
            return matchSearch && matchSet;
        });
        if (sortBy === 'name_asc') result.sort((a, b) => a.booster_pack.name.localeCompare(b.booster_pack.name));
        else if (sortBy === 'name_desc') result.sort((a, b) => b.booster_pack.name.localeCompare(a.booster_pack.name));
        else if (sortBy === 'price_asc') result.sort((a, b) => a.booster_pack.price - b.booster_pack.price);
        else if (sortBy === 'price_desc') result.sort((a, b) => b.booster_pack.price - a.booster_pack.price);
        return result;
    }, [packs, searchTerm, selectedSets, sortBy]);

    const filteredCartas = useMemo(() => {
        // Ahora las cartas vienen filtradas del servidor, 
        // pero matenemos este memo por si hay micro-filtrados pendientes o sorting visual rápido
        return items;
    }, [items]);

    // Group by set when sets are selected
    const groupedSobres = useMemo(() => {
        if (selectedSets.length === 0) return null;
        const groups: Record<string, { setName: string; items: InventoryPack[] }> = {};
        filteredSobres.forEach(p => {
            const setId = String(p.booster_pack.set?.id ?? 'other');
            const setName = p.booster_pack.set?.name ?? 'Otros';
            if (!groups[setId]) groups[setId] = { setName, items: [] };
            groups[setId].items.push(p);
        });
        return groups;
    }, [filteredSobres, selectedSets]);

    const groupedCartas = useMemo(() => {
        if (selectedSets.length === 0) return null;
        const groups: Record<string, { setName: string; items: InventoryItem[] }> = {};
        filteredCartas.forEach(item => {
            const setId = String(item.card.set?.id ?? 'other');
            const setName = item.card.set?.name ?? 'Otros';
            if (!groups[setId]) groups[setId] = { setName, items: [] };
            groups[setId].items.push(item);
        });
        return groups;
    }, [filteredCartas, selectedSets]);

    return (
        <div className="px-6 py-12">
            {/* CABECERA Y ESTADÍSTICAS */}
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Bóveda Personal</h1>
                            <p className="text-muted-foreground text-sm">Gestiona tus cartas, revisa precios y prepara tu inventario para el mercado.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-background border border-border rounded-sm px-4 py-3 flex items-center gap-4">
                                <div className="p-2 bg-accent rounded-sm"><Layers className="h-5 w-5 text-accent-foreground" /></div>
                                <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cartas</p><p className="text-xl font-serif text-foreground">{stats.totalCards}</p></div>
                            </div>
                            <div className="bg-background border border-border rounded-sm px-4 py-3 flex items-center gap-4">
                                <div className="p-2 bg-secondary/10 rounded-sm"><Package className="h-5 w-5 text-secondary" /></div>
                                <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sobres</p><p className="text-xl font-serif text-foreground">{stats.totalPacks}</p></div>
                            </div>
                        </div>
                    </div>

                    {isSellingMode && (
                        <div className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-bold text-foreground">Modo de Venta Activo</p>
                                    <p className="text-xs text-muted-foreground">Haz clic en "Vender" en cualquier artículo para ponerlo en el mercado.</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/inventory')}>
                                Salir del modo venta
                            </Button>
                        </div>
                    )}

                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="mt-8 flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[180px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en mi colección..."
                                className="pl-10 bg-background border-border focus-visible:ring-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="bg-background border border-border text-foreground px-3 py-2 rounded-md text-sm"
                        >
                            <option value="newest">Más reciente</option>
                            <option value="price_asc">Precio: Menor a Mayor</option>
                            <option value="price_desc">Precio: Mayor a Menor</option>
                            <option value="name_asc">Nombre: A-Z</option>
                            <option value="name_desc">Nombre: Z-A</option>
                        </select>
                    </div>

                    {availableSets.length > 0 && (
                        <div className="mt-4 flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFilterModalOpen(true)}
                                    className={cn(
                                        "bg-background border-border text-xs gap-2 hover:bg-accent",
                                        selectedSets.length > 0 && "border-primary/50 text-primary"
                                    )}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    Filtrar por Set
                                    {selectedSets.length > 0 && (
                                        <Badge className="ml-1 bg-primary text-primary-foreground px-1.5 h-4 min-w-[1.25rem] flex items-center justify-center text-[10px] font-bold">
                                            {selectedSets.length}
                                        </Badge>
                                    )}
                                </Button>
                                
                                {selectedSets.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-px bg-border mx-1" />
                                        <button 
                                            onClick={() => setSelectedSets([])}
                                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                        >
                                            <X className="h-3 w-3" /> Limpiar filtros
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                {filteredCartas.length + filteredSobres.length} Items encontrados
                            </div>

                            <SetFilterModal 
                                isOpen={isFilterModalOpen}
                                onClose={() => setIsFilterModalOpen(false)}
                                availableSets={availableSets}
                                selectedSets={selectedSets}
                                onApply={(newSelection) => setSelectedSets(newSelection)}
                                accentColor="amber"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* CUADRÍCULA */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-pulse">
                        {[...Array(12)].map((_, i) => (<div key={i} className="aspect-[2.5/3.5] bg-accent rounded-lg border border-border"></div>))}
                    </div>
                ) : items.length === 0 && packs.length === 0 ? (
                    <div className="text-center py-20 bg-card border border-border rounded-sm border-dashed">
                        <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-serif text-foreground mb-2">Tu bóveda está vacía</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">Aún no tienes cartas en tu inventario. Abre sobres o añade cartas manualmente.</p>
                    </div>
                ) : (
                    <>
                        {/* SOBRES */}
                        {packs.length > 0 && (
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <Package className="h-5 w-5 text-secondary" />
                                    <h2 className="text-xl font-serif font-bold text-foreground">Sobres en tu Inventario</h2>
                                    <span className="text-sm text-muted-foreground bg-accent px-2 py-1 rounded-sm">{filteredSobres.reduce((t, p) => t + p.quantity, 0)} sobres</span>
                                </div>
                                {filteredSobres.length === 0 ? (
                                    <div className="text-center py-12 bg-card border border-border rounded-sm border-dashed">
                                        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">No se encontraron sobres con los filtros actuales</p>
                                    </div>
                                ) : groupedSobres ? (
                                    <div className="space-y-8">
                                        {Object.entries(groupedSobres).map(([sid, { setName: sn, items: gi }]) => (
                                            <div key={sid}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Tag className="h-4 w-4 text-primary" />
                                                    <h3 className="text-base font-semibold text-foreground">{sn}</h3>
                                                    <span className="text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded border border-border">{gi.length}</span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                                                    {gi.map(pack => (
                                                        <PackCard 
                                                            key={pack.id} 
                                                            pack={pack} 
                                                            isSellingMode={isSellingMode} 
                                                            searchTerm={searchTerm} 
                                                            onSell={handleOpenSellDialog}
                                                            onOpen={handleOpenPack}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                                        {filteredSobres.map(pack => (
                                            <PackCard 
                                                key={pack.id} 
                                                pack={pack} 
                                                isSellingMode={isSellingMode} 
                                                searchTerm={searchTerm} 
                                                onSell={handleOpenSellDialog}
                                                onOpen={handleOpenPack}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CARTAS */}
                        {items.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <Layers className="h-5 w-5 text-primary" />
                                    <h2 className="text-xl font-serif font-bold text-foreground">Cartas en tu Colección</h2>
                                    <span className="text-sm text-muted-foreground bg-accent px-2 py-1 rounded-sm">{filteredCartas.reduce((t, i) => t + i.quantity, 0)} cartas</span>
                                </div>
                                {filteredCartas.length === 0 ? (
                                    <div className="text-center py-12 bg-card border border-border rounded-sm border-dashed">
                                        <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">No se encontraron cartas con los filtros actuales</p>
                                    </div>
                                ) : groupedCartas ? (
                                    <div className="space-y-8">
                                        {Object.entries(groupedCartas).map(([sid, { setName: sn, items: gi }]) => (
                                            <div key={sid}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Tag className="h-4 w-4 text-primary" />
                                                    <h3 className="text-base font-semibold text-foreground">{sn}</h3>
                                                    <span className="text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded border border-border">{gi.length}</span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                                                    {gi.map(item => <CardItem key={item.id} item={item} isSellingMode={isSellingMode} searchTerm={searchTerm} getConditionColor={getConditionColor} onSell={handleOpenSellDialog} />)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                                        {filteredCartas.map(item => <CardItem key={item.id} item={item} isSellingMode={isSellingMode} searchTerm={searchTerm} getConditionColor={getConditionColor} onSell={handleOpenSellDialog} />)}
                                    </div>
                                )}

                                {lastPage > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-border">
                                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-background border-border text-foreground hover:bg-accent disabled:opacity-50">
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm text-muted-foreground font-medium px-4">Página <span className="text-foreground">{currentPage}</span> de {lastPage}</span>
                                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))} disabled={currentPage === lastPage} className="bg-background border-border text-foreground hover:bg-accent disabled:opacity-50">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* DIALOG DE VENTA */}
            <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
                <DialogContent className="bg-background border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Vender "{selectedItemForSell?.name}"</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Establece el precio que quieres RECIBIR por este artículo.
                            La plataforma añadirá automáticamente una pequeña comisión al precio final del comprador.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">¿Cuánto quieres ganar? (€)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                <Input type="number" step="0.01" placeholder="0.00" className="pl-8 bg-accent border-border" value={amountToSeller} onChange={(e) => setAmountToSeller(e.target.value)} />
                            </div>
                        </div>
                        {amountToSeller && parseFloat(amountToSeller) > 0 && (
                            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-1">
                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tu ganancia:</span><span className="text-foreground font-medium">{Number(amountToSeller || 0).toFixed(2)}€</span></div>
                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Comisión Marketplace:</span><span className="text-foreground font-medium">+{Number(Math.max(0.02, Number(amountToSeller || 0) * 0.1)).toFixed(2)}€</span></div>
                                <div className="pt-2 mt-2 border-t border-primary/20 flex justify-between font-bold">
                                    <span className="text-primary">Precio de Venta:</span>
                                    <span className="text-primary">{(Number(amountToSeller || 0) + Math.max(0.02, Number(amountToSeller || 0) * 0.1)).toFixed(2)}€</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSellDialogOpen(false)} disabled={listingLoading}>Cancelar</Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={handleListOnMarket} disabled={listingLoading || !amountToSeller}>
                            {listingLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            Poner a la venta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PackOpeningModal
                isOpen={isOpeningModalOpen}
                onClose={() => setIsOpeningModalOpen(false)}
                cards={openedCards}
                packName={openingPack?.booster_pack.name || 'Sobre'}
            />
        </div>
    );
}
