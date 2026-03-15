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
  return (
    <>
      {/* Grid de items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {packs.map((pack: Pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            onClick={() => onPackClick(pack)}
            onBuyPack={() => onBuyPack(pack)}
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
    </>
  );
}

export default PacksGrid;
