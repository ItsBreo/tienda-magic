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
        <Card
            key={listing.id}
            className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col h-full"
            onClick={() => handleNavigateToProduct(listing)}
        >
            <CardHeader className="p-0 overflow-hidden rounded-t-xl aspect-[3/4] relative">
                <img
                    src={listing.listable.image_uri || listing.listable.image_url || '/placeholder-card.png'}
                    alt={listing.listable.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                    <Badge className="bg-background/80 backdrop-blur-md border-border text-primary font-bold">
                        {listing.listable_type.includes('Card') ? 'Carta' : 'Sobre'}
                    </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-foreground text-xs font-bold flex items-center gap-1">
                        Ver detalles <ChevronRight className="w-3 h-3" />
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg font-bold line-clamp-1">
                        <HighlightedText text={listing.listable.name} highlight={searchTerm} />
                    </CardTitle>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-auto">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">
                        {listing.seller?.username?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <p className="font-bold text-foreground">{listing.seller?.username || 'Desconocido'}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Precio</p>
                        <p className="text-2xl font-black text-primary tabular-nums">{Number(listing.price_total).toFixed(2)}€</p>
                    </div>
                    {type === 'my' ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => handleCancel(e, listing.id)}
                            className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground rounded-lg h-9"
                        >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Cancelar
                        </Button>
                    ) : (
                        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex-1 bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                            Mercado Abierto
                        </h1>
                        <p className="text-muted-foreground mt-2">Explora los activos digitales de la comunidad</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-6 rounded-xl transition-all hover:scale-105"
                            onClick={() => navigate('/inventory?mode=sell')}
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Vender un Artículo
                        </Button>
                    </div>
                </div>

                {/* Type Tabs + Sort */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-accent/50 p-2 rounded-xl border border-border backdrop-blur-sm">
                        {(['all', 'card', 'pack', 'my'] as const).map(t => (
                            <Button
                                key={t}
                                variant={type === t ? 'default' : 'ghost'}
                                onClick={() => setType(t)}
                                className={type === t ? (t === 'my' ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground') : 'text-muted-foreground hover:text-foreground'}
                            >
                                {t === 'all' ? 'Todo' : t === 'card' ? 'Cartas' : t === 'pack' ? 'Sobres' : 'Mis Anuncios'}
                            </Button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="bg-background border border-border text-foreground px-3 py-2 rounded-xl text-sm"
                    >
                        <option value="newest">Más reciente</option>
                        <option value="price_asc">Precio: Menor a Mayor</option>
                        <option value="price_desc">Precio: Mayor a Menor</option>
                        <option value="name_asc">Nombre: A-Z</option>
                        <option value="name_desc">Nombre: Z-A</option>
                    </select>
                </div>

                {/* Search + Set filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary"
                        />
                    </div>

                    {/* Set filter Modal Button */}
                    {availableSets.length > 0 && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFilterModalOpen(true)}
                                className={cn(
                                    "bg-background border-border text-xs gap-2 hover:bg-primary/10 hover:border-primary/50 hover:text-primary font-medium",
                                    selectedSets.length > 0 && "border-primary/50 text-primary bg-primary/5"
                                )}
                            >
                                <Filter className="h-4 w-4" />
                                Filtrar por Set
                                {selectedSets.length > 0 && (
                                    <Badge className="ml-1 bg-primary text-primary-foreground px-1.5 h-4 min-w-[1.25rem] flex items-center justify-center text-[10px] font-bold">
                                        {selectedSets.length}
                                    </Badge>
                                )}
                            </Button>

                            {selectedSets.length > 0 && (
                                <button
                                    onClick={() => setSelectedSets([])}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                    <X className="h-3 w-3" /> Limpiar filtros
                                </button>
                            )}

                            <SetFilterModal 
                                isOpen={isFilterModalOpen}
                                onClose={() => setIsFilterModalOpen(false)}
                                availableSets={availableSetsState.map(s => ({ ...s, id: s.code }))}
                                selectedSets={selectedSets}
                                onApply={(newSelection) => setSelectedSets(newSelection as string[])}
                                accentColor="emerald"
                            />
                        </div>
                    )}
                </div>

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
