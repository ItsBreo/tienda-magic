import React from 'react';
import { Loader2 } from 'lucide-react';
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
        <h1 className="text-xl font-bold text-foreground">
          {title ? title : (
            <>
              {activeSideNav === "guardados" ? "Guardados" : (activeCategory ? CAT_LABELS[activeCategory] : "Inicio")}
              <span className="text-primary mx-1">·</span> Magic Forum
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

      {activeSideNav !== "guardados" && activeSideNav !== "search" && (
        <div className="flex gap-1 mb-3.5 bg-card border border-border rounded-lg p-1">
          {(["hot", "nuevo", "top"] as SortMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onSortModeChange(mode)}
              className={`flex-1 py-1.5 px-3.5 rounded-md text-[13px] transition-all cursor-pointer font-bold ${sortMode === mode ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {SORT_LABELS[mode]}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-20 text-muted-foreground flex flex-col items-center gap-4 bg-card/10 border border-border border-dashed rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-medium">Cargando hilos del foro...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-center p-20 text-muted-foreground bg-card/10 border border-border border-dashed rounded-xl">
              No se han encontrado hilos.
            </div>
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
        </div>
      )}
    </>
  );
}
