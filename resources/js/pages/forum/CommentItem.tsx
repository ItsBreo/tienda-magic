import { useState, useEffect } from "react";
import { Comment, Reply } from "./types";
import { C, FONT } from "./constants";
import ApiService from "../../services/ApiService";

function ReplyItem({ reply }: { reply: Reply }) {
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(reply.score || 0);
  const [vote, setVote] = useState<1 | -1 | 0>((reply as any).userVote || 0);

  // Sincroniza el estado si llegan nuevos datos del backend
  useEffect(() => {
    setScore(reply.score || 0);
    setVote((reply as any).userVote || 0);
  }, [reply.score, (reply as any).userVote]);

  const cast = async (dir: 1 | -1) => {
    const newVote = vote === dir ? 0 : dir;
    const scoreDiff = newVote - vote;
    setScore(s => s + scoreDiff);
    setVote(newVote);

    try {
      const data = await ApiService.vote(reply.id, 'comment', dir);
      setScore(data.score);
      setVote(data.user_vote || 0);
    } catch (err) {
      console.error("Error al votar respuesta:", err);
      setScore(s => s - scoreDiff);
      setVote(vote);
    }
  };

  const isHidden = reply.hidden || score < -5;

  if (isHidden && !revealed) {
    return (
      <div style={{ padding:"8px 14px 8px 32px",borderBottom:`1px solid ${C.border}`, display:"flex",gap:10,alignItems:"center" }}>
        <div style={{ width:18,height:18,borderRadius:"50%",background:C.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:C.textMuted,flexShrink:0 }}>?</div>
        <div onClick={() => setRevealed(true)}
          style={{ background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.25)", borderRadius:6,padding:"6px 12px",fontSize:12,color:C.red, display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:FONT }}>
          ⚠️ Comentario oculto · puntuación {score} · Haz clic para ver
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding:"8px 14px 8px 32px",borderBottom:`1px solid ${C.border}`, display:"flex",gap:10,background:"rgba(255,255,255,.01)" }}>
      <div style={{ width:18,height:18,borderRadius:"50%",background:reply.avatarColor, display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff",flexShrink:0 }}>{reply.initials}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11,color:C.textMuted,marginBottom:4,fontFamily:FONT }}>
          <b style={{ color:C.textSecondary,fontWeight:600 }}>{reply.author}</b> · {reply.timeAgo} ·{" "}
          <span style={{ color:score<0?C.red:C.accent }}>{score>0?`+${score}`:score}</span>
        </div>
        <div style={{ fontSize:13,color:isHidden?C.textMuted:C.textPrimary, lineHeight:1.6,marginBottom:6,opacity:isHidden?0.7:1,fontFamily:FONT }}>{reply.body}</div>
        <div style={{ display:"flex",gap:2 }}>
          <button onClick={() => cast(1)} style={{ padding:"2px 6px",borderRadius:3,border:"none",background:"transparent",color:vote===1?C.accent:C.textMuted,fontSize:11,cursor:"pointer",fontFamily:FONT,fontWeight:vote===1?600:400 }}>▲ {score}</button>
          <button onClick={() => cast(-1)} style={{ padding:"2px 6px",borderRadius:3,border:"none",background:"transparent",color:vote===-1?C.red:C.textMuted,fontSize:11,cursor:"pointer",fontFamily:FONT,fontWeight:vote===-1?600:400 }}>▼</button>
          <button style={{ padding:"2px 6px",borderRadius:3,border:"none",background:"transparent",color:C.textMuted,fontSize:11,cursor:"pointer",fontFamily:FONT }}>💬 Responder</button>
        </div>
      </div>
    </div>
  );
}

export default function CommentItem({ comment }: { comment: Comment }) {
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(comment.score || 0);
  const [vote, setVote] = useState<1 | -1 | 0>((comment as any).userVote || 0);

  // Sincroniza el estado si llegan nuevos datos del backend
  useEffect(() => {
    setScore(comment.score || 0);
    setVote((comment as any).userVote || 0);
  }, [comment.score, (comment as any).userVote]);

  const cast = async (dir: 1 | -1) => {
    const newVote = vote === dir ? 0 : dir;
    const scoreDiff = newVote - vote;
    setScore(s => s + scoreDiff);
    setVote(newVote);

    try {
      const data = await ApiService.vote(comment.id, 'comment', dir);
      setScore(data.score);
      setVote(data.user_vote || 0);
    } catch (err) {
      console.error("Error al votar comentario:", err);
      setScore(s => s - scoreDiff);
      setVote(vote);
    }
  };

  const isHidden = comment.hidden || score < -5;

  if (isHidden && !revealed) {
    return (
      <div style={{ padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center" }}>
        <div style={{ width:24,height:24,borderRadius:"50%",background:C.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.textMuted,flexShrink:0 }}>?</div>
        <div onClick={() => setRevealed(true)}
          style={{ background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.25)", borderRadius:6,padding:"6px 12px",fontSize:13,color:C.red, display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:FONT }}>
          ⚠️ Comentario oculto · puntuación {score} · Haz clic para ver
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10 }}>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
          <div style={{ width:24,height:24,borderRadius:"50%",background:comment.avatarColor,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:9,fontWeight:700,color:"#fff",flexShrink:0 }}>{comment.initials}</div>
          <div style={{ width:2,flex:1,background:C.border,borderRadius:1,minHeight:12 }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11,color:C.textMuted,marginBottom:4,fontFamily:FONT }}>
            <b style={{ color:C.textSecondary,fontWeight:600 }}>{comment.author}</b> · {comment.timeAgo} ·{" "}
            <span style={{ color:score<0?C.red:C.accent }}>{score>0?`+${score}`:score}</span>
          </div>
          <div style={{ fontSize:13,color:isHidden?C.textMuted:C.textPrimary,lineHeight:1.6,marginBottom:8,opacity:isHidden?0.7:1,fontFamily:FONT }}>
            {comment.body}
          </div>
          <div style={{ display:"flex",gap:2 }}>
            <button onClick={() => cast(1)} style={{ padding:"2px 8px",borderRadius:3,border:"none",background:"transparent", color:vote===1?C.accent:C.textMuted,fontSize:11,cursor:"pointer", fontFamily:FONT,fontWeight:vote===1?600:400 }}>▲ {score}</button>
            <button onClick={() => cast(-1)} style={{ padding:"2px 8px",borderRadius:3,border:"none",background:"transparent", color:vote===-1?C.red:C.textMuted,fontSize:11,cursor:"pointer", fontFamily:FONT,fontWeight:vote===-1?600:400 }}>▼</button>
            <button style={{ padding:"2px 8px",borderRadius:3,border:"none",background:"transparent", color:C.textMuted,fontSize:11,cursor:"pointer", fontFamily:FONT,fontWeight:400 }}>💬 Responder</button>
            <button style={{ padding:"2px 8px",borderRadius:3,border:"none",background:"transparent", color:C.textMuted,fontSize:11,cursor:"pointer", fontFamily:FONT,fontWeight:400 }}>···</button>
          </div>
        </div>
      </div>
      {comment.replies.map(r => <ReplyItem key={r.id} reply={r} />)}
    </>
  );
}
