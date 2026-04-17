import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";
import { Category, SortMode, View, Post, Comment, Tournament } from "./types";
import { RULES, CAT_LABELS } from "./constants";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MessageSquare, Flame, Trash2 } from "lucide-react";
import TournamentModal from "./TournamentModal";
import TournamentDetailModal from "./TournamentDetailModal";
import ForumFeedView from "./ForumFeed";
import ThreadDetailView from "./ThreadDetail";
import CreatePostView from "./CreatePost";
import { useSelection } from "@/hooks/useSelection";
import BulkActionsToolbar from "@/components/admin/BulkActionsToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Convierte fecha ISO a formato legible */
function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

function NavItem({ active, icon, label, badge, onClick }: { active: boolean; icon: string; label: string; badge?: number; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 py-2.5 px-4 cursor-pointer transition-all duration-200 border-l-4 font-montserrat
        ${active
          ? 'text-primary font-black bg-primary/5 border-primary shadow-sm shadow-primary/5 scale-[1.02]'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
        }`}
    >
      <span className="text-[16px] filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100">{icon}</span>
      <span className="text-[12.5px] uppercase tracking-widest leading-none font-black">{label}</span>
      {badge && (
        <span className="ml-auto bg-primary text-primary-foreground text-[9px] font-black py-0.5 px-2 rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </div>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/5">
      <div className="py-2.5 px-4 bg-accent/40 border-b border-border text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest font-montserrat">
        {title}
      </div>
      {children}
    </div>
  );
}

const mapThreadToPost = (t: any): Post => ({
  id: t.id,
  forum_id: t.forum_id,
  title: t.title,
  preview: t.body,
  author: t.user?.username || t.user?.name || t.author?.name || "Desconocido",
  author_id: t.user?.id || t.author?.id || 0,
  reputation: t.user?.reputation || t.author?.reputation || 100,
  category: t.forum?.slug as Category,
  score: t.score || 0,
  userVote: t.user_vote || 0,
  isSaved: t.is_saved || false,
  comments: t.comments_count || 0,
  timeAgo: formatDate(t.created_at),
  image_url: t.image_url,
  tags: (() => { 
    if (Array.isArray(t.tags)) return t.tags;
    try { return JSON.parse(t.tags || "[]"); } catch { return []; }
  })(),
  can_delete: t.can_delete,
  can_edit: t.can_edit,
});

export default function MagicForum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>("feed"); 
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [activeSideNav, setActiveSideNav] = useState("inicio");
  const [posts, setPosts] = useState<Post[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [paginationData, setPaginationData] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [isHiding, setIsHiding] = useState(false);

  const [forumsList, setForumsList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

  const {
    selectedList,
    selectedCount,
    toggle,
    selectAll,
    clear,
    isSelected,
    allSelected,
    someSelected
  } = useSelection(posts);

  const isModOrAdmin = user?.is_admin || (user as any)?.all_permissions?.includes('moderate-forum');

  const handleSetView = (newView: View) => {
    if (view === newView) return;
    setIsHiding(true); 
    setTimeout(() => {
      setView(newView);
      setIsHiding(false); 
    }, 200); 
  };

  useEffect(() => {
    ApiService.getForums()
      .then(res => setForumsList(res.data || []))
      .catch(err => console.error("Error al cargar la lista de foros:", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, sortMode, activeSideNav, searchParams, perPage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch.length >= 3) {
        setIsSearching(true);
        setIsSearchOpen(true);
        ApiService.axiosInstance.get(`/api/forum/search`, { params: { q: trimmedSearch } })
          .then(res => {
            const threads = res.data.data || res.data || [];
            setSearchResults(threads.map(mapThreadToPost).slice(0, 5));
          })
          .catch(err => console.error("Error en búsqueda dinámica:", err))
          .finally(() => setIsSearching(false));
      } else {
        setSearchResults([]);
        setIsSearchOpen(false);
        if (!trimmedSearch && searchParams.get('q')) {
            navigate('/forum');
        }
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, searchParams, navigate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    setIsLoading(true);

    let fetcher;

    if (searchQuery && searchQuery.length >= 3) {
      if (view !== 'feed') handleSetView('feed');
      if (activeCategory !== null) setActiveCategory(null);
      if (activeSideNav !== 'search') setActiveSideNav('search');
      fetcher = ApiService.axiosInstance.get(`/api/forum/search`, { params: { q: searchQuery, page: currentPage, per_page: perPage } });
    } else {
      fetcher = activeSideNav === "guardados"
        ? ApiService.getSavedThreads(currentPage, perPage)
        : (activeCategory
            ? ApiService.getForumThreads(activeCategory, sortMode, currentPage, perPage)
            : ApiService.getThreads(sortMode, currentPage, perPage));
    }

    fetcher
      .then(res => {
        const threads = res.data || [];
        const mappedPosts = threads.map(mapThreadToPost);
        setPosts(mappedPosts);
        setPaginationData(res.meta || null);
      })
      .catch(err => {
        console.error("Error al cargar los hilos:", err);
        setPosts([]);
        setPaginationData(null);
      })
      .finally(() => setIsLoading(false));

    ApiService.getTournaments()
      .then(res => setTournaments(res.data?.data || res.data || []))
      .catch(err => console.error("Error al cargar los torneos:", err));

  }, [activeCategory, sortMode, refreshKey, activeSideNav, searchParams, currentPage, perPage]);

  const openThread = (post: Post) => {
    setActivePost(post);
    handleSetView("thread");
    setComments([]);
    ApiService.getThread(post.id).then(res => {
      const mapped = (res.data?.comments || []).map((c: any) => ({
        id: c.id, 
        author: c.user?.username || c.user?.name || c.author?.name || "Desconocido", 
        author_id: c.user?.id || c.author?.id || 0,
        reputation: c.user?.reputation || c.author?.reputation || 100,
        avatarColor: "hsl(var(--primary))",
        initials: (c.user?.username || c.user?.name || c.author?.name || "US").substring(0, 2).toUpperCase(),
        timeAgo: formatDate(c.created_at), 
        score: c.score, 
        userVote: c.user_vote || 0, 
        body: c.body,
        can_delete: c.can_delete,
        can_edit: c.can_edit,
        replies: (c.replies || []).map((r: any) => ({
          id: r.id, 
          author: r.user?.username || r.user?.name || r.author?.name || "Desconocido", 
          author_id: r.user?.id || r.author?.id || 0,
          reputation: r.user?.reputation || r.author?.reputation || 100,
          avatarColor: "hsl(var(--secondary))",
          initials: (r.user?.username || r.user?.name || r.author?.name || "US").substring(0, 2).toUpperCase(),
          timeAgo: formatDate(r.created_at), 
          score: r.score, 
          body: r.body,
          can_delete: r.can_delete,
          can_edit: r.can_edit,
        })),
      }));
      setComments(mapped);
    })
    .catch(err => console.error(`Error al cargar el hilo ${post.id}:`, err));
  };

  const handleCreatePost = (data: { forum_id: number; title: string; body: string; tags?: string[]; image?: File }) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('forum_id', data.forum_id.toString());
    formData.append('title', data.title);
    formData.append('body', data.body);
    if (data.tags) {
      data.tags.forEach(tag => formData.append('tags[]', tag));
    }
    if (data.image) {
      formData.append('image', data.image);
    }

    ApiService.createThread(formData)
    .then(() => {
        handleSetView("feed");
        setActiveSideNav("reciente");
        setActiveCategory(null);
        setSortMode("nuevo");
        setRefreshKey(k => k + 1);
    })
    .catch(err => {
        console.error("Error creando el post:", err.response?.data || err.message);
        toast.error("Hubo un error al publicar el post.");
    })
    .finally(() => setIsSubmitting(false));
  };

  const handleCreateComment = (body: string, parentId?: number) => {
    if (!activePost) return;
    setIsSubmittingComment(true);
    ApiService.createComment(activePost.id, { body, parent_id: parentId })
    .then(() => {
        openThread(activePost);
    })
    .catch(err => {
        console.error("Error creando el comentario:", err.response?.data || err.message);
        toast.error("Hubo un error al publicar el comentario.");
    })
    .finally(() => setIsSubmittingComment(false));
  };

  const handleBulkDeleteThreads = async () => {
    if (selectedCount === 0) return;
    if (!window.confirm(`¿Seguro que deseas eliminar ${selectedCount} hilos del foro?`)) return;

    try {
      if (isModOrAdmin) {
        const { data } = await ApiService.axiosInstance.post('/api/mod/threads/bulk-delete', { ids: selectedList });
        toast.success(data.message);
      } else {
        const ownIds = selectedList.filter(id => {
          const p = posts.find(post => post.id === Number(id));
          return p && p.can_delete;
        });

        if (ownIds.length === 0) {
          toast.error("No tienes permisos para borrar los hilos seleccionados");
          return;
        }

        toast.info(`Borrando ${ownIds.length} hilos...`);
        for (const id of ownIds) {
          await ApiService.deleteThread(Number(id));
        }
        toast.success("Hilos eliminados correctamente");
      }
      
      clear();
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error("Error bulk delete:", error);
      toast.error('Error al realizar el borrado de hilos');
    }
  };

  const renderContent = () => {
    const searchQuery = searchParams.get('q');
    if (view === 'create') {
      return <CreatePostView forumsList={forumsList} isSubmitting={isSubmitting} onCancel={() => handleSetView('feed')} onSubmit={handleCreatePost} />;
    }
    if (view === 'thread' && activePost) {
      return (
        <ThreadDetailView 
          post={activePost} 
          comments={comments} 
          isSubmitting={isSubmittingComment} 
          onBack={() => {
            handleSetView('feed');
            setRefreshKey(k => k + 1);
          }} 
          onCommentSubmit={handleCreateComment} 
        />
      );
    }

    const isSearch = !!searchQuery;
    const feedTitle = isSearch ? `Resultados para: "${searchQuery}"` : undefined;

    return (
      <ForumFeedView 
        posts={posts} 
        isLoading={isLoading} 
        activeSideNav={isSearch ? 'search' : activeSideNav} 
        title={feedTitle} 
        activeCategory={isSearch ? null : activeCategory} 
        sortMode={sortMode} 
        onSortModeChange={setSortMode} 
        onOpenThread={openThread} 
        onShowCreateView={() => handleSetView('create')}
        selection={{
          isSelected,
          toggle,
          allSelected,
          selectAll,
          someSelected,
          isMod: isModOrAdmin
        }}
        onDeleteSuccess={() => setRefreshKey(k => k + 1)}
        pagination={paginationData}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        perPage={perPage}
        onPerPageChange={setPerPage}
        selectedCount={selectedCount}
        onClearSelection={clear}
        onBulkDelete={handleBulkDeleteThreads}
      />
    );
  };

  return (
    <div className="flex bg-background min-h-screen font-literata">
      <div className="flex-1 max-w-[1440px] mx-auto grid grid-cols-[240px_1fr_280px] h-full shadow-2xl">

        <aside className="bg-card border-r border-border flex flex-col sticky top-0 h-screen">
          <div className="p-6 flex items-center gap-3 border-b border-border/50 mb-4">
             <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <span className="text-primary font-black font-forum text-xl">M</span>
             </div>
             <div className="text-sm font-black uppercase tracking-[0.2em] font-montserrat text-foreground">
                the<span className="text-primary">Gathering</span>
             </div>
          </div>

          <div className="px-4 mb-8 relative z-20" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Buscar hilos..."
                className="pl-9 h-11 bg-accent border-border/50 focus-visible:ring-primary rounded-xl text-xs font-montserrat uppercase tracking-wider"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { if (searchTerm.trim().length >= 3) setIsSearchOpen(true); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim().length >= 3) {
                    setIsSearchOpen(false);
                    navigate(`/forum?q=${encodeURIComponent(searchTerm.trim())}`);
                  }
                }}
              />
            </div>

            {isSearchOpen && (
              <div className="absolute top-[calc(100%+8px)] left-4 right-4 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]">
                <div className="px-4 py-3 bg-accent/40 border-b border-border text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex justify-between items-center">
                  <span>Resultados Rápidos</span>
                  {isSearching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {!isSearching && searchResults.length === 0 && (
                    <div className="px-4 py-10 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest opacity-30">
                       No se encontraron hilos
                    </div>
                  )}
                  {searchResults.map((post, idx) => (
                    <div
                      key={post.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        openThread(post);
                      }}
                      className="p-4 cursor-pointer hover:bg-primary/5 transition-colors border-b border-border last:border-0 group"
                    >
                      <div className="text-xs font-black font-forum text-foreground line-clamp-2 leading-tight mb-2 group-hover:text-primary">{post.title}</div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-montserrat uppercase font-black tracking-widest">
                        <span className="truncate">@{post.author}</span>
                        <div className="flex items-center gap-1 shrink-0 text-amber-500">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>{post.score}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <MessageSquare className="w-3 h-3" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
              <div className="px-6 py-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] font-montserrat">Canales</div>
              <NavItem
                active={activeSideNav === "reciente"}
                icon="🔥"
                label="Inicio"
                onClick={() => {
                  navigate('/forum');
                  setActiveCategory(null);
                  handleSetView("feed");
                  setActiveSideNav("reciente");
                }}
              />
              <NavItem
                active={activeSideNav === "guardados"}
                icon="🔖"
                label="Marcadores"
                onClick={() => {
                  navigate('/forum');
                  setActiveCategory(null);
                  handleSetView("feed");
                  setActiveSideNav("guardados");
                }}
              />

              <div className="px-6 py-2 pt-6 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] font-montserrat">Categorías</div>
              {(["noticias", "estrategia", "general", "torneos"] as Category[]).map(cat => (
                <NavItem
                  key={cat}
                  active={activeCategory === cat}
                  icon={cat === "noticias" ? "📰" : cat === "estrategia" ? "⚔️" : cat === "torneos" ? "🏆" : "💬"}
                  label={CAT_LABELS[cat]}
                  badge={cat === "torneos" ? 2 : undefined}
                  onClick={() => {
                    navigate('/forum');
                    setActiveCategory(cat);
                    handleSetView("feed");
                    setActiveSideNav(cat);
                  }}
                />
              ))}
          </div>

          <div className="mt-auto p-6 border-t border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border/30 cursor-pointer hover:border-primary/30 transition-all group">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] font-black text-primary shadow-sm">
                {user?.name?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-widest text-foreground truncate">{user?.username || user?.name || "Usuario"}</div>
                <div className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-0.5 opacity-80">
                  {user?.wallet_balance ? `${user.wallet_balance} oro` : "0 oro"}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="p-6 overflow-y-auto relative bg-background">
          <div className={`transition-opacity duration-200 ${isHiding ? 'opacity-0' : 'opacity-100'}`}>
            {renderContent()}
          </div>

          <BulkActionsToolbar 
            count={selectedCount}
            onClear={clear}
            actions={[
              {
                label: 'Eliminar en Lote',
                icon: <Trash2 className="w-4 h-4" />,
                onClick: handleBulkDeleteThreads,
                variant: 'destructive',
                className: 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border border-destructive/20'
              }
            ]}
          />
        </main>

        <aside className="p-6 flex flex-col gap-6 sticky top-0 h-screen border-l border-border/50 bg-background/50 backdrop-blur-sm">
          <Widget title="Grandes Torneos">
            <div className="px-4 py-2 space-y-1">
              {tournaments.length === 0 ? (
                 <div className="py-6 text-[10px] text-muted-foreground font-black uppercase tracking-widest text-center opacity-30 italic">No hay torneos activos.</div>
              ) : tournaments.map((t, i) => (
                <div key={t.id} className="py-3 border-b border-border/30 last:border-0 group">
                   <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-1.5 h-4",
                            t.status === 'live' ? "bg-primary/5 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border/50"
                        )}>
                            {t.status === 'live' ? "● Live" : "Draft"}
                        </Badge>
                        <span className="text-[10px] font-black text-muted-foreground/50 font-montserrat tracking-tighter">{formatDate(t.date).split(',')[0]}</span>
                   </div>
                  <div onClick={() => setSelectedTournamentId(t.id)} className="text-sm font-black font-forum text-foreground hover:text-primary transition-colors cursor-pointer truncate leading-tight group-hover:translate-x-1 transition-transform">
                    {t.name}
                  </div>
                </div>
              ))}
            </div>
            
            {user && (
              <div className="p-4 pt-0">
                  <Button onClick={() => setShowTournamentModal(true)} className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] shadow-none">
                    + FORJAR TORNEO
                  </Button>
              </div>
            )}
          </Widget>

          <Widget title="Leyes de la Mesa">
            <div className="px-4 py-2">
              {RULES.map((rule, i) => (
                <div key={rule} className="py-4 flex gap-4 border-b border-border/30 last:border-0">
                  <span className="text-xl font-forum font-black text-primary/20 flex-shrink-0">0{i + 1}</span>
                  <p className="text-[11.5px] text-muted-foreground font-literata leading-relaxed italic line-clamp-3">{rule}</p>
                </div>
              ))}
            </div>
          </Widget>

          <div className="mt-auto opacity-10 flex justify-center pb-4">
             <div className="text-[8px] font-black uppercase tracking-[1em] text-muted-foreground whitespace-nowrap">Origin v2.0</div>
          </div>
        </aside>
      </div>

      {showTournamentModal && <TournamentModal onClose={() => setShowTournamentModal(false)} onSuccess={() => { setShowTournamentModal(false); setRefreshKey(k => k + 1); }} />}
      {selectedTournamentId && <TournamentDetailModal tournamentId={selectedTournamentId} onClose={() => setSelectedTournamentId(null)} />}
    </div>
  );
}
