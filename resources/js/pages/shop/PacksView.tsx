import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import apiService from '@/services/ApiService';

import PacksHeader from '@/components/packs/PacksHeader';
import PacksGrid from '@/components/packs/PacksGrid';
import PackDialog from '@/components/packs/PackDialog';
import CardLightbox from '@/components/packs/CardLightbox';

interface Pack {
    id: number;
    name: string;
    price: number;
    card_set_id: string;
    type: string;
    image_url?: string;
    config: any;
}

export default function PacksView() {
    const location = useLocation();
    const [packs, setPacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<'packs' | 'cards'>('packs');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
    const [selectedCard, setSelectedCard] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCardLightboxOpen, setIsCardLightboxOpen] = useState(false);

    // Estados Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPacks, setTotalPacks] = useState(0);

    // Cargar datos
    useEffect(() => {
        const loadPacks = async () => {
            try {
                setLoading(true);
                const response = category === 'packs' 
                    ? await apiService.getPacks(currentPage, sortBy)
                    : await apiService.getShopCards(currentPage, sortBy);

                const packsArray = response?.data?.items?.data || response?.data?.packs?.data || response?.data || [];
                const current = response?.data?.items?.current_page || response?.data?.packs?.current_page || response?.current_page || 1;
                const last = response?.data?.items?.last_page || response?.data?.packs?.last_page || response?.last_page || 1;
                const total = response?.data?.items?.total || response?.data?.packs?.total || response?.total || 0;

                setPacks(Array.isArray(packsArray) ? packsArray : []);
                setCurrentPage(current);
                setTotalPages(last);
                setTotalPacks(total);
            } catch (error) {
                toast.error(`Error al cargar los ${category === 'packs' ? 'sobres' : 'cartas'} disponibles`);
                setPacks([]);
            } finally {
                setLoading(false);
            }
        };

        loadPacks();
    }, [currentPage, sortBy, category]);

    // Interceptar openPackId del estado del router
    useEffect(() => {
        const openPackId = location.state?.openPackId;
        if (openPackId && packs.length > 0) {
            const pack = packs.find(p => p.id === openPackId);
            if (pack) {
                setSelectedPack(pack);
                setIsDialogOpen(true);
                // Limpiar estado del router para evitar reapertura en F5
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, packs]);

    // Eliminado ordenamiento local - ahora se maneja en backend

    const handleAddToCart = async (item: any) => {
        try {
            const isPack = !!item.booster_pack_id || !item.rarity;
            await apiService.addToCart({
                [isPack ? 'booster_pack_id' : 'card_id']: item.id,
                quantity: 1
            });
            toast.success(`${item.name} añadido al carrito`);
        } catch (error) {
            toast.error('Error al añadir al carrito');
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

            <PacksHeader />

            {/* Toolbar */}
            <div className="bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative flex-1 sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <Input
                            type="text"
                            placeholder={category === 'packs' ? "Buscar packs..." : "Buscar cartas..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 bg-zinc-900 border-zinc-700 text-zinc-100"
                        />
                    </div>

                    <div className="flex bg-zinc-800 p-1 rounded-lg">
                        <button
                            onClick={() => { setCategory('packs'); setCurrentPage(1); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                category === 'packs' ? 'bg-emerald-600 text-black shadow-lg' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Sobres
                        </button>
                        <button
                            onClick={() => { setCategory('cards'); setCurrentPage(1); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                category === 'cards' ? 'bg-emerald-600 text-black shadow-lg' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Cartas Sueltas
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-sm">Ordenar por:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-lg"
                        >
                            <option value="newest">Novedades</option>
                            <option value="price_asc">Menor a Mayor</option>
                            <option value="price_desc">Mayor a Menor</option>
                            <option value="name_asc">A-Z</option>
                            <option value="name_desc">Z-A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid y Paginación */}
            <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
                    </div>
                ) : packs.length === 0 ? (
                    <div className="text-center py-20 text-zinc-400">No hay packs disponibles.</div>
                ) : (
                    <PacksGrid
                        packs={packs}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalPacks={totalPacks}
                        onPageChange={setCurrentPage}
                        onPackClick={(item) => {
                            if (category === 'packs') {
                                setSelectedPack(item);
                                setIsDialogOpen(true);
                            } else {
                                setSelectedCard(item);
                                setIsCardLightboxOpen(true);
                            }
                        }}
                        onBuyPack={handleAddToCart}
                    />
                )}
            </div>

            {/* Pack Dialog */}
            <PackDialog
                pack={selectedPack}
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedPack(null);
                }}
            />

            <CardLightbox
                card={selectedCard}
                onClose={() => {
                    setIsCardLightboxOpen(false);
                    setSelectedCard(null);
                }}
            />
        </div>
    );
}
