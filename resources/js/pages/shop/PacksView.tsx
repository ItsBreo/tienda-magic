import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Loader2, Tag, X, Filter } from 'lucide-react';
import SetFilterModal from '@/components/common/SetFilterModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import apiService from '@/services/ApiService';
import { showAddToCartToast } from '@/utils/toastUtils';

//import PacksHeader from '@/components/packs/PacksHeader';
import PacksGrid from '@/components/packs/PacksGrid';
import PackDialog from '@/components/packs/PackDialog';
import CardDetailModal from '@/components/common/CardDetailModal';
import { useCart } from '@/contexts/CartContext';

interface Pack {
    id: number;
    name: string;
    price: number;
    card_set_id: string; // From PacksGrid
    type: string;
    image_url?: string;
    cover_image?: string; // From PacksGrid
    image_uri?: string; // From PacksGrid
    rarity?: string;
    booster_pack_id?: number;
    card_id?: number;
    stock?: number;
    config: any; // Simplified since it's dynamic
}

export default function PacksView() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
    const [selectedCard, setSelectedCard] = useState<Pack | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCardLightboxOpen, setIsCardLightboxOpen] = useState(false);

    const [packsData, setPacksData] = useState<Pack[]>([]);
    const [cardsData, setCardsData] = useState<Pack[]>([]);

    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<'packs' | 'cards'>('packs');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPacks, setTotalPacks] = useState(0);
    const [selectedSets, setSelectedSets] = useState<string[]>([]);
    const [availableSets, setAvailableSets] = useState<{ id: string; name: string; code: string }[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const { addToCart } = useCart();

    // Fetch available sets - Now populated from catalog response
    useEffect(() => {
        // Sets are now loaded within the loadPacks effect
    }, []);

    useEffect(() => {
        const loadPacks = async () => {
            try {
                setLoading(true);
                const setParam = selectedSets.length > 0 ? selectedSets.join(',') : '';
                const response = category === 'packs'
                    ? await apiService.getPacks(currentPage, sortBy, setParam, searchTerm)
                    : await apiService.getShopCards(currentPage, sortBy, setParam, searchTerm);

                const packsArray = response?.data?.items?.data || response?.data?.packs?.data || response?.data || [];
                const current = response?.data?.items?.current_page || response?.data?.packs?.current_page || response?.current_page || 1;
                const last = response?.data?.items?.last_page || response?.data?.packs?.last_page || response?.last_page || 1;
                const total = response?.data?.items?.total || response?.data?.packs?.total || response?.total || 0;

                // Extract sets from the CatalogController response
                const metaData = response?.data || response;
                if (metaData.sets && Array.isArray(metaData.sets)) {
                    setAvailableSets(metaData.sets);
                }

                if (category === 'packs') {
                    setPacksData(Array.isArray(packsArray) ? packsArray : []);
                } else {
                    setCardsData(Array.isArray(packsArray) ? packsArray : []);
                }
                setCurrentPage(current);
                setTotalPages(last);
                setTotalPacks(total);
            } catch (error) {
                toast.error(`Error al cargar los ${category === 'packs' ? 'sobres' : 'cartas'} disponibles`);
                setPacksData([]);
                setCardsData([]);
            } finally {
                setLoading(false);
            }
        };

        loadPacks();
    }, [currentPage, sortBy, category, searchTerm, selectedSets]);
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam === 'cards' || categoryParam === 'packs') {
            setCategory(categoryParam);
            setCurrentPage(1);
        }
    }, [searchParams]);

    useEffect(() => {
        const openCard = searchParams.get('openCard');
        const openPack = searchParams.get('openPack');

        if (!openCard && !openPack) return;

        if (openPack && packsData && packsData.length > 0) {
            const pack = packsData.find(p => p.id === parseInt(openPack, 10));
            if (pack) {
                setSelectedPack(pack);
                setIsDialogOpen(true);
                setSearchParams(prev => {
                    prev.delete('openPack');
                    return prev;
                }, { replace: true });
            }
        }

        if (openCard && cardsData && cardsData.length > 0) {
            const card = cardsData.find(c => c.id === parseInt(openCard, 10));
            if (card) {
                setSelectedPack(null);
                setSelectedCard(card);
                setIsCardLightboxOpen(true);
                setSearchParams(prev => {
                    prev.delete('openCard');
                    return prev;
                }, { replace: true });
            }
        }
    }, [searchParams, packsData, cardsData, setSearchParams]);

    useEffect(() => {
        const openPackId = location.state?.openPackId;
        if (openPackId && packsData.length > 0) {
            const pack = packsData.find(p => p.id === openPackId);
            if (pack) {
                setSelectedPack(pack);
                setSelectedCard(null);
                setIsDialogOpen(true);
                setCategory('packs');
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, packsData]);

    const handleAddToCartAction = async (item: Pack, quantity: number = 1) => {
        const isPack = !!item.booster_pack_id || !item.rarity;
        try {
            await addToCart({
                type: isPack ? 'pack' : 'card',
                id: item.id,
                quantity
            });
            showAddToCartToast(`${item.name}`, quantity, isPack ? 'pack' : 'card');
        } catch (error: any) {
            console.error('Error al añadir al carrito:', error);
            toast.error('Error al añadir al carrito');
        }
    };

    const currentData = category === 'packs' ? packsData : cardsData;

    // Grouping logic for when sets are selected
    const groupedData = useMemo(() => {
        if (selectedSets.length === 0) return null;
        
        const groups: Record<string, { setName: string; items: Pack[] }> = {};
        
        currentData.forEach(item => {
            // Find canonical set info
            const setCodeInput = (item as any).set?.code || item.card_set_id;
            const setIdInput = (item as any).set?.id;
            
            const setInfo = availableSets.find(s => 
                (s.code && s.code === setCodeInput) || 
                String(s.id) === String(setCodeInput) ||
                String(s.id) === String(setIdInput)
            );
            
            // Use code as canonical key, fallback to ID or 'other'
            const key = setInfo?.code || String(setCodeInput) || 'other';
            
            if (!groups[key]) {
                groups[key] = { 
                    setName: setInfo?.name || 'Otros', 
                    items: [] 
                };
            }
            groups[key].items.push(item);
        });
        
        return groups;
    }, [currentData, selectedSets, availableSets]);

    return (
        <div className="flex-1 bg-background text-foreground pb-20">
            <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />


            {/* Toolbar */}
            <div className="bg-background/90 backdrop-blur-sm border-b border-border sticky top-[60px] z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={category === 'packs' ? 'Buscar packs...' : 'Buscar cartas...'}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-4 bg-background border-border text-foreground focus-visible:ring-primary"
                        />
                    </div>

                    {/* Category toggle */}
                    <div className="flex bg-accent p-1 rounded-lg">
                        <button
                            onClick={() => { setCategory('packs'); setCurrentPage(1); setSelectedSets([]); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                category === 'packs' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Sobres
                        </button>
                        <button
                            onClick={() => { setCategory('cards'); setCurrentPage(1); setSelectedSets([]); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                category === 'cards' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Cartas Sueltas
                        </button>
                    </div>

                    {/* Sort & Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                            className="bg-background border border-border text-foreground px-3 py-2 rounded-lg text-sm h-10 focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                            <option value="newest">Novedades</option>
                            <option value="price_asc">Menor a Mayor</option>
                            <option value="price_desc">Mayor a Menor</option>
                            <option value="name_asc">A-Z</option>
                            <option value="name_desc">Z-A</option>
                        </select>

                        {availableSets.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFilterModalOpen(true)}
                                className={cn(
                                    "bg-background border-border text-xs gap-2 hover:bg-primary/10 hover:border-primary/50 hover:text-primary font-bold h-10 px-4",
                                    selectedSets.length > 0 && "border-primary/50 text-primary bg-primary/5"
                                )}
                            >
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filtrar por Set</span>
                                {selectedSets.length > 0 && (
                                    <Badge className="ml-1 bg-primary text-primary-foreground px-1.5 h-4 min-w-[1.25rem] flex items-center justify-center text-[10px] font-bold">
                                        {selectedSets.length}
                                    </Badge>
                                )}
                            </Button>
                        )}

                        {selectedSets.length > 0 && (
                            <button
                                onClick={() => { setSelectedSets([]); setCurrentPage(1); }}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2"
                                title="Limpiar filtros"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                <SetFilterModal 
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    availableSets={availableSets}
                    selectedSets={selectedSets}
                    onApply={(newSelection) => {
                        setSelectedSets(newSelection as string[]);
                        setCurrentPage(1);
                    }}
                    accentColor="emerald"
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-primary w-12 h-12" />
                    </div>
                ) : currentData.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        {category === 'packs' ? 'No hay sobres disponibles.' : 'No hay cartas disponibles.'}
                    </div>
                ) : groupedData ? (
                    <div className="space-y-12">
                        {Object.entries(groupedData).map(([code, { setName, items }]) => (
                            <div key={code} className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-border pb-2">
                                    <Tag className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold text-foreground">{setName}</h2>
                                    <span className="text-sm text-muted-foreground bg-accent px-2 py-0.5 rounded-full border border-border">
                                        {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                                    </span>
                                </div>
                                <PacksGrid
                                    packs={items}
                                    currentPage={1}
                                    totalPages={1}
                                    totalPacks={items.length}
                                    onPageChange={() => {}}
                                    category={category}
                                    searchTerm={searchTerm}
                                    onPackClick={(item) => {
                                        if (category === 'packs') {
                                            setSelectedPack(item);
                                            setSelectedCard(null);
                                            setIsDialogOpen(true);
                                        } else {
                                            setSelectedCard(item);
                                            setSelectedPack(null);
                                            setIsCardLightboxOpen(true);
                                        }
                                    }}
                                    onBuyPack={handleAddToCartAction}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <PacksGrid
                        packs={currentData}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalPacks={totalPacks}
                        onPageChange={setCurrentPage}
                        category={category}
                        searchTerm={searchTerm}
                        onPackClick={(item) => {
                            if (category === 'packs') {
                                setSelectedPack(item);
                                setSelectedCard(null);
                                setIsDialogOpen(true);
                            } else {
                                setSelectedCard(item);
                                setSelectedPack(null);
                                setIsCardLightboxOpen(true);
                            }
                        }}
                        onBuyPack={handleAddToCartAction}
                    />
                )}
            </div>

            {selectedPack && (
                <PackDialog
                    pack={selectedPack}
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setSelectedPack(null);
                    }}
                />
            )}

            {selectedCard && (
                <CardDetailModal
                    card={selectedCard as any}
                    onClose={() => {
                        setIsCardLightboxOpen(false);
                        setSelectedCard(null);
                    }}
                    actionLabel="Añadir al Carrito"
                    onAction={() => handleAddToCartAction(selectedCard)}
                />
            )}
        </div>
    );
}
