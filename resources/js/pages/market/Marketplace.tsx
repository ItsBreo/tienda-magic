import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Loader2, TrendingUp, ShoppingCart, User, Package, Calendar, XCircle, PlusCircle, ArrowRight, Tag, SlidersHorizontal, X, Filter } from 'lucide-react';
import SetFilterModal from '@/components/common/SetFilterModal';
import apiService from '@/services/ApiService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import HighlightedText from '@/components/common/HighlightedText';

interface Listing {
    id: number;
    seller_id: number;
    listable_id: number;
    listable_type: string;
    inventory_item_id: number;
    price_total: string;
    fee_platform: string;
    amount_to_seller: string;
    status: string;
    created_at: string;
    listable: {
        id: number;
        name: string;
        image_uri?: string;
        image_url?: string;
        rarity?: string;
        card_set?: { code: string; name: string };
        cardSet?: { code: string; name: string };
    };
    seller: {
        id: number;
        username: string;
    };
}

export default function Marketplace() {
    const { user, checkAuth } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState<'all' | 'card' | 'pack' | 'my'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSets, setSelectedSets] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [availableSetsState, setAvailableSetsState] = useState<{code: string, name: string}[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadListings();
    }, [currentPage, type, selectedSets]);

    // Reset to page 1 when searching/filtering
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSets, type, sortBy]);

    const loadListings = async () => {
        setLoading(true);
        try {
            let response;
            if (type === 'my') {
                response = await apiService.getMyMarketListings();
                setListings(Array.isArray(response) ? response : response.data || []);
                setTotalPages(1);
            } else {
                const params: any = { 
                    page: currentPage,
                    set: selectedSets.length > 0 ? selectedSets.join(',') : undefined
                };
                if (type !== 'all') params.type = type;
                response = await apiService.axiosInstance.get('/api/market', { params });
                
                const responseData = response.data;
                setListings(responseData.data || []);
                setTotalPages(responseData.last_page || 1);
                
                // Extract sets from the metadata returned by the API
                const metaSets = responseData.sets || [];
                if (Array.isArray(metaSets) && metaSets.length > 0) {
                    setAvailableSetsState(metaSets);
                }
            }
        } catch (error: any) {
            // Solo mostramos error si no es una cancelación intencional o un 404 (que manejamos con UI vacía)
            if (error?.response?.status !== 404) {
                toast.error('Error al cargar el mercado');
            }
            console.error('[Marketplace] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering + sorting (search, sets, sort stay instant)
    const availableSets = availableSetsState;

    const filteredListings = useMemo(() => {
        let result = [...listings];

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(l => l.listable.name.toLowerCase().includes(lower));
        }

        if (selectedSets.length > 0) {
            result = result.filter(l => {
                const set = l.listable.card_set || l.listable.cardSet;
                return set?.code && selectedSets.includes(set.code);
            });
        }

        if (sortBy === 'price_asc') result.sort((a, b) => parseFloat(a.price_total) - parseFloat(b.price_total));
        else if (sortBy === 'price_desc') result.sort((a, b) => parseFloat(b.price_total) - parseFloat(a.price_total));
        else if (sortBy === 'name_asc') result.sort((a, b) => a.listable.name.localeCompare(b.listable.name));
        else if (sortBy === 'name_desc') result.sort((a, b) => b.listable.name.localeCompare(a.listable.name));

        return result;
    }, [listings, searchTerm, selectedSets, sortBy]);

    // Group by set when sets are selected
    const grouped = useMemo(() => {
        if (selectedSets.length === 0) return null;
        const groups: Record<string, { setName: string; items: Listing[] }> = {};
        filteredListings.forEach(l => {
            const setCodeInput = l.listable.set?.code || (l.listable as any).card_set_id;
            const setIdInput = l.listable.set?.id;
            
            const setInfo = availableSets.find(s => 
                (s.code && s.code === setCodeInput) || 
                String(s.id) === String(setCodeInput) ||
                String(s.id) === String(setIdInput)
            );
            
            const key = setInfo?.code || String(setCodeInput) || 'other';

            if (!groups[key]) {
                groups[key] = {
                    setName: setInfo?.name || 'Otros',
                    items: []
                };
            }
            groups[key].items.push(l);
        });
        return groups;
    }, [filteredListings, selectedSets, availableSets]);

    const handleNavigateToProduct = (listing: Listing) => {
        const productType = listing.listable_type.includes('Card') ? 'card' : 'pack';
        navigate(`/market/product/${productType}/${listing.listable_id}`);
    };

    const handleCancel = async (e: React.MouseEvent, listingId: number) => {
        e.stopPropagation();
        try {
            setLoading(true);
            await apiService.cancelMarketListing(listingId);
            toast.success('Anuncio cancelado con éxito');
            loadListings();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al cancelar anuncio');
        } finally {
            setLoading(false);
        }
    };

    const toggleSet = (code: string) => {
        setSelectedSets(prev =>
            prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]
        );
    };

    const renderCard = (listing: Listing) => (
        <div
            key={listing.id}
            className={cn(
                "border border-border rounded-xl md:px-4 px-3 py-4 bg-card w-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1"
            )}
            onClick={() => handleNavigateToProduct(listing)}
        >
            {/* Contenedor de Imagen */}
            <div className="group/img cursor-pointer flex items-center justify-center bg-accent/5 rounded-lg p-2 h-48 relative overflow-hidden">
                <img
                    src={listing.listable.image_uri || listing.listable.image_url || '/placeholder-card.png'}
                    alt={listing.listable.name}
                    className="group-hover/img:scale-110 transition-transform duration-500 max-h-full object-contain drop-shadow-md"
                />
                
                <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-sm text-[10px] font-black text-primary px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter shadow-sm">
                    {listing.listable_type.includes('Card') ? 'Carta' : 'Sobre'}
                </div>
            </div>

            {/* Información */}
            <div className="mt-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-foreground font-forum font-bold text-lg md:text-xl leading-tight line-clamp-2 min-h-[2.5rem] flex-1 uppercase tracking-tight">
                        <HighlightedText text={listing.listable.name} highlight={searchTerm} highlightClassName="bg-primary/20 text-primary rounded-sm" />
                    </h3>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0">
                        {listing.seller?.username?.slice(0, 1).toUpperCase() || '?'}
                    </div>
                    <p className="text-[11px] font-black tracking-wider uppercase text-muted-foreground truncate">{listing.seller?.username || 'Desconocido'}</p>
                </div>

                <div className="flex items-end justify-between mt-auto pt-4">
                    <div className="flex flex-col">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Precio</p>
                        <p className="md:text-xl text-lg font-black text-primary">
                            €{Number(listing.price_total).toFixed(2)}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                        {type === 'my' ? (
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCancel(e, listing.id); }}
                                className="h-8 px-4 bg-destructive/10 text-destructive border-transparent hover:bg-destructive hover:text-destructive-foreground font-black text-[10px] uppercase tracking-widest transition-colors rounded-lg"
                            >
                                Cancelar
                            </Button>
                        ) : (
                            <Button 
                                variant="outline"
                                size="sm"
                                className="h-8 px-4 bg-primary text-primary-foreground border-none hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 rounded-lg"
                            >
                                Comprar
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Elegante sin iconos */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border pb-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-widest font-black text-primary">Comercio de Usuarios</span>
                        <h1 className="text-4xl md:text-5xl font-forum font-bold text-foreground">
                            Mercado Abierto
                        </h1>
                    </div>
                    <button
                        className="bg-foreground text-background font-black text-xs uppercase tracking-widest h-11 px-8 rounded-xl hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all shadow-md group"
                        onClick={() => navigate('/inventory?mode=sell')}
                    >
                        Vender Artículo
                    </button>
                </div>

                {/* ── BARRA DE CONTROLES PRINCIPAL (Diseño Fino) ── */}
                <div className="flex flex-col lg:flex-row items-center gap-3 mb-8 w-full border-b border-border pb-6">
                    
                    {/* 1. Selector de Tipos (Misma altura h-10) */}
                    <div className="flex bg-accent p-1 rounded-lg w-full lg:w-auto overflow-x-auto flex-shrink-0">
                        {(['all', 'card', 'pack', 'my'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    type === t 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/20"
                                )}
                            >
                                {t === 'all' ? 'Todo' : t === 'card' ? 'Cartas' : t === 'pack' ? 'Sobres' : 'Mis Anuncios'}
                            </button>
                        ))}
                    </div>

                    {/* 2. Filtros y Búsqueda */}
                    <div className="flex flex-1 flex-col sm:flex-row items-center gap-2 w-full">
                        
                        {/* Buscador */}
                        <div className="relative flex-1 min-w-[200px] w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 h-10 bg-background border border-border text-sm font-medium rounded-lg focus-visible:ring-1 focus-visible:ring-primary shadow-sm hover:border-primary/50 transition-all w-full"
                            />
                        </div>

                        {/* Ordenación */}
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full sm:w-auto h-10 pl-3 pr-8 bg-background border border-border text-foreground text-sm font-medium rounded-lg focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer shadow-sm hover:border-primary/50 transition-all"
                            >
                                <option value="newest">Novedades</option>
                                <option value="price_asc">Menor a Mayor</option>
                                <option value="price_desc">Mayor a Menor</option>
                                <option value="name_asc">A-Z</option>
                                <option value="name_desc">Z-A</option>
                            </select>
                            <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Filtrar por set */}
                        {availableSets.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterModalOpen(true)}
                                className={cn(
                                    "h-10 rounded-lg border-border bg-background text-sm font-medium px-4 gap-2 transition-all shadow-sm hover:border-primary/50 hover:bg-accent/30 w-full sm:w-auto flex-shrink-0",
                                    selectedSets.length > 0 && "border-primary/50 text-primary bg-primary/5 ring-1 ring-primary/20"
                                )}
                            >
                                <Filter className="h-4 w-4" />
                                <span className="hidden lg:inline">Filtrar por Set</span>
                                <span className="lg:hidden">Set</span>
                                {selectedSets.length > 0 && (
                                    <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-black rounded-md ml-1">
                                        {selectedSets.length}
                                    </Badge>
                                )}
                            </Button>
                        )}
                        
                    </div>
                </div>

                {/* Filtros Modal y Tags Auxiliares */}
                {(selectedSets.length > 0 && availableSets.length > 0) && (
                    <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Filtros Activos:</span>
                        <button
                            onClick={() => setSelectedSets([])}
                            className="text-[10px] uppercase font-black tracking-widest text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                            <X className="h-3 w-3" /> Limpiar Todo
                        </button>
                    </div>
                )}

                <SetFilterModal 
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    availableSets={availableSetsState.map(s => ({ ...s, id: s.code }))}
                    selectedSets={selectedSets}
                    onApply={(newSelection) => setSelectedSets(newSelection as string[])}
                    accentColor="emerald"
                />

                {/* Results count */}
                {!loading && (
                    <p className="text-sm text-muted-foreground mb-4">
                        {filteredListings.length} {filteredListings.length === 1 ? 'resultado' : 'resultados'}
                        {searchTerm && <> para "<span className="text-foreground">{searchTerm}</span>"</>}
                    </p>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-primary w-12 h-12" />
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-accent/30 rounded-3xl border border-dashed border-border">
                        <Package className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-lg">No hay artículos con los filtros actuales.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedSets([]); }} className="mt-3 text-sm text-primary hover:text-primary/80">
                            Limpiar filtros
                        </button>
                    </div>
                ) : grouped ? (
                    // Grouped by set view
                    <div className="space-y-10">
                        {Object.entries(grouped).map(([code, { setName, items }]) => (
                            <div key={code}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Tag className="w-4 h-4 text-primary" />
                                    <h2 className="text-xl font-bold text-foreground">{setName}</h2>
                                    <span className="text-sm text-muted-foreground bg-accent px-2 py-0.5 rounded-full border border-border">{items.length} artículos</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {items.map(renderCard)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Normal grid view
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredListings.map(renderCard)}
                    </div>
                )}
            </div>
        </div>
    );
}

const ChevronRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);
