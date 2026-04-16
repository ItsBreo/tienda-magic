import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PacksPaginationProps {
  currentPage: number;
  totalPages: number;
  totalPacks: number;
  onPageChange: (page: number) => void;
  category?: 'packs' | 'cards';
}

export default function PacksPagination({
  currentPage,
  totalPages,
  totalPacks,
  onPageChange,
  category = 'packs',
}: PacksPaginationProps) {
  // Seguridad de tipos: forzar casteo a números
  const current = Number(currentPage);
  const total = Number(totalPages);

  // Ocultar si no hay páginas suficientes
  if (total <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-6 w-full mt-12 pb-8">
      {/* Botón Anterior */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onPageChange(current - 1);
        }}
        disabled={current <= 1}
        aria-disabled={current <= 1}
        aria-label="Ir a la página anterior"
        className="p-3 rounded-full bg-card text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-card disabled:cursor-not-allowed transition-all shadow-lg border border-border"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Texto de información */}
      <div className="text-muted-foreground font-medium bg-accent/30 px-6 py-2 rounded-full border border-border shadow-sm">
        Página
        <span className="text-primary font-bold mx-1">{current}</span>
        de
        <span className="text-foreground mx-1">{total}</span>
        <span className="text-muted-foreground/70 text-sm ml-2">
          ({totalPacks} {category === 'cards' ? 'cartas' : 'sobres'})
        </span>
      </div>

      {/* Botón Siguiente */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onPageChange(current + 1);
        }}
        disabled={current >= total}
        aria-disabled={current >= total}
        aria-label="Ir a la página siguiente"
        className="p-3 rounded-full bg-card text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-card disabled:cursor-not-allowed transition-all shadow-lg border border-border"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
