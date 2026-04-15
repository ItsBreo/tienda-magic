import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";
import { Category, SortMode, View, Post, Comment, Tournament } from "./types";
import { RULES, CAT_LABELS } from "./constants";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import TournamentModal from "./TournamentModal";
import TournamentDetailModal from "./TournamentDetailModal";
import ForumFeedView from "./ForumFeed";
import ThreadDetailView from "./ThreadDetail";
import CreatePostView from "./CreatePost";

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
          ? 'text-[var(--accent)] font-semibold bg-[var(--surface-2)] border-[var(--accent)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] border-transparent'
        }`}
    >
      <span className="text-[15px]">{icon}</span>
      <span className="text-[13px]">{label}</span>
      {badge && (
        <span className="ml-auto bg-[var(--accent)] text-white text-[10px] font-bold py-0.5 px-1.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="py-2.5 px-3.5 bg-[var(--surface-2)] border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function MagicForum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>("feed"); // The current view
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [activeSideNav, setActiveSideNav] = useState("inicio");
  const [posts, setPosts] = useState<Post[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");

  // Estado para la animación de transición entre vistas
  const [isHiding, setIsHiding] = useState(false);

  // Estados
  const [forumsList, setForumsList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Modales
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

  // Función para cambiar de vista con animación
  const handleSetView = (newView: View) => {
    if (view === newView) return;
    setIsHiding(true); // Inicia la animación de salida
    setTimeout(() => {
      setView(newView);
      setIsHiding(false); // Termina la animación, mostrando la nueva vista
    }, 200); // Duración de la transición (ej. 200ms)
  };

  useEffect(() => {
    ApiService.getForums()
      .then(res => setForumsList(res.data || []))
      .catch(err => console.error("Error al cargar la lista de foros:", err));
  }, []);

  // Efecto para la búsqueda dinámica (con debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmedSearch = searchTerm.trim();
      // Actualizamos la URL si el término es válido o si se ha borrado una búsqueda existente
      if (trimmedSearch.length >= 3) {
        navigate(`/forum?q=${encodeURIComponent(trimmedSearch)}`);
      } else if (!trimmedSearch && searchParams.get('q')) {
        navigate('/forum');
      }
    }, 500); // 500ms de espera antes de buscar

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, navigate, searchParams]);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    setIsLoading(true);

    const mapThreadToPost = (t: any): Post => ({
      id: t.id,
      forum_id: t.forum_id,
      title: t.title,
      preview: t.body,
      author: t.user?.username || t.user?.name || t.author?.name || "Desconocido",
      author_id: t.user?.id || t.author?.id || 0,
      category: t.forum?.slug as Category,
      score: t.score || 0,
      userVote: t.user_vote || 0,
      isSaved: t.is_saved || false,
      comments: t.comments_count || 0,
      timeAgo: formatDate(t.created_at),
      tags: (() => { 
        if (Array.isArray(t.tags)) return t.tags;
        try { return JSON.parse(t.tags || "[]"); } catch { return []; }
      })(),
      can_delete: t.can_delete,
      can_edit: t.can_edit,
    });

    let fetcher;

    if (searchQuery && searchQuery.length >= 3) {
      if (view !== 'feed') handleSetView('feed'); // Asegurarnos que estamos en la vista de feed para mostrar resultados
      if (activeCategory !== null) setActiveCategory(null);
      if (activeSideNav !== 'search') setActiveSideNav('search');
      fetcher = ApiService.axiosInstance.get(`/api/forum/search`, { params: { q: searchQuery } });
    } else {
      fetcher = activeSideNav === "guardados"
        ? ApiService.getSavedThreads()
        : (activeCategory
            ? ApiService.getForumThreads(activeCategory, sortMode)
            : ApiService.getThreads(sortMode));
    }

    fetcher
      .then(res => {
        // La respuesta de búsqueda está en res.data.data, las otras en res.data
        const threads = res.data.data || res.data || [];
        const mappedPosts = threads.map(mapThreadToPost);
        setPosts(mappedPosts);
      })
      .catch(err => {
        console.error("Error al cargar los hilos:", err);
        setPosts([]);
      })
      .finally(() => setIsLoading(false));

    ApiService.getTournaments()
      .then(res => setTournaments(res.data?.data || res.data || []))
      .catch(err => console.error("Error al cargar los torneos:", err));

  }, [activeCategory, sortMode, refreshKey, activeSideNav, searchParams]);

  const openThread = (post: Post) => {
    setActivePost(post);
    handleSetView("thread");
    setComments([]);
    ApiService.getThread(post.id).then(res => {
      const mapped = (res.data?.comments || []).map((c: any) => ({
        id: c.id, 
        author: c.user?.username || c.user?.name || c.author?.name || "Desconocido", 
        author_id: c.user?.id || c.author?.id || 0,
        avatarColor: "var(--accent)",
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
          avatarColor: "#10b981",
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

  const handleCreatePost = (data: { forum_id: number; title: string; body: string; tags?: string[] }) => {
    setIsSubmitting(true);
    ApiService.createThread(data)
    .then(() => {
        handleSetView("feed");
        setActiveSideNav("reciente");
        setActiveCategory(null);
        setSortMode("nuevo");
        setRefreshKey(k => k + 1);
    })
    .catch(err => {
        console.error("Error creando el post:", err.response?.data || err.message);
        alert("Hubo un error al publicar el post. Revisa la consola para más detalles.");
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
        alert("Hubo un error al publicar el comentario. Revisa la consola para más detalles.");
    })
    .finally(() => setIsSubmittingComment(false));
  };

  const renderContent = () => {
    const searchQuery = searchParams.get('q');
    if (view === 'create') {
      return <CreatePostView forumsList={forumsList} isSubmitting={isSubmitting} onCancel={() => handleSetView('feed')} onSubmit={handleCreatePost} />;
    }
    if (view === 'thread' && activePost) {
      return <ThreadDetailView post={activePost} comments={comments} isSubmitting={isSubmittingComment} onBack={() => handleSetView('feed')} onCommentSubmit={handleCreateComment} />;
    }

    const isSearch = !!searchQuery;
    const feedTitle = isSearch ? `Resultados para: "${searchQuery}"` : undefined;

    return <ForumFeedView posts={posts} isLoading={isLoading} activeSideNav={isSearch ? 'search' : activeSideNav} title={feedTitle} activeCategory={isSearch ? null : activeCategory} sortMode={sortMode} onSortModeChange={setSortMode} onOpenThread={openThread} onShowCreateView={() => handleSetView('create')} />;
  };

  return (
    <>
      <div className="grid grid-cols-[224px_1fr_272px] h-full text-[var(--text-primary)] bg-[var(--bg)] leading-normal">

        {/* SIDEBAR */}
        <aside className="bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
          <div className="p-4 flex items-center gap-2 border-b border-[var(--border)] mb-1.5">
            <div className="w-[30px] h-[30px] bg-[var(--accent)] rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <div className="text-[13px] font-bold tracking-tight text-[var(--text-primary)]">
              the<span className="text-[var(--accent)]">Gathering</span>
            </div>
          </div>

          <div className="p-4 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar en el foro..."
                className="pl-9 bg-[var(--surface-2)] border-[var(--border)] focus-visible:ring-[var(--accent)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="py-2.5 px-4.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Mi Actividad</div>
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

          <div className="py-2.5 px-4.5 mt-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Categorías</div>
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

          <div className="mt-auto p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--surface-2)] cursor-pointer hover:bg-[var(--border)] transition-colors">
              <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-br from-[var(--accent)] to-blue-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {user?.name?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate text-[var(--text-primary)]">{user?.username || user?.name || "Usuario"}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{user?.wallet_balance ? `${user.wallet_balance} oro` : "0 oro"}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* FEED */}
        <main className="p-4 overflow-y-auto">
          <div className={`transition-opacity duration-200 ${isHiding ? 'opacity-0' : 'opacity-100'}`}>
            {renderContent()}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="p-4 flex flex-col gap-3">
          <Widget title="Torneos activos">
            <div className="px-3.5 py-1.5">
              {tournaments.length === 0 ? (
                 <div className="py-2.5 text-xs text-[var(--text-muted)]">No hay torneos activos.</div>
              ) : tournaments.map((t, i) => (
                <div key={t.id} className={`flex items-center gap-2 py-2 ${i < tournaments.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${t.status === 'live' ? 'cat-torneos' : 'cat-noticias'}`}>
                    {t.status === 'live' ? "● En vivo" : "Próximo"}
                  </span>
                  <span onClick={() => setSelectedTournamentId(t.id)} className="text-xs text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors cursor-pointer truncate flex-1">{t.name}</span>
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">{formatDate(t.date)}</span>
                </div>
              ))}
            </div>
            
            {user && (
              <button onClick={() => setShowTournamentModal(true)} className="mx-3.5 my-2 w-[calc(100%-28px)] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] py-1.5 rounded-md text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition-colors">
                + Crear torneo
              </button>
            )}
          </Widget>

          <Widget title="Reglas del foro">
            <div className="px-3.5 py-1">
              {RULES.map((rule, i) => (
                <div key={rule} className={`text-xs text-[var(--text-secondary)] py-2 flex gap-2.5 leading-relaxed ${i < RULES.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <span className="text-[var(--accent)] font-bold">{i + 1}</span>
                  {rule}
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
