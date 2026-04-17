import React from 'react';

// Importar componentes modulares
import PackCard from './PackCard';
import PacksPagination from './PacksPagination';

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
  onBuyPack: (pack: Pack, quantity: number) => void;
  category?: 'packs' | 'cards';
  searchTerm?: string;
}

function PacksGrid({
  packs, currentPage, totalPages, totalPacks, onPageChange, onPackClick, onBuyPack, category = 'packs', searchTerm = '',
}: PacksGridProps) {
  return (
    <>
      {/* Grid de items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
        {packs.map((pack: Pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            onClick={() => onPackClick(pack)}
            onBuyPack={(item, quantity) => onBuyPack(item, quantity)}
            searchTerm={searchTerm}
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
          category={category}
        />
      )}
    </>
  );
}

export default PacksGrid;
