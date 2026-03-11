import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PacksPaginationProps {
  currentPage: number;
  totalPages: number;
  totalPacks: number;
  onPageChange: (page: number) => void;
}

export default function PacksPagination({
  currentPage,
  totalPages,
  totalPacks,
  onPageChange,
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
        className="p-3 rounded-full bg-zinc-800 text-zinc-200 hover:bg-emerald-600 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Texto de información */}
      <div className="text-zinc-400 font-medium bg-zinc-900/50 px-6 py-2 rounded-full border border-zinc-800/50">
        Página <span className="text-emerald-400 font-bold mx-1">{current}</span> de <span className="text-zinc-100 mx-1">{total}</span>
        <span className="text-zinc-500 text-sm ml-2">({totalPacks} sobres)</span>
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
        className="p-3 rounded-full bg-zinc-800 text-zinc-200 hover:bg-emerald-600 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
