import React from 'react';
import { Loader2, Flame, Sparkles, TrendingUp, Trash2, Scroll } from 'lucide-react';
import { Loader2, Trash2 } from 'lucide-react';
import { Post, Category, SortMode } from './types';
import { CAT_LABELS, SORT_LABELS } from './constants';
import PostCard from './PostCard';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
<<<<<<< HEAD
import { cn } from '@/lib/utils';
=======
>>>>>>> c1e07f97bb49f0d13d93b78d21a94c947765d74b

interface ForumFeedViewProps {
  posts: Post[];
  isLoading: boolean;
  activeSideNav: string;
  activeCategory: Category | null;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  onOpenThread: (post: Post) => void;
  onShowCreateView: () => void;
  title?: string;
  selection?: {
    isSelected: (id: number) => boolean;
    toggle: (id: number) => void;
    allSelected: boolean;
    selectAll: () => void;
    someSelected: boolean;
    isMod: boolean;
  };
  onDeleteSuccess?: () => void;
  pagination: any;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage: number;
  onPerPageChange: (val: number) => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

export default function ForumFeedView({
  posts,
  isLoading,
  activeSideNav,
  activeCategory,
  sortMode,
  onSortModeChange,
  onOpenThread,
  onShowCreateView,
  title,
  selection,
  onDeleteSuccess,
  pagination,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  selectedCount,
  onClearSelection,
  onBulkDelete,
}: ForumFeedViewProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">
          {title || (
            <>
              {activeSideNav === 'guardados' ? 'Guardados' : (activeCategory ? CAT_LABELS[activeCategory] : 'Inicio')}
              <span className="text-primary mx-1">·</span>
{' '}
Magic Forum
</>
          )}
        </h1>
        <div className="flex items-center gap-2">
           {selection?.isMod && (
             <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-accent rounded-md border border-border">
                <input
                  type="checkbox"
                  checked={selection.allSelected}
                  onChange={selection.selectAll}
                  className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Seleccionar todo</span>
             </div>
           )}
           <button onClick={onShowCreateView} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4.5 py-2 rounded-md text-[13px] font-bold cursor-pointer transition-all active:scale-95 shadow-lg shadow-primary/20">
             + Nuevo post
           </button>
        </div>
      </div>

      {activeSideNav !== 'guardados' && activeSideNav !== 'search' && (
        <div className="flex gap-1 mb-3.5 bg-card border border-border rounded-lg p-1">
          {(['hot', 'nuevo', 'top'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onSortModeChange(mode)}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3.5 rounded-md text-[13px] transition-all cursor-pointer font-bold ${sortMode === mode ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {mode === 'hot' && <Flame size={14} className={cn(sortMode === 'hot' ? "text-primary" : "opacity-40")} />}
              {mode === 'nuevo' && <Sparkles size={14} className={cn(sortMode === 'nuevo' ? "text-primary" : "opacity-40")} />}
              {mode === 'top' && <TrendingUp size={14} className={cn(sortMode === 'top' ? "text-primary" : "opacity-40")} />}
              {SORT_LABELS[mode]}
            </button>
          ))}
        </div>
      )}

      {/* Per Page Selector - Under filters */}
      <div className="flex items-center justify-end mb-4 gap-2">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Posts por página:</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] font-semibold rounded-md px-2 py-1 outline-none hover:border-[var(--accent)] transition-colors cursor-pointer"
        >
          <option value={10}>10 hilos</option>
          <option value={20}>20 hilos</option>
          <option value={50}>50 hilos</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center p-20 text-muted-foreground flex flex-col items-center gap-4 bg-card/10 border border-border border-dashed rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-medium">Cargando hilos del foro...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="p-20 text-center opacity-40 flex flex-col items-center">
              <Scroll className="w-12 h-12 mb-4 text-muted-foreground/30" />
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] font-montserrat">El silencio reina aquí...</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpen={() => onOpenThread(post)}
                onDeleteSuccess={onDeleteSuccess}
                selection={{
                  isSelected: selection?.isSelected(post.id) || false,
                  toggle: () => selection?.toggle(post.id),
                  isMod: selection?.isMod || false,
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex flex-col items-center gap-4 mt-8 pb-8">
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              &larr; Anterior
            </button>

            <div className="flex items-center gap-1 mx-2">
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);

                if (endPage - startPage < maxVisible - 1) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => onPageChange(i)}
                      className={`w-8 h-8 rounded-md text-xs font-bold transition-all border cursor-pointer ${currentPage === i ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'}`}
                    >
                      {i}
                    </button>,
                  );
                }
                return pages;
              })()}
            </div>

            <button
              disabled={currentPage === pagination.last_page}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Siguiente &rarr;
            </button>
          </div>

          <div className="text-[10px] text-[var(--text-muted)] font-medium text-center">
            Mostrando hilos
{' '}
{pagination.from || 0}
{' '}
-
{' '}
{pagination.to || 0}
{' '}
de un total de
{' '}
{pagination.total || 0}
          </div>
        </div>
      )}

      <BulkActionsToolbar
        count={selectedCount}
        onClear={onClearSelection}
        actions={[
          {
            label: 'Eliminar Selección',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: onBulkDelete,
            variant: 'destructive',
            className: 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20',
          },
        ]}
      />
    </>
  );
}
