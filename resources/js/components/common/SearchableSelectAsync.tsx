import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectAsyncProps {
  value: string | number;
  onChange: (value: string | number) => void;
  fetchOptions: (search: string, page: number) => Promise<{ data: Option[]; lastPage: number }>;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export default function SearchableSelectAsync({
  value, onChange, fetchOptions, placeholder = 'Buscar...', emptyText = 'Sin resultados', disabled = false,
}: SearchableSelectAsyncProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Carga opciones con debounce
  const load = useCallback(async (s: string, p: number) => {
    console.log('[SSA] Cargando opciones para:', { s, p });
    setLoading(true);
    try {
      const result = await fetchOptions(s, p);
      console.log('[SSA] Resultado recibido:', result);
      setOptions(result.data);
      setLastPage(result.lastPage);
    } catch (err) {
      console.error('[SSA] Error en fetchOptions:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fetchOptions]);

  // Debounce al escribir
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(search, 1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, open]);

  // Cambia página
  useEffect(() => {
    if (!open) return;
    load(search, page);
  }, [page]);

  // Posición del dropdown
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      setSearch('');
      setPage(1);
      load('', 1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  // Cierra al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const portal = document.getElementById('ssa-portal');
      if (
        containerRef.current?.contains(e.target as Node) ||
        portal?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt: Option) => {
    onChange(opt.value);
    setSelectedLabel(opt.label);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedLabel('');
  };

  const dropdown = open ? (
    <div
      id="ssa-portal"
      style={dropdownStyle}
      className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Buscador */}
      <div className="p-2 border-b border-border shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar carta..."
            className="w-full bg-background border border-border rounded-md pl-7 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Resultados */}
      <div className="overflow-y-auto" style={{ maxHeight: '180px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-primary" />
          </div>
        ) : options.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground uppercase tracking-widest font-black">
            {emptyText}
          </div>
        ) : (
          options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt)}
              className={cn(
                'w-full text-left px-3 py-2.5 text-sm transition-colors flex flex-col gap-0.5 hover:bg-accent',
                String(opt.value) === String(value) && 'bg-primary/10 text-primary',
              )}
            >
              <span className="font-medium truncate">{opt.label}</span>
              {opt.sublabel && (
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  {opt.sublabel}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Paginación */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0 bg-accent/20">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={12} />
            Anterior
          </button>
          <span className="text-[10px] font-black text-muted-foreground">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage || loading}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Siguiente
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          'w-full flex items-center justify-between gap-2 bg-background border border-border text-sm font-medium text-foreground p-3 rounded-lg transition-all text-left',
          open && 'ring-1 ring-primary border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className={cn('truncate flex-1', !value && 'text-muted-foreground')}>
          {value ? selectedLabel || placeholder : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span onClick={handleClear} className="cursor-pointer text-muted-foreground hover:text-foreground p-0.5 rounded">
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      {createPortal(dropdown, document.body)}
    </div>
  );
}