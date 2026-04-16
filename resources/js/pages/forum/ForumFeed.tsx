import React from 'react';
import { Post, Category, SortMode } from './types';
import { CAT_LABELS, SORT_LABELS } from './constants';
import PostCard from './PostCard';

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
  onDeleteSuccess
}: ForumFeedViewProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          {title ? title : (
            <>
              {activeSideNav === "guardados" ? "Guardados" : (activeCategory ? CAT_LABELS[activeCategory] : "Inicio")}
              <span className="text-[var(--accent)] mx-1">·</span> Magic Forum
            </>
          )}
        </h1>
        <div className="flex items-center gap-2">
           {selection?.isMod && (
             <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-[var(--surface-2)] rounded-md border border-[var(--border)]">
                <input 
                  type="checkbox" 
                  checked={selection.allSelected}
                  onChange={selection.selectAll}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Seleccionar todo</span>
             </div>
           )}
           <button onClick={onShowCreateView} className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] px-4.5 py-2 rounded-md text-[13px] font-bold cursor-pointer hover:bg-[var(--border)] transition-colors">
             + Nuevo post
           </button>
        </div>
      </div>

      {activeSideNav !== "guardados" && activeSideNav !== "search" && (
        <div className="flex gap-1 mb-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
          {(["hot", "nuevo", "top"] as SortMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onSortModeChange(mode)}
              className={`flex-1 py-1.5 px-3.5 rounded-md text-[13px] transition-all cursor-pointer ${sortMode === mode ? 'bg-[var(--surface-2)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              {SORT_LABELS[mode]}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-5 text-[var(--text-muted)]">Cargando datos...</div>
      ) : (
        posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onOpen={() => onOpenThread(post)} 
            onDeleteSuccess={onDeleteSuccess}
            selection={{
              isSelected: selection?.isSelected(post.id) || false,
              toggle: () => selection?.toggle(post.id),
              isMod: selection?.isMod || false
            }}
          />
        ))
      )}
    </>
  );
}
