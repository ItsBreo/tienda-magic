import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search, Filter, Sparkles, Lock, Image as ImageIcon,
    ChevronLeft, ChevronRight, Layers, Package
} from 'lucide-react';

// --- INTERFACES DE TYPESCRIPT ---
interface SetData {
    id: number;
    name: string;
    icon_svg_uri?: string;
}

interface CardData {
    id: number;
    name: string;
    image_url?: string;
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

interface InventoryStats {
    totalCards: number;
    totalPacks: number;
}

export default function Inventory() {
    // Estados
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState<InventoryStats>({ totalCards: 0, totalPacks: 0 });
    const [loading, setLoading] = useState(true);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Buscador visual (para el futuro filtro)
    const [searchTerm, setSearchTerm] = useState('');

    // Obtener los datos del backend
    const fetchInventory = async (page: number) => {
        setLoading(true);
        try {
            // Llamamos a nuestro index() refactorizado en InventoryController
            const response = await apiService.axiosInstance.get(`/api/inventory?page=${page}`);

            setItems(response.data.inventoryCards.data);
            setCurrentPage(response.data.inventoryCards.current_page);
            setLastPage(response.data.inventoryCards.last_page);
            setStats(response.data.stats);

        } catch (error) {
            console.error("Error al cargar la colección:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory(currentPage);
    }, [currentPage]);

    // Función auxiliar para el color del estado de la carta
    const getConditionColor = (condition: string) => {
        const colors: Record<string, string> = {
            'NM': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            'LP': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
            'MP': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
            'HP': 'text-red-400 bg-red-400/10 border-red-400/20',
        };
        return colors[condition] || 'text-zinc-400 bg-zinc-800 border-zinc-700';
    };

    return (
        <TiendaMagicLayout breadcrumbs={[{ title: 'Mi Colección', href: '/inventory' }]}>

            {/* CABECERA Y ESTADÍSTICAS */}
            <div className="bg-zinc-900 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-zinc-100 mb-2">
                                Bóveda Personal
                            </h1>
                            <p className="text-zinc-400 text-sm">
                                Gestiona tus cartas, revisa precios y prepara tu inventario para el mercado.
                            </p>
                        </div>

                        {/* Tarjetas de Estadísticas Rápidas */}
                        <div className="flex gap-4">
                            <div className="bg-zinc-950 border border-zinc-800 rounded-sm px-4 py-3 flex items-center gap-4">
                                <div className="p-2 bg-amber-500/10 rounded-sm">
                                    <Layers className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Cartas</p>
                                    <p className="text-xl font-serif text-zinc-100">{stats.totalCards}</p>
                                </div>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 rounded-sm px-4 py-3 flex items-center gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-sm">
                                    <Package className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Sobres</p>
                                    <p className="text-xl font-serif text-zinc-100">{stats.totalPacks}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BARRA DE HERRAMIENTAS (Buscador y Filtros) */}
                    <div className="mt-8 flex gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Buscar en mi colección..."
                                className="pl-10 bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros
                        </Button>
                        <Button className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/30 ml-auto hidden sm:flex">
                            + Añadir Cartas
                        </Button>
                    </div>
                </div>
            </div>

            {/* CUADRÍCULA DE CARTAS */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-pulse">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2.5/3.5] bg-zinc-900 rounded-lg border border-zinc-800"></div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-sm border-dashed">
                        <Layers className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-serif text-zinc-300 mb-2">Tu bóveda está vacía</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto mb-6">Aún no tienes cartas en tu inventario. Abre sobres o añade cartas manualmente para empezar tu colección.</p>
                        <Button className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/30">
                            Ir a la Tienda
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="group relative flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors">

                                    {/* Imagen de la Carta */}
                                    <div className="relative aspect-[2.5/3.5] bg-zinc-900 flex items-center justify-center p-2">
                                        {item.card.image_url ? (
                                            <img
                                                src={item.card.image_url}
                                                alt={item.card.name}
                                                className="w-full h-full object-contain rounded drop-shadow-md"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                                                <span className="text-xs text-zinc-600 font-serif px-2">{item.card.name}</span>
                                            </div>
                                        )}

                                        {/* Overlay de Cantidad */}
                                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-zinc-700 text-zinc-100 text-xs font-bold px-2 py-1 rounded-sm shadow-lg">
                                            x{item.quantity}
                                        </div>

                                        {/* Overlay de Bloqueo (Si está en venta) */}
                                        {item.quantity_locked > 0 && (
                                            <div className="absolute top-2 left-2 bg-red-950/80 backdrop-blur-sm border border-red-900/50 text-red-400 text-xs px-1.5 py-1 rounded-sm shadow-lg" title={`${item.quantity_locked} en venta`}>
                                                <Lock className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadatos de la copia */}
                                    <div className="p-3 border-t border-zinc-800 flex flex-col gap-2 flex-1">
                                        <h3 className="text-sm font-semibold text-zinc-200 truncate" title={item.card.name}>
                                            {item.card.name}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                                            {/* Condición */}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getConditionColor(item.condition)}`}>
                                                {item.condition}
                                            </span>

                                            {/* Idioma */}
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-400 uppercase">
                                                {item.language}
                                            </span>

                                            {/* Foil */}
                                            {item.is_foil && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-0.5" title="Foil">
                                                    <Sparkles className="h-3 w-3" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Controles de Paginación */}
                        {lastPage > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-zinc-800">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-zinc-500 font-medium px-4">
                                    Página <span className="text-zinc-200">{currentPage}</span> de {lastPage}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                                    disabled={currentPage === lastPage}
                                    className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </TiendaMagicLayout>
    );
}
