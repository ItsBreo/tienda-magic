import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import apiService from '@/services/ApiService';

import PacksHeader from '@/components/packs/PacksHeader';
import PacksGrid from '@/components/packs/PacksGrid';
import PackDialog from '@/components/packs/PackDialog';

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
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Estados Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPacks, setTotalPacks] = useState(0);

    // Cargar datos
    useEffect(() => {
        const loadPacks = async () => {
            try {
                setLoading(true);
                const response = await apiService.getPacks(currentPage);

                const packsArray = response?.data?.packs?.data || response?.data?.data || [];
                const current = response?.data?.current_page || response?.current_page || response?.data?.packs?.current_page || 1;
                const last = response?.data?.last_page || response?.last_page || response?.data?.packs?.last_page || 1;
                const total = response?.data?.total || response?.total || response?.data?.packs?.total || 0;

                setPacks(Array.isArray(packsArray) ? packsArray : []);
                setCurrentPage(current);
                setTotalPages(last);
                setTotalPacks(total);
            } catch (error) {
                toast.error('Error al cargar los packs disponibles');
                setPacks([]);
            } finally {
                setLoading(false);
            }
        };

        loadPacks();
    }, [currentPage]);

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

    // Filtrado
    const filteredPacks = useMemo(() => {
        if (!packs || !Array.isArray(packs)) return [];
        let filtered = packs;

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = packs.filter((pack) =>
                pack.name.toLowerCase().includes(searchLower) ||
                pack.type.toLowerCase().includes(searchLower) ||
                pack.card_set_id.toLowerCase().includes(searchLower)
            );
        }

        switch (sortBy) {
            case 'price-low-high': return [...filtered].sort((a, b) => a.price - b.price);
            case 'price-high-low': return [...filtered].sort((a, b) => b.price - a.price);
            case 'name-az': return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
            case 'newest': default: return [...filtered].sort((a, b) => b.id - a.id);
        }
    }, [packs, searchTerm, sortBy]);

    const handleBuyPack = (pack: Pack) => {
        toast.promise(
            new Promise((resolve) => setTimeout(() => resolve('Pack comprado'), 1500)),
            { loading: 'Procesando...', success: `¡Has comprado ${pack.name}!`, error: 'Error' }
        );
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
                            placeholder="Buscar packs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 bg-zinc-900 border-zinc-700 text-zinc-100"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-sm">Ordenar por:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-lg"
                        >
                            <option value="newest">Novedades</option>
                            <option value="price-low-high">Menor a Mayor</option>
                            <option value="price-high-low">Mayor a Menor</option>
                            <option value="name-az">A-Z</option>
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
                        packs={filteredPacks}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalPacks={totalPacks}
                        onPageChange={setCurrentPage}
                        onPackClick={() => {}}
                        onBuyPack={handleBuyPack}
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
        </div>
    );
}
