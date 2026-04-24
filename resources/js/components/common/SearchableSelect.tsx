import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options?: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options = [], value, onChange, placeholder = 'Buscar...', emptyText = 'Sin resultados', disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus al input al abrir
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSelect = (opt: Option) => {
    onChange(opt.value);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between gap-2 bg-background border border-border text-sm font-medium text-foreground p-3 rounded-lg transition-all text-left',
          open && 'ring-1 ring-primary border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className={cn('truncate flex-1', !selected && 'text-muted-foreground')}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={handleClear}
              className="cursor-pointer text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn('text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-background border border-border rounded-md pl-7 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground uppercase tracking-widest font-black">
                {emptyText}
              </div>
            ) : (
              filtered.map((opt) => (
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
        </div>
      )}
    </div>
  );
}