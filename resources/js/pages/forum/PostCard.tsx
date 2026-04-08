import { useState, useEffect } from "react";
import { Post } from "./types";
import { C, FONT, CAT_STYLE, CAT_LABELS } from "./constants";
import ApiService from "../../services/ApiService";

function VoteCol({ threadId, initialScore, initialVote = 0 }: { threadId: number, initialScore: number, initialVote?: number }) {
  const [score, setScore] = useState(initialScore);
  const [vote,  setVote]  = useState<1 | -1 | 0>(initialVote as any);

  // Sincronizar el componente visual si el backend envía nuevos datos al recargar
  useEffect(() => {
    setScore(initialScore);
    setVote(initialVote as any);
  }, [initialScore, initialVote]);

  const cast = async (dir: 1 | -1) => {
    const newVote = vote === dir ? 0 : dir;
    const scoreDiff = newVote - vote;

    setScore(s => s + scoreDiff);
    setVote(newVote);

    try {
        // Siempre enviamos el 'dir' original (1 o -1) para que Laravel pase la validación.
        // El controlador se encargará de hacer el "toggle" si el voto es repetido.
        const data = await ApiService.vote(threadId, 'thread', dir);

        // Sincronizamos instantáneamente con los valores reales del servidor
        setScore(data.score);
        setVote(data.user_vote || 0); // Si es null (cancelado), vuelve a 0
    } catch (err) {
        console.error("Error al votar", err);
        setScore(s => s - scoreDiff); // Revertir visualmente si hay fallo
        setVote(vote);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  padding:"10px 8px", background: C.surface2, gap:3, minWidth:42 }}>
      <button onClick={() => cast(1)} style={{ width:24,height:24,border:"none",background:"transparent",
        cursor:"pointer",borderRadius:3,color:vote===1?C.accent:C.textMuted,fontSize:13,fontFamily:FONT }}>▲</button>
      <span style={{ fontSize:12,fontWeight:700,color:score>200?C.accent:C.textSecondary,
                     minWidth:20,textAlign:"center",fontFamily:FONT }}>{score}</span>
      <button onClick={() => cast(-1)} style={{ width:24,height:24,border:"none",background:"transparent",
        cursor:"pointer",borderRadius:3,color:vote===-1?C.red:C.textMuted,fontSize:13,fontFamily:FONT }}>▼</button>
    </div>
  );
}

function ActionBtn({ label, onClick, active }: { label: string; onClick?: () => void; active?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:4,
               border:"none",background:hov?"rgba(59,130,246,.08)":"transparent",
               color:active?C.accent:(hov?C.textSecondary:C.textMuted),fontSize:12,cursor:"pointer",
               fontFamily:FONT,transition:"all .15s",fontWeight:active?600:400 }}>
      {label}
    </button>
  );
}

export default function PostCard({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  const [titleHov, setTitleHov] = useState(false);
  const [isSaved, setIsSaved] = useState((post as any).isSaved || false);

  // Sincronizar el componente visual si el backend envía nuevos datos al recargar
  useEffect(() => {
    setIsSaved((post as any).isSaved || false);
  }, [(post as any).isSaved]);

  const toggleSave = async () => {
    const newVal = !isSaved;
    setIsSaved(newVal); // Cambio optimista (UI instantánea)
    try {
      if (newVal) {
        await ApiService.saveThread(post.id);
      } else {
        await ApiService.unsaveThread(post.id);
      }
    } catch (err) {
      console.error("Error al guardar/quitar hilo:", err);
      setIsSaved(!newVal); // Revertir visualmente si hay fallo
    }
  };

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"flex",background:C.surface, border:`1px solid ${hov?C.border2:C.border}`,
               borderRadius:8,marginBottom:8,overflow:"hidden",transition:"border-color .15s" }}>
      <VoteCol threadId={post.id} initialScore={post.score} initialVote={post.userVote} />
      <div style={{ padding:"10px 14px",flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap" }}>
          <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,
                         fontFamily:FONT,letterSpacing:".3px",...CAT_STYLE[post.category] }}>
            {CAT_LABELS[post.category]}
          </span>
          <span style={{ fontSize:12,color:C.textMuted,fontFamily:FONT }}>
            por <b style={{ color:C.textSecondary,fontWeight:600 }}>{post.author}</b>{post.isMod && " 🛡️"}
          </span>
          <span style={{ fontSize:12,color:C.textMuted,fontFamily:FONT }}>· {post.timeAgo}</span>
        </div>
        <div onClick={onOpen} onMouseEnter={() => setTitleHov(true)} onMouseLeave={() => setTitleHov(false)}
          style={{ fontSize:15,fontWeight:600,color:titleHov?C.accent:C.textPrimary,
                   marginBottom:6,lineHeight:1.4,cursor:"pointer",fontFamily:FONT,transition:"color .15s" }}>
          {post.title}
        </div>
        <div style={{ fontSize:13,color:C.textSecondary,marginBottom:8,lineHeight:1.6, display:"-webkit-box",
                      WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",fontFamily:FONT }}>{post.preview}</div>
        <div style={{ display:"flex",gap:4,marginBottom:8,flexWrap:"wrap" }}>
          {post.tags.map(t => (
            <span key={t} style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:"rgba(59,130,246,.08)",
                                   color:C.textSecondary,border:`1px solid ${C.border}`,cursor:"pointer",fontFamily:FONT }}>{t}</span>
          ))}
        </div>
        <div style={{ display:"flex",gap:2 }}>
          <ActionBtn label={`💬 ${post.comments} comentarios`} onClick={onOpen} />
          <ActionBtn label="🔗 Compartir" />
          <ActionBtn label={isSaved ? "🔖 Guardado" : "🔖 Guardar"} onClick={toggleSave} active={isSaved} />
        </div>
      </div>
    </div>
  );
}
