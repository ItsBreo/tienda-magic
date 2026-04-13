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
}: ForumFeedViewProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          {activeSideNav === "guardados" ? "Guardados" : (activeCategory ? CAT_LABELS[activeCategory] : "Inicio")}
          <span className="text-[var(--accent)] mx-1">·</span> Magic Forum
        </h1>
        <button onClick={onShowCreateView} className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] px-4.5 py-2 rounded-md text-[13px] font-bold cursor-pointer hover:bg-[var(--border)] transition-colors">
          + Nuevo post
        </button>
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
        posts.map(post => <PostCard key={post.id} post={post} onOpen={() => onOpenThread(post)} />)
      )}
    </>
  );
}
