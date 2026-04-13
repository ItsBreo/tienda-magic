import React, { useState, useEffect } from "react";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";
import { Category, SortMode, View, Post, Comment, Tournament } from "./types";
import { RULES, CAT_LABELS, SORT_LABELS } from "./constants";
import PostCard from "./PostCard";
import CommentItem from "./CommentItem";
import TournamentModal from "./TournamentModal";
import TournamentDetailModal from "./TournamentDetailModal";

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

  // Estados de creación
  const [forumsList, setForumsList] = useState<any[]>([]);
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createForumId, setCreateForumId] = useState("");
  const [createTags, setCreateTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Modales
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

  useEffect(() => {
    ApiService.getForums().then(res => setForumsList(res.data || []));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const fetchThreads = activeSideNav === "guardados"
      ? ApiService.getSavedThreads()
      : (activeCategory
          ? ApiService.getForumThreads(activeCategory, sortMode)
          : ApiService.getThreads(sortMode));

    fetchThreads.then(res => {
      const mapped = (res.data || []).map((t: any) => ({
        id: t.id, title: t.title, preview: t.body, author: t.author?.name || "Desconocido",
        category: t.forum?.slug || "general", score: t.score || 0, userVote: t.user_vote || 0,
        isSaved: t.is_saved || false, comments: t.comments_count || 0, timeAgo: t.created_at,
        tags: Array.isArray(t.tags) ? t.tags : JSON.parse(t.tags || "[]"),
      }));
      setPosts(mapped);
    }).finally(() => setIsLoading(false));

    ApiService.getTournaments().then(res => setTournaments(res.data?.data || res.data || []));
  }, [activeCategory, sortMode, refreshKey, activeSideNav]);

  const openThread = (post: Post) => {
    setActivePost(post);
    setView("thread");
    setComments([]);
    ApiService.getThread(post.id).then(res => {
      const mapped = (res.data?.comments || []).map((c: any) => ({
        id: c.id, author: c.author?.name || "Desconocido", avatarColor: "var(--accent)",
        initials: (c.author?.name || "US").substring(0, 2).toUpperCase(),
        timeAgo: c.created_at, score: c.score, userVote: c.user_vote || 0, body: c.body,
        replies: (c.replies || []).map((r: any) => ({
          id: r.id, author: r.author?.name || "Desconocido", avatarColor: "#10b981",
          initials: (r.author?.name || "US").substring(0, 2).toUpperCase(),
          timeAgo: r.created_at, score: r.score, body: r.body,
        })),
      }));
      setComments(mapped);
    });
  };

  const handleCreatePost = () => {
    if (!createTitle.trim() || !createBody.trim() || !createForumId) {
        alert("Por favor, rellena el título, el contenido y selecciona una categoría.");
        return;
    }
    setIsSubmitting(true);
    const tagsArray = createTags.split(",").map(t => t.trim()).filter(t => t !== "");
    ApiService.createThread({
        forum_id: Number(createForumId),
        title: createTitle,
        body: createBody,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
    })
    .then(() => {
        setView("feed");
        setActiveSideNav("reciente");
        setActiveCategory(null);
        setSortMode("nuevo");
        setCreateTitle(""); setCreateBody(""); setCreateTags(""); setCreateForumId("");
        setRefreshKey(k => k + 1);
    })
    .catch(err => {
        console.error("Error creando post:", err);
        alert("Hubo un error al publicar el post. ¿Estás logueado?");
    })
    .finally(() => setIsSubmitting(false));
  };

  const handleCreateComment = () => {
    if (!newCommentBody.trim() || !activePost) return;
    setIsSubmittingComment(true);
    ApiService.createComment(activePost.id, { body: newCommentBody })
    .then(() => {
        setNewCommentBody("");
        openThread(activePost);
    })
    .catch(err => {
        console.error("Error creando comentario:", err);
        alert("Hubo un error al publicar el comentario. ¿Estás logueado?");
    })
    .finally(() => setIsSubmittingComment(false));
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

          <div className="py-2.5 px-4.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Categorías</div>
          {(["noticias", "estrategia", "general", "torneos"] as Category[]).map(cat => (
            <NavItem
              key={cat}
              active={activeCategory === cat}
              icon={cat === "noticias" ? "📰" : cat === "estrategia" ? "⚔️" : cat === "torneos" ? "🏆" : "💬"}
              label={CAT_LABELS[cat]}
              badge={cat === "torneos" ? 2 : undefined}
              onClick={() => { setActiveCategory(cat); setView("feed"); setActiveSideNav(cat); }}
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
          {view === "feed" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  {activeSideNav === "guardados" ? "Guardados" : (activeCategory ? CAT_LABELS[activeCategory] : "Inicio")}
                  <span className="text-[var(--accent)] mx-1">·</span> Magic Forum
                </h1>
                <button onClick={() => setView("create")} className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] px-4.5 py-2 rounded-md text-[13px] font-bold cursor-pointer hover:bg-[var(--border)] transition-colors">
                  + Nuevo post
                </button>
              </div>

              {activeSideNav !== "guardados" && (
                <div className="flex gap-1 mb-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
                  {(["hot", "nuevo", "top"] as SortMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSortMode(mode)}
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
                posts.map(post => <PostCard key={post.id} post={post} onOpen={() => openThread(post)} />)
              )}
            </>
          )}

          {view === "thread" && activePost && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
               <div className="p-4 bg-[var(--surface-2)] border-b border-[var(--border)] flex justify-between items-center gap-4">
                  <h2 className="font-semibold text-[15px] text-[var(--text-primary)] flex-1">{activePost.title}</h2>
                  <button onClick={() => setView("feed")} className="text-xs text-[var(--text-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-md bg-transparent hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0">
                    ← Volver
                  </button>
               </div>

               <div className="p-4 border-b border-[var(--border)]">
                  <textarea
                      value={newCommentBody}
                      onChange={e => setNewCommentBody(e.target.value)}
                      placeholder="Añade un comentario…"
                      rows={3}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md py-2.5 px-3.5 text-[var(--text-primary)] text-[13px] resize-y outline-none focus:border-[var(--accent)] transition-colors mb-2"
                  />
                  <div className="flex justify-end">
                      <button
                        onClick={handleCreateComment}
                        disabled={isSubmittingComment || !newCommentBody.trim()}
                        className={`bg-[var(--accent)] text-white border-none py-1.5 px-3.5 rounded-md text-[13px] font-semibold transition-colors ${isSubmittingComment || !newCommentBody.trim() ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[var(--accent-hover)] cursor-pointer'}`}
                      >
                          {isSubmittingComment ? "Enviando..." : "Comentar"}
                      </button>
                  </div>
              </div>

               <div className="pb-4">
                  {comments.map(c => <CommentItem key={c.id} comment={c} />)}
               </div>
            </div>
          )}

          {view === "create" && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">
                  Crear nuevo post
                </h2>
                <button
                  onClick={() => setView("feed")}
                  className="text-xs text-[var(--text-secondary)] cursor-pointer py-1 px-2.5 rounded-md border border-[var(--border)] bg-transparent font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <select
                  value={createForumId} onChange={e => setCreateForumId(e.target.value)}
                  className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="">Selecciona una categoría...</option>
                  {forumsList.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                <input
                  type="text" placeholder="Título de tu publicación"
                  value={createTitle} onChange={e => setCreateTitle(e.target.value)}
                  className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors"
                />

                <textarea
                  placeholder="Escribe el contenido aquí..." rows={8}
                  value={createBody} onChange={e => setCreateBody(e.target.value)}
                  className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-sm outline-none resize-y focus:border-[var(--accent)] transition-colors"
                />

                <input
                  type="text" placeholder="Etiquetas (separadas por coma, ej: magic, torneo, duda)"
                  value={createTags} onChange={e => setCreateTags(e.target.value)}
                  className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors"
                />

                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleCreatePost} disabled={isSubmitting}
                    className={`bg-[var(--accent)] text-white border-none py-2.5 px-6 rounded-md text-sm font-bold cursor-pointer transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--accent-hover)]'}`}
                  >
                    {isSubmitting ? "Publicando..." : "Publicar post"}
                  </button>
                </div>
              </div>
            </div>
          )}
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
            <button onClick={() => setShowTournamentModal(true)} className="mx-3.5 my-2 w-[calc(100%-28px)] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] py-1.5 rounded-md text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition-colors">
              + Crear torneo
            </button>
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
