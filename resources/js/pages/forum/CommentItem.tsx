import { useState, useEffect } from "react";
import { Comment, Reply } from "./types";
import ApiService from "../../services/ApiService";

function ReplyItem({ reply }: { reply: Reply }) {
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(reply.score || 0);
  const [vote, setVote] = useState<1 | -1 | 0>((reply as any).userVote || 0);

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
      const data = await ApiService.vote(reply.id, "comment", dir);
      setScore(data.score);
      setVote(data.user_vote || 0);
    } catch (err) {
      setScore(s => s - scoreDiff);
      setVote(vote);
    }
  };

  const isHidden = reply.hidden || score < -5;

  if (isHidden && !revealed) {
    return (
      <div className="py-2 pl-8 pr-3.5 border-b border-[var(--border)] flex gap-2.5 items-center">
        <div className="w-[18px] h-[18px] rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[8px] font-bold text-[var(--text-muted)] shrink-0">?</div>
        <div onClick={() => setRevealed(true)} className="bg-red-400/10 border border-red-400/25 rounded-md py-1.5 px-3 text-xs text-[var(--red)] flex items-center gap-1.5 cursor-pointer">
          ⚠️ Comentario oculto · puntuación {score} · Haz clic para ver
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 pl-8 pr-3.5 border-b border-[var(--border)] flex gap-2.5 bg-white/5">
      <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ background: reply.avatarColor }}>
        {reply.initials}
      </div>

      <div className="flex-1">
        <div className="text-[11px] text-[var(--text-muted)] mb-1">
          <b className="text-[var(--text-secondary)] font-semibold">{reply.author}</b> · {reply.timeAgo} ·{" "}
          <span className={score < 0 ? 'text-[var(--red)]' : 'text-[var(--accent)]'}>{score > 0 ? `+${score}` : score}</span>
        </div>
        <div className={`text-[13px] leading-relaxed mb-1.5 ${isHidden ? 'text-[var(--text-muted)] opacity-70' : 'text-[var(--text-primary)]'}`}>
          {reply.body}
        </div>
        <div className="flex gap-0.5">
          <button onClick={() => cast(1)} className={`py-0.5 px-1.5 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === 1 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'}`}>▲ {score}</button>
          <button onClick={() => cast(-1)} className={`py-0.5 px-1.5 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === -1 ? 'text-[var(--red)] font-semibold' : 'text-[var(--text-muted)]'}`}>▼</button>
          <button className="py-0.5 px-1.5 rounded-sm border-none bg-transparent text-[var(--text-muted)] text-[11px] cursor-pointer">💬 Responder</button>
        </div>
      </div>
    </div>
  );
}

export default function CommentItem({ comment }: { comment: Comment }) {
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(comment.score || 0);
  const [vote, setVote] = useState<1 | -1 | 0>((comment as any).userVote || 0);

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
      const data = await ApiService.vote(comment.id, "comment", dir);
      setScore(data.score);
      setVote(data.user_vote || 0);
    } catch (err) {
      setScore(s => s - scoreDiff);
      setVote(vote);
    }
  };

  const isHidden = comment.hidden || score < -5;

  if (isHidden && !revealed) {
    return (
      <div className="py-3 px-3.5 border-b border-[var(--border)] flex gap-2.5 items-center">
        <div className="w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)] shrink-0">?</div>
        <div onClick={() => setRevealed(true)} className="bg-red-400/10 border border-red-400/25 rounded-md py-1.5 px-3 text-[13px] text-[var(--red)] flex items-center gap-1.5 cursor-pointer">
          ⚠️ Comentario oculto · puntuación {score} · Haz clic para ver
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-3 px-3.5 border-b border-[var(--border)] flex gap-2.5">
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: comment.avatarColor }}>
            {comment.initials}
          </div>
          <div className="w-[2px] flex-1 bg-[var(--border)] rounded-[1px] min-h-[12px]" />
        </div>

        <div className="flex-1">
          <div className="text-[11px] text-[var(--text-muted)] mb-1">
            <b className="text-[var(--text-secondary)] font-semibold">{comment.author}</b> · {comment.timeAgo} ·{" "}
            <span className={score < 0 ? 'text-[var(--red)]' : 'text-[var(--accent)]'}>{score > 0 ? `+${score}` : score}</span>
          </div>
          <div className={`text-[13px] leading-relaxed mb-2 ${isHidden ? 'text-[var(--text-muted)] opacity-70' : 'text-[var(--text-primary)]'}`}>
            {comment.body}
          </div>
          <div className="flex gap-0.5">
            <button onClick={() => cast(1)} className={`py-0.5 px-2 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === 1 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'}`}>▲ {score}</button>
            <button onClick={() => cast(-1)} className={`py-0.5 px-2 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === -1 ? 'text-[var(--red)] font-semibold' : 'text-[var(--text-muted)]'}`}>▼</button>
            <button className="py-0.5 px-2 rounded-sm border-none bg-transparent text-[var(--text-muted)] text-[11px] cursor-pointer">💬 Responder</button>
            <button className="py-0.5 px-2 rounded-sm border-none bg-transparent text-[var(--text-muted)] text-[11px] cursor-pointer">···</button>
          </div>
        </div>
      </div>

      {comment.replies.map(r => <ReplyItem key={r.id} reply={r} />)}
    </>
  );
}
