import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import apiService from '@/services/ApiService';

// Importar componentes modulares
import PacksHeader from '@/components/packs/PacksHeader';
import PacksGrid from '@/components/packs/PacksGrid';

// Interfaces
interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  image_url?: string;
  config: {
    commons?: number;
    uncommons?: number;
    rares?: number;
    mythics?: number;
    foil?: boolean;
    total_cards?: number;
    description?: string;
  };
}

export default function PacksView() {
  // Estados principales
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar packs desde API real
  useEffect(() => {
    const loadPacks = async () => {
      try {
        setLoading(true);
        const packsData = await apiService.getPacks();
        setPacks(packsData || []);
      } catch (error) {
        toast.error('Error al cargar los packs disponibles');
      } finally {
        setLoading(false);
      }
    };

    loadPacks();
  }, []);

  // Filtrar y ordenar packs con useMemo
  const filteredPacks = useMemo(() => {
    let filtered = packs;

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = packs.filter(
        (pack) =>
          pack.name.toLowerCase().includes(searchLower)
          || pack.type.toLowerCase().includes(searchLower)
          || pack.card_set_id.toLowerCase().includes(searchLower),
      );
    }

    // Aplicar ordenación
    switch (sortBy) {
      case 'price-low-high':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered = [...filtered].sort((a, b) => b.id - a.id);
        break;
    }

    return filtered;
  }, [packs, searchTerm, sortBy]);

  // Manejar compra de pack
  const handleBuyPack = (pack: Pack) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve('Pack comprado');
        }, 1500);
      }),
      {
        loading: 'Procesando compra...',
        success: `¡Has comprado ${pack.name}!`,
        error: 'Error al procesar la compra',
      },
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background gradient consistente */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

      {/* Header */}
      <PacksHeader />

      {/* Toolbar de Filtros */}
      <div className="bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Buscador */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar packs por nombre o set..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Ordenación */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-sm mr-2">Ordenar por:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2 pr-8 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                >
                  <option value="newest">Novedades</option>
                  <option value="price-low-high">Precio: Menor a Mayor</option>
                  <option value="price-high-low">Precio: Mayor a Menor</option>
                  <option value="name-az">Nombre: A-Z</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de búsqueda */}
      {searchTerm && (
        <div className="text-center px-4">
          <p className="text-sm text-zinc-500 mt-2">
            Se encontraron {filteredPacks.length} packs para "{searchTerm}"
          </p>
        </div>
      )}

      {/* Grid de Packs con paginación integrada */}
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
        <PacksGrid
          packs={filteredPacks}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onPackClick={() => {}} // Implementar si es necesario
          onBuyPack={handleBuyPack}
        />
      </div>
    </div>
  );
}
