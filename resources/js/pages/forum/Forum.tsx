import React, { useState, useEffect } from "react";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";
import { Category, SortMode, View, Post, Comment, Tournament } from "./types";
import { C, FONT, RULES, CAT_LABELS, SORT_LABELS } from "./constants";
import PostCard from "./PostCard";
import CommentItem from "./CommentItem";
import TournamentModal from "./TournamentModal";
import TournamentDetailModal from "./TournamentDetailModal";

function NavItem({ active, icon, label, badge, onClick }:
    { active: boolean; icon: string; label: string; badge?: number; onClick?: () => void }) {
    const [hov, setHov] = useState(false);
    return (
        <div onClick={onClick}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", cursor: "pointer",
                color: active ? C.accent : hov ? C.textPrimary : C.textSecondary,
                fontWeight: active ? 600 : 400, fontSize: 13,
                background: active || hov ? C.surface2 : "transparent",
                borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                transition: "all .15s", fontFamily: FONT
            }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            {label}
            {badge && (
                <span style={{
                    marginLeft: "auto", background: C.accent, color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                    fontFamily: FONT
                }}>{badge}</span>
            )}
        </div>
    );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{
                padding: "10px 14px", background: C.surface2, borderBottom: `1px solid ${C.border}`,
                fontSize: 10, fontWeight: 700, color: C.textSecondary, fontFamily: FONT,
                letterSpacing: "1px", textTransform: "uppercase"
            }}>
                {title}
            </div>
            {children}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

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

    // Estados para crear un post
    const [forumsList, setForumsList] = useState<any[]>([]);
    const [createTitle, setCreateTitle] = useState("");
    const [createBody, setCreateBody] = useState("");
    const [createForumId, setCreateForumId] = useState("");
    const [createTags, setCreateTags] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para crear un comentario
    const [newCommentBody, setNewCommentBody] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Modal para crear un torneo
    const [showTournamentModal, setShowTournamentModal] = useState(false);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);


    // Cargar lista de foros para el selector del formulario
    useEffect(() => {
        ApiService.getForums()
            .then(res => setForumsList(res.data || []))
            .catch(err => console.error("Error cargando foros:", err));
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const fetchThreads = activeSideNav === "guardados"
            ? ApiService.getSavedThreads()
            : (activeCategory
                ? ApiService.getForumThreads(activeCategory, sortMode)
                : ApiService.getThreads(sortMode));

        fetchThreads
            .then(res => {
                const rawThreads = res.data || [];
                // Mapear los datos del ThreadResource a lo que espera la UI
                const mappedPosts = rawThreads.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    preview: t.body,
                    author: t.author?.name || 'Desconocido',
                    category: t.forum?.slug || 'general',
                    score: t.score || 0,
                    userVote: t.user_vote || 0,
                    isSaved: t.is_saved || false,
                    comments: t.comments_count || 0,
                    timeAgo: t.created_at,
                    // Evitar fallos de React si 'tags' viene como string JSON crudo desde la BD
                    tags: Array.isArray(t.tags) ? t.tags : (typeof t.tags === 'string' ? JSON.parse(t.tags || '[]') : [])
                }));
                setPosts(mappedPosts);
            })
            .catch(err => console.error("Error cargando hilos:", err))
            .finally(() => setIsLoading(false));
        ApiService.getTournaments()
            .then(res => setTournaments(res.data?.data || res.data || []))
            .catch(err => console.error("Error cargando torneos:", err));
    }, [activeCategory, sortMode, refreshKey, activeSideNav]);

    // El backend ya se encarga de filtrar, asignamos directamente
    const filteredPosts = posts;

    const openThread = (post: Post) => {
        setActivePost(post);
        setView("thread");
        setComments([]);
        ApiService.getThread(post.id)
            .then(res => {
                const rawComments = res.data?.comments || [];
                const mappedComments = rawComments.map((c: any) => ({
                    id: c.id,
                    author: c.author?.name || c.user?.name || 'Desconocido',
                    avatarColor: '#3b82f6',
                    initials: (c.author?.name || c.user?.name || 'US').substring(0, 2).toUpperCase(),
                    timeAgo: c.created_at,
                    score: c.score,
                    userVote: c.user_vote || 0,
                    body: c.body,
                    replies: (c.replies || []).map((r: any) => ({
                        id: r.id,
                        author: r.author?.name || r.user?.name || 'Desconocido',
                        avatarColor: '#10b981',
                        initials: (r.author?.name || r.user?.name || 'US').substring(0, 2).toUpperCase(),
                        timeAgo: r.created_at,
                        score: r.score,
                        userVote: r.user_vote || 0,
                        body: r.body,
                    }))
                }));
                setComments(mappedComments);
            })
            .catch(err => console.error("Error cargando comentarios:", err));
    };

    const handleCreateComment = () => {
        if (!newCommentBody.trim() || !activePost) return;
        setIsSubmittingComment(true);
        ApiService.createComment(activePost.id, { body: newCommentBody })
            .then(() => {
                setNewCommentBody(""); // Limpiar el input
                openThread(activePost); // Recargar los comentarios del hilo para ver el nuevo
            })
            .catch(err => {
                console.error("Error creando comentario:", err);
                alert("Hubo un error al publicar el comentario. ¿Estás logueado?");
            })
            .finally(() => setIsSubmittingComment(false));
    };

    const handleCreatePost = () => {
        if (!createTitle.trim() || !createBody.trim() || !createForumId) {
            alert("Por favor, rellena el título, el contenido y selecciona una categoría.");
            return;
        }
        setIsSubmitting(true);

        // Convertir string de tags ("magic, torneo, duda") a array ["magic", "torneo", "duda"]
        const tagsArray = createTags.split(",").map(t => t.trim()).filter(t => t !== "");

        ApiService.createThread({
            forum_id: Number(createForumId),
            title: createTitle,
            body: createBody,
            tags: tagsArray.length > 0 ? tagsArray : undefined
        })
            .then(() => {
                setView("feed");
                setActiveSideNav("reciente"); // Reflejar visualmente en el menú
                setActiveCategory(null);
                setSortMode("nuevo"); // Cambiamos la pestaña a 'nuevo' para ver el post inmediatamente
                setCreateTitle(""); setCreateBody(""); setCreateTags(""); setCreateForumId("");
                setRefreshKey(k => k + 1); // Forzar recarga del feed
            })
            .catch(err => {
                console.error("Error creando post:", err);
                alert("Hubo un error al publicar el post. ¿Estás logueado?");
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <>
            {/* Para que este contenedor ocupe toda la altura disponible, se ha cambiado `minHeight` por `height: "100%"`.
          Asegúrate de que los contenedores padre (hasta la raíz de la aplicación) también tengan `height: 100%`
          o que se use un layout de Flexbox donde este componente pueda crecer (con `flex: 1`). */}
            <div style={{
                display: "grid", gridTemplateColumns: "224px 1fr 272px", height: "100%",
                fontFamily: FONT, fontSize: 14, lineHeight: 1.5, color: C.textPrimary, background: C.bg
            }}>

                {/* ── SIDEBAR ── */}
                <aside style={{
                    background: C.surface, borderRight: `1px solid ${C.border}`,
                    display: "flex", flexDirection: "column"
                }}>
                    <div style={{
                        padding: "18px 18px 16px", display: "flex", alignItems: "center", gap: 10,
                        borderBottom: `1px solid ${C.border}`, marginBottom: 6
                    }}>
                        <div style={{
                            width: 34, height: 34, background: C.accent, borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 17, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: FONT
                        }}>M</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily: FONT, letterSpacing: "-.3px" }}>
                            the<span style={{ color: C.accent }}>Gathering</span>
                        </div>
                    </div>

                    {[
                        {
                            section: "Categorías", items:
                                (["noticias", "estrategia", "general", "torneos"] as Category[]).map(cat => ({
                                    id: cat,
                                    icon: ({ noticias: "📰", estrategia: "⚔️", general: "💬", torneos: "🏆" } as Record<Category, string>)[cat],
                                    label: CAT_LABELS[cat],
                                    badge: cat === "torneos" ? 2 : undefined,
                                    cb: () => { setActiveCategory(cat); setView("feed"); },
                                }))
                        },
                        {
                            section: "Mi cuenta", items: [
                                { id: "guardados", icon: "📌", label: "Guardados", cb: () => { setActiveCategory(null); setView("feed"); } },
                                { id: "notificaciones", icon: "🔔", label: "Notificaciones", cb: () => alert("Las notificaciones llegarán pronto.") },
                            ]
                        },
                    ].map(({ section, items }) => (
                        <div key={section}>
                            <div style={{
                                padding: "10px 18px 4px", fontSize: 10, fontWeight: 700, color: C.textMuted,
                                textTransform: "uppercase", letterSpacing: "1px", fontFamily: FONT
                            }}>{section}</div>
                            {items.map((it: any) => (
                                <NavItem key={it.id} active={activeSideNav === it.id} icon={it.icon} label={it.label}
                                    badge={it.badge} onClick={() => { setActiveSideNav(it.id); it.cb?.(); }} />
                            ))}
                        </div>
                    ))}

                    <div style={{ marginTop: "auto", padding: "14px 18px", borderTop: `1px solid ${C.border}` }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                            padding: "8px 10px", borderRadius: 8, background: C.surface2
                        }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: "50%",
                                background: `linear-gradient(135deg,${C.accent},#1d4ed8)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, color: "#fff"
                            }}>
                                {user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: FONT }}>
                                    {user?.username || user?.name || "Usuario"}
                                </div>
                                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>
                                    {user?.wallet_balance ? `${user.wallet_balance} oro` : "0 oro"}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── FEED ── */}
                <main style={{ background: C.bg, padding: 16 }}>
                    {view === "feed" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>
                                    {activeSideNav === "guardados" ? "Hilos guardados" : (activeCategory ? CAT_LABELS[activeCategory] : "Inicio")}{" "}
                                    <span style={{ color: C.accent }}>·</span> Magic Forum
                                </div>
                                <button onClick={() => setView("create")} style={{
                                    background: C.accent, color: "#fff", border: "none",
                                    padding: "8px 18px", borderRadius: 6, fontSize: 13,
                                    fontWeight: 700, cursor: "pointer", fontFamily: FONT
                                }}>
                                    + Nuevo post
                                </button>
                            </div>

                            {activeSideNav !== "guardados" && (
                                <div style={{
                                    display: "flex", gap: 4, marginBottom: 14, background: C.surface,
                                    border: `1px solid ${C.border}`, borderRadius: 8, padding: 4
                                }}>
                                    {(["hot", "nuevo", "top", "comentado"] as SortMode[]).map(mode => {
                                        const active = sortMode === mode;
                                        return (
                                            <button key={mode} onClick={() => setSortMode(mode)}
                                                style={{
                                                    padding: "5px 14px", borderRadius: 6, border: "none",
                                                    background: active ? C.surface2 : "transparent",
                                                    color: active ? C.textPrimary : C.textSecondary,
                                                    fontWeight: active ? 600 : 400, fontSize: 13, cursor: "pointer",
                                                    fontFamily: FONT, transition: "all .15s"
                                                }}>
                                                {SORT_LABELS[mode]}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {isLoading ? (
                                <div style={{ textAlign: "center", padding: "20px", color: C.textMuted }}>Cargando datos...</div>
                            ) : (
                                filteredPosts.map(post => (
                                    <PostCard key={post.id} post={post} onOpen={() => openThread(post)} />
                                ))
                            )}
                        </>
                    )}

                    {view === "thread" && activePost && (
                        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                            <div style={{
                                padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                background: C.surface2
                            }}>
                                <div style={{
                                    fontSize: 15, fontWeight: 600, color: C.textPrimary,
                                    fontFamily: FONT, flex: 1, marginRight: 12
                                }}>{activePost.title}</div>
                                <button onClick={() => setView("feed")}
                                    style={{
                                        fontSize: 12, color: C.textSecondary, cursor: "pointer", padding: "4px 10px",
                                        borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent",
                                        fontFamily: FONT, fontWeight: 500, whiteSpace: "nowrap"
                                    }}>
                                    ← Volver
                                </button>
                            </div>

                            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                                <textarea
                                    value={newCommentBody}
                                    onChange={e => setNewCommentBody(e.target.value)}
                                    placeholder="Añade un comentario…"
                                    rows={3}
                                    style={{
                                        width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6,
                                        padding: "10px 14px", color: C.textPrimary, fontSize: 13,
                                        fontFamily: FONT, resize: "vertical", outline: "none", marginBottom: 8, boxSizing: "border-box"
                                    }}
                                />
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button onClick={handleCreateComment} disabled={isSubmittingComment || !newCommentBody.trim()}
                                        style={{
                                            background: C.accent, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6,
                                            fontSize: 13, fontWeight: 600, cursor: (isSubmittingComment || !newCommentBody.trim()) ? "not-allowed" : "pointer",
                                            fontFamily: FONT, opacity: (isSubmittingComment || !newCommentBody.trim()) ? 0.6 : 1
                                        }}>
                                        {isSubmittingComment ? "Enviando..." : "Comentar"}
                                    </button>
                                </div>
                            </div>

                            {comments.map(c => <CommentItem key={c.id} comment={c} />)}
                        </div>
                    )}

                    {view === "create" && (
                        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, fontFamily: FONT, margin: 0 }}>Crear nuevo post</h2>
                                <button onClick={() => setView("feed")}
                                    style={{
                                        fontSize: 12, color: C.textSecondary, cursor: "pointer", padding: "4px 10px",
                                        borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent",
                                        fontFamily: FONT, fontWeight: 500
                                    }}>
                                    Cancelar
                                </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <select
                                    value={createForumId} onChange={e => setCreateForumId(e.target.value)}
                                    style={{
                                        padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
                                        background: C.surface2, color: C.textPrimary, fontFamily: FONT, fontSize: 14, outline: "none"
                                    }}>
                                    <option value="">Selecciona una categoría...</option>
                                    {forumsList.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>

                                <input type="text" placeholder="Título de tu publicación"
                                    value={createTitle} onChange={e => setCreateTitle(e.target.value)}
                                    style={{
                                        padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
                                        background: C.surface2, color: C.textPrimary, fontFamily: FONT, fontSize: 14, outline: "none"
                                    }} />

                                <textarea placeholder="Escribe el contenido aquí..." rows={8}
                                    value={createBody} onChange={e => setCreateBody(e.target.value)}
                                    style={{
                                        padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
                                        background: C.surface2, color: C.textPrimary, fontFamily: FONT, fontSize: 14, outline: "none", resize: "vertical"
                                    }} />

                                <input type="text" placeholder="Etiquetas (separadas por coma, ej: magic, torneo, duda)"
                                    value={createTags} onChange={e => setCreateTags(e.target.value)}
                                    style={{
                                        padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
                                        background: C.surface2, color: C.textPrimary, fontFamily: FONT, fontSize: 14, outline: "none"
                                    }} />

                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                    <button onClick={handleCreatePost} disabled={isSubmitting}
                                        style={{
                                            background: C.accent, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, fontSize: 14,
                                            fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer", fontFamily: FONT, opacity: isSubmitting ? 0.7 : 1
                                        }}>
                                        {isSubmitting ? "Publicando..." : "Publicar post"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* ── RIGHT SIDEBAR ── */}
                <aside style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

                    <Widget title="Torneos activos">
                        <div style={{ padding: "6px 14px" }}>
                            {tournaments.map((t, i) => (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                                    borderBottom: i < tournaments.length - 1 ? `1px solid ${C.border}` : "none"
                                }}>
                                    <span style={{
                                        fontSize: 10, padding: "2px 7px", borderRadius: 99, flexShrink: 0,
                                        fontFamily: FONT, fontWeight: 600,
                                        ...(t.status === "live"
                                            ? { background: "rgba(248,113,113,.15)", color: C.red, border: "1px solid rgba(248,113,113,.3)" }
                                            : { background: "rgba(59,130,246,.12)", color: C.accent, border: "1px solid rgba(59,130,246,.3)" })
                                    }}>
                                        {t.status === "live" ? "● En vivo" : "Próximo"}
                                    </span>

                                    {/* Nombre clicable */}
                                    <span
                                        onClick={() => setSelectedTournamentId(t.id)}
                                        style={{
                                            fontSize: 12, color: C.accent, flex: 1, fontFamily: FONT,
                                            cursor: "pointer", textDecoration: "underline"
                                        }}>
                                        {t.name}
                                    </span>

                                    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>{t.date}</span>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setShowTournamentModal(true)} style={{
                            display: "block", width: "calc(100% - 28px)", margin: "8px 14px 10px",
                            background: C.accent, color: "#fff", border: "none", borderRadius: 6,
                            padding: "7px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT
                        }}>
                            + Crear torneo
                        </button>
                    </Widget>

                    <Widget title="Estadísticas">
                        <div style={{ padding: "4px 14px" }}>
                            {([["Online ahora", "342", true], ["Miembros", "8.431", false], ["Posts hoy", "47", false]] as [string, string, boolean][])
                                .map(([label, val, dot], i) => (
                                    <div key={i} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "6px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none"
                                    }}>
                                        <span style={{ fontSize: 12, color: C.textSecondary, fontFamily: FONT }}>
                                            {dot && <span style={{
                                                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                                                background: C.green, marginRight: 6
                                            }} />}
                                            {label}
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>{val}</span>
                                    </div>
                                ))}
                        </div>
                    </Widget>

                    <Widget title="Reglas del foro">
                        <div style={{ padding: "4px 14px" }}>
                            {RULES.map((rule, i) => (
                                <div key={i} style={{
                                    fontSize: 12, color: C.textSecondary, padding: "6px 0",
                                    borderBottom: i < RULES.length - 1 ? `1px solid ${C.border}` : "none",
                                    display: "flex", gap: 10, fontFamily: FONT, lineHeight: 1.5
                                }}>
                                    <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                                    {rule}
                                </div>
                            ))}
                        </div>
                    </Widget>

                </aside>
            </div>
            {showTournamentModal && (
                <TournamentModal
                    onClose={() => setShowTournamentModal(false)}
                    onSuccess={() => {
                        setShowTournamentModal(false);
                        setRefreshKey(k => k + 1); // recarga el feed y los torneos
                    }}
                />
            )}
            {selectedTournamentId && (
                <TournamentDetailModal
                    tournamentId={selectedTournamentId}
                    onClose={() => setSelectedTournamentId(null)}
                />
            )}
        </>
    );
}
