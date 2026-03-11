import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import apiService from '@/services/ApiService';

// Importar componentes modulares
import PackCard from './PackCard';
import PacksPagination from './PacksPagination';
import PackDialog from './PackDialog';

interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  cover_image?: string;
  image_uri?: string;
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

interface PacksGridProps {
  packs: Pack[];
  currentPage: number;
  totalPages: number;
  totalPacks: number;
  onPageChange: (page: number) => void;
  onPackClick: (pack: Pack) => void;
  onBuyPack: (pack: Pack) => void;
}

function PacksGrid({
  packs, currentPage, totalPages, totalPacks, onPageChange, onPackClick, onBuyPack,
}: PacksGridProps) {
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePackClick = (pack: Pack) => {
    setSelectedPack(pack);
    setDialogOpen(true);
    onPackClick(pack);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleQuickBuy = async (pack: Pack) => {
    try {
      // Petición directa al API para compra rápida
      await apiService.axiosInstance.post('/api/cart', {
        booster_pack_id: pack.id,
        quantity: 1,
      });

      toast.success(`¡${pack.name} añadido al carrito!`);
    } catch (error) {
      console.error('Error en compra rápida:', error);
      toast.error('Error al añadir al carrito');
    }
  };

  if (packs.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-zinc-400 mb-2">
          No hay packs disponibles
        </h3>
        <p className="text-zinc-500">
          Vuelve más tarde para ver nuevos packs
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de packs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {packs.map((pack: Pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            onClick={handlePackClick}
            onBuyPack={handleQuickBuy}
          />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <PacksPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalPacks={totalPacks}
          onPageChange={onPageChange}
        />
      )}

      {/* Modal de detalle del pack */}
      <PackDialog
        pack={selectedPack}
        isOpen={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}

export default PacksGrid;
