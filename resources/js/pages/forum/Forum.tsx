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
      className={`flex items-center gap-2.5 py-2 px-4.5 cursor-pointer transition-all duration-150 border-l-3
        ${active
          ? 'text-primary font-bold bg-accent border-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
        }`}
    >
      <span className="text-[15px]">{icon}</span>
      <span className="text-[13px]">{label}</span>
      {badge && (
        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold py-0.5 px-1.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="py-2.5 px-3.5 bg-accent border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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

  // Reiniciar a página 1 cuando cambia el contexto (categoría, orden, navegación, búsqueda) o cantidad por página
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, sortMode, activeSideNav, searchParams, perPage]);

  // Efecto para la búsqueda dinámica (con debounce en el popover)
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
        // En Laravel Resources con paginación, la data está en res.data y el meta en res.meta
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
        // Modo Moderador: Borrado masivo por API
        const { data } = await ApiService.axiosInstance.post('/api/mod/threads/bulk-delete', { ids: selectedList });
        toast.success(data.message);
      } else {
        // Modo Usuario: Borrado individual en bucle (solo sus propios hilos)
        // Aunque el checkbox ya solo sale si pueden borrar, filtramos por seguridad
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
    <>
      <div className="grid grid-cols-[224px_1fr_272px] h-full text-foreground bg-background leading-normal">

        <aside className="bg-card border-r border-border flex flex-col">
          <div className="p-4 flex items-center gap-2 border-b border-border mb-1.5">
            <div className="w-[30px] h-[30px] bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">M</div>
            <div className="text-[13px] font-bold tracking-tight text-foreground">
              the<span className="text-primary">Gathering</span>
            </div>
          </div>

          <div className="p-4 border-b border-border relative z-20" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en el foro..."
                className="pl-9 bg-accent border-border focus-visible:ring-primary"
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
              <div className="absolute top-[calc(100%-4px)] left-4 right-4 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[350px]">
                <div className="px-3 py-2 bg-accent border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                  <span>Resultados Rápidos</span>
                  {isSearching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
                
                <div className="overflow-y-auto flex-1 overscroll-contain">
                  {!isSearching && searchResults.length === 0 && (
                    <div className="px-4 py-6 text-xs text-center text-muted-foreground flex flex-col items-center gap-2">
                       <Search className="h-6 w-6 text-muted-foreground/20" />
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
                      className={`flex flex-col p-3 cursor-pointer hover:bg-accent transition-all ${idx < searchResults.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <div className="text-xs font-bold text-foreground line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">{post.title}</div>
                      <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                        <span className="flex-1 truncate font-medium">@{post.author}</span>
                        <div className="flex items-center gap-1 shrink-0 text-orange-400">
                          <Flame className="w-3 h-3" />
                          <span className="font-bold">{post.score}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <MessageSquare className="w-3 h-3" />
                          <span className="font-bold">{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {searchResults.length > 0 && (
                  <div
                     onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/forum?q=${encodeURIComponent(searchTerm.trim())}`);
                     }}
                     className="px-3 py-2 bg-accent border-t border-border text-[11px] text-center font-bold text-primary hover:text-primary-foreground hover:bg-primary transition-all"
                  >
                    Ver todos los resultados &rarr;
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="py-2.5 px-4.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mi Actividad</div>
          <NavItem
            active={activeSideNav === "guardados"}
            icon="🔖"
            label="Guardados"
            onClick={() => {
              navigate('/forum');
              setActiveCategory(null);
              handleSetView("feed");
              setActiveSideNav("guardados");
            }}
          />

          <div className="py-2.5 px-4.5 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Categorías</div>
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

          <div className="mt-auto p-4 border-t border-border">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-accent cursor-pointer hover:bg-border transition-colors">
              <div className="w-7.5 h-7.5 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
                {user?.name?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold truncate text-foreground leading-none">{user?.username || user?.name || "Usuario"}</div>
                <div className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter">
                  {user?.wallet_balance ? `${user.wallet_balance} oro` : "0 oro"}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="p-4 overflow-y-auto relative">
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

        <aside className="p-4 flex flex-col gap-3">
          <Widget title="Torneos activos">
            <div className="px-3.5 py-1.5">
              {tournaments.length === 0 ? (
                 <div className="py-2.5 text-xs text-muted-foreground italic text-center">No hay torneos activos.</div>
              ) : tournaments.map((t, i) => (
                <div key={t.id} className={`flex items-center gap-2 py-2 ${i < tournaments.length - 1 ? 'border-b border-border' : ''}`}>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${t.status === 'live' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {t.status === 'live' ? "● En vivo" : "Próximo"}
                  </span>
                  <span onClick={() => setSelectedTournamentId(t.id)} className="text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer truncate flex-1">{t.name}</span>
                  <span className="text-[10px] font-bold text-muted-foreground shrink-0">{formatDate(t.date).split(',')[0]}</span>
                </div>
              ))}
            </div>
            
            {user && (
              <button onClick={() => setShowTournamentModal(true)} className="mx-3.5 my-2 w-[calc(100%-28px)] bg-primary text-primary-foreground py-2 rounded-md text-[11px] font-bold cursor-pointer hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
                + CREAR TORNEO
              </button>
            )}
          </Widget>

          <Widget title="Reglas del foro">
            <div className="px-3.5 py-1">
              {RULES.map((rule, i) => (
                <div key={rule} className={`text-[12px] text-muted-foreground py-2.5 flex gap-2.5 leading-relaxed ${i < RULES.length - 1 ? 'border-b border-border' : ''}`}>
                  <span className="text-primary font-black">{i + 1}</span>
                  <span className="font-medium">{rule}</span>
                </div>
              ))}
            </div>
          </Widget>
        </aside>
      </div>

      {showTournamentModal && <TournamentModal onClose={() => setShowTournamentModal(false)} onSuccess={() => { setShowTournamentModal(false); setRefreshKey(k => k + 1); }} />}
      {selectedTournamentId && <TournamentDetailModal tournamentId={selectedTournamentId} onClose={() => setSelectedTournamentId(null)} />}
    </>
  );
}
