import { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, Package, Sparkles, Zap,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PackData {
  id: number;
  name: string;
  price: number;
  type: string;
  card_set?: {
    name: string;
  };
}

interface PageProps {
  packs: {
    data: PackData[];
    links: any[];
  };
  sets: { id: number; name: string }[];
  types: string[];
  filters: {
    search?: string;
    type?: string;
    sort?: string;
  };
}

export default function Catalog({
  packs,
  types,
  filters,
}: PageProps) {
  // Verificación segura de strings
  const initialSort = (typeof filters?.sort === 'string') ? filters.sort : 'newest';

  const [search, setSearch] = useState(filters?.search || '');
  const [selectedType, setSelectedType] = useState(filters?.type || 'all');
  const [sort, setSort] = useState(initialSort);

  const handleSearch = () => {
    router.get(
      route('shop.index'),
      {
        search,
        type: selectedType !== 'all' ? selectedType : undefined,
        sort,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      },
    );
  };

  const handleAddToCart = (packId: number) => {
    router.post(
      route('cart.add'),
      { pack_id: packId, quantity: 1 },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          // Opcional: mostrar notificación de éxito
        },
        onError: (errors) => {
          console.error('Error al añadir al carrito:', errors);
        },
      },
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters?.search || '')) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const currentSort = typeof filters?.sort === 'string' ? filters.sort : 'newest';
    if (
      (selectedType !== 'all' && selectedType !== filters?.type)
          || sort !== currentSort
    ) {
      handleSearch();
    }
  }, [selectedType, sort]);

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Tienda de Sobres', href: route('shop.index') },
      ]}
    >
      <Head title="Tienda Magic" />

      {/* --- FONDO PRINCIPAL SENTINEL --- */}
      <div className="min-h-screen bg-black text-zinc-100 p-6 space-y-8">
        {/* --- CABECERA DE SECCIÓN --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Mercado de Sobres
            </h2>
            <p className="text-zinc-500 mt-1">
              Explora las últimas ediciones y colecciones premium.
            </p>
          </div>
          {packs.data && (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              {packs.data.length}
              {' '}
              Productos Disponibles
            </Badge>
          )}
        </div>

        {/* --- BARRA DE HERRAMIENTAS (Filtros) --- */}
        <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm">
          {/* Buscador */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
            <Input
              placeholder="Buscar sobre (ej. Kamigawa)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-emerald-500 focus:ring-emerald-500/20 placeholder:text-zinc-600"
            />
          </div>

          {/* Selectores */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectItem value="all">
                  Todos los Tipos
                </SelectItem>
                {types.map((t) => (
                  <SelectItem
                    key={t}
                    value={t}
                    className="focus:bg-zinc-800 focus:text-emerald-400 cursor-pointer"
                  >
                    {t.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectItem
                  value="newest"
                  className="focus:bg-zinc-800 focus:text-emerald-400 cursor-pointer"
                >
                  Más Nuevos
                </SelectItem>
                <SelectItem
                  value="price_asc"
                  className="focus:bg-zinc-800 focus:text-emerald-400 cursor-pointer"
                >
                  Precio: Bajo a Alto
                </SelectItem>
                <SelectItem
                  value="price_desc"
                  className="focus:bg-zinc-800 focus:text-emerald-400 cursor-pointer"
                >
                  Precio: Alto a Bajo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- GRID DE PRODUCTOS --- */}
        {packs.data && packs.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {packs.data.map((pack) => (
              <Card
                key={pack.id}
                className="overflow-hidden bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-900/10 transition-all duration-300 group flex flex-col"
              >
                {/* Imagen del Sobre */}
                <div className="aspect-[3/4] relative bg-gradient-to-br from-zinc-950 to-zinc-900 p-6 flex flex-col items-center justify-center border-b border-zinc-800 group-hover:from-zinc-900/80 group-hover:to-zinc-950 transition-colors">
                  {/* Efecto de brillo si es Collector */}
                  {pack.type === 'collector' && (
                    <div className="absolute top-0 right-0 p-2">
                      <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                    </div>
                  )}

                  <Package
                    className={`h-16 w-16 mb-4 transition-transform duration-300 group-hover:scale-110 ${
                      pack.type === 'collector'
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                        : 'text-zinc-500'
                    }`}
                  />

                  <h3 className="text-center font-serif text-zinc-300 text-sm leading-tight px-2">
                    {pack.card_set?.name || 'Set Desconocido'}
                  </h3>

                  {/* Badge Tipo */}
                  <Badge
                    className={`mt-3 border-0 uppercase text-[10px] tracking-wider ${
                      pack.type === 'collector'
                        ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {pack.type}
                  </Badge>
                </div>

                <CardHeader className="p-4 pb-2 flex-1">
                  <CardTitle
                    className="text-base font-bold text-zinc-100 line-clamp-2"
                    title={pack.name}
                  >
                    {pack.name}
                  </CardTitle>
                </CardHeader>

                <CardFooter className="p-4 pt-0 flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500">
                      Precio
                    </span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">
                      {pack.price.toFixed(2)}
                      {' '}
                      €
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(pack.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-900/20 border border-emerald-500/50 transition-all duration-200 hover:scale-105"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Comprar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          /* ESTADO VACÍO SENTINEL */
          <div className="text-center py-24 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            <Package className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="text-xl font-medium text-zinc-200">
              El inventario está vacío
            </h3>
            <p className="text-zinc-500 mt-2">
              No encontramos sobres que coincidan con tu búsqueda.
            </p>
            <Button
              variant="link"
              className="mt-4 text-emerald-500 hover:text-emerald-400"
              onClick={() => {
                setSearch('');
                setSelectedType('all');
                setSort('newest');
              }}
            >
              Limpiar todos los filtros
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
