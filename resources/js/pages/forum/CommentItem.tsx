import { useState, useEffect } from "react";
import { Comment, Reply } from "./types";
import ApiService from "../../services/ApiService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Trash2, Edit2, MoreHorizontal } from "lucide-react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

function ReplyItem({ 
  reply, 
  forumId, 
  onDelete, 
  onReplyTo,
  selection
}: { 
  reply: Reply; 
  forumId: number; 
  onDelete: (id: number) => void; 
  onReplyTo: (author: string) => void;
  selection?: {
    isSelected: (id: number) => boolean;
    toggle: (id: number) => void;
    isMod: boolean;
  }
}) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(reply.score || 0);
  const [vote, setVote] = useState<1 | -1 | 0>((reply as any).userVote || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setScore(reply.score || 0);
    setVote((reply as any).userVote || 0);
  }, [reply.score, (reply as any).userVote]);

  const canDelete = (reply as any).can_delete || false;

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

  const handleDelete = async () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await ApiService.deleteComment(reply.id);
      toast.success("Respuesta eliminada");
      setShowDeleteDialog(false);
      onDelete(reply.id);
    } catch (err) {
      toast.error("Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  const isHidden = reply.hidden || score < -5;

  if (isHidden && !revealed) {
    return (
      <div className="py-2 pl-8 pr-3.5 border-b border-border flex gap-2.5 items-center">
        <div className="w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0">?</div>
        <div onClick={() => setRevealed(true)} className="bg-destructive/10 border border-destructive/25 rounded-md py-1.5 px-3 text-xs text-destructive flex items-center gap-1.5 cursor-pointer">
          ⚠️ Comentario oculto · puntuación {score} · Haz clic para ver
        </div>
      </div>
    );
  }

  return (
    <div className={`py-2 pl-4 pr-3.5 border-b border-border flex gap-2.5 transition-colors group ${selection?.isSelected(reply.id) ? 'bg-primary/5 border-l-2 border-l-primary' : 'bg-card/30'}`}>
      {selection?.isMod && (
        <div className="flex items-center pl-2">
          <input 
            type="checkbox" 
            checked={selection.isSelected(reply.id)}
            onChange={() => selection.toggle(reply.id)}
            className="w-3.5 h-3.5 rounded border-border bg-accent text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}
      <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ background: reply.avatarColor }}>
        {reply.initials}
      </div>

      <div className="flex-1">
        <div className="text-[11px] text-muted-foreground mb-1">
          <b className="text-foreground font-semibold">{reply.author}</b>
          <span className="ml-1 mr-1 text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded shadow-sm" title="Reputación">{reply.reputation || 100}✨</span>
          · {reply.timeAgo} ·{" "}
          <span className={score < 0 ? 'text-destructive' : 'text-primary'}>{score > 0 ? `+${score}` : score}</span>
        </div>
        <div className={`text-[13px] leading-relaxed mb-1.5 ${isHidden ? 'text-muted-foreground opacity-70' : 'text-foreground'}`}>
          {reply.body}
        </div>
        <div className="flex gap-0.5 items-center">
          <button onClick={() => cast(1)} className={`py-0.5 px-1.5 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>▲ {score}</button>
          <button onClick={() => cast(-1)} className={`py-0.5 px-1.5 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === -1 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>▼</button>
          <button onClick={() => onReplyTo(reply.author)} className="py-0.5 px-1.5 rounded-sm border-none bg-transparent text-muted-foreground hover:text-foreground transition-colors text-[11px] cursor-pointer">💬 Responder</button>
          {canDelete && (
            <div className="relative ml-auto" onMouseLeave={() => setShowOptions(false)}>
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="opacity-0 group-hover:opacity-100 py-0.5 px-2 rounded-sm border-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent text-[11px] cursor-pointer transition-opacity"
              >
                <MoreHorizontal size={14} />
              </button>
              {showOptions && (
                <div className="absolute right-0 bottom-full w-28 bg-card border border-border rounded shadow-lg overflow-hidden z-20 flex flex-col">
                  {canDelete && (
                    <button onClick={() => { handleDelete(); setShowOptions(false); }} className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 border-none bg-transparent cursor-pointer text-left">
                      <Trash2 size={12} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar respuesta?"
        description="Esta respuesta se borrará permanentemente."
      />
    </div>
  );
}

export default function CommentItem({ 
  comment, 
  forumId, 
  onDelete, 
  onReplySubmit,
  selection
}: { 
  comment: Comment; 
  forumId: number; 
  onDelete: (id: number) => void, 
  onReplySubmit?: (body: string, parentId?: number) => void;
  selection?: {
    isSelected: (id: number) => boolean;
    toggle: (id: number) => void;
    isMod: boolean;
  }
}) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(comment.score || 0);
  const [vote, setVote] = useState<1 | -1 | 0>((comment as any).userVote || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const handleReplyClick = (authorName?: string) => {
    setIsReplying(!isReplying);
    if (authorName) {
      setIsReplying(true);
      setReplyBody(`@${authorName} `);
    } else {
      setReplyBody("");
    }
  };

  const handleSubmitReply = () => {
    if (!replyBody.trim() || !onReplySubmit) return;
    onReplySubmit(replyBody, comment.id);
    setIsReplying(false);
    setReplyBody("");
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body || "");

  const canDelete = (comment as any).can_delete || false;
  const canEdit = (comment as any).can_edit || (user?.id === comment.author_id) || false;

  const handleUpdate = async () => {
    try {
      await ApiService.axiosInstance.put(`/api/comments/${comment.id}`, { body: editBody });
      toast.success("Comentario actualizado");
      setIsEditing(false);
      window.location.reload(); 
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

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

  const handleDelete = async () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await ApiService.deleteComment(comment.id);
      toast.success("Comentario eliminado");
      setShowDeleteDialog(false);
      onDelete(comment.id);
    } catch (err) {
      toast.error("Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  const isHidden = (comment as any).is_hidden || (comment as any).hidden || score < -5;

  if (isHidden && !revealed) {
    return (
      <div className="py-3 px-3.5 border-b border-border flex gap-2.5 items-center">
        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">?</div>
        <div onClick={() => setRevealed(true)} className="bg-destructive/10 border border-destructive/25 rounded-md py-1.5 px-3 text-[13px] text-destructive flex items-center gap-1.5 cursor-pointer">
          ⚠️ Comentario oculto · puntuación {score} · Haz clic para ver
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`py-3 px-3.5 border-b border-border flex gap-2.5 transition-colors group ${selection?.isSelected(comment.id) ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
        {selection?.isMod && (
          <div className="flex items-center">
            <input 
              type="checkbox" 
              checked={selection.isSelected(comment.id)}
              onChange={() => selection.toggle(comment.id)}
              className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: comment.avatarColor }}>
            {comment.initials}
          </div>
          <div className="w-[2px] flex-1 bg-border rounded-[1px] min-h-[12px]" />
        </div>

        <div className="flex-1">
          <div className="text-[11px] text-muted-foreground mb-1">
            <b className="text-foreground font-semibold">{comment.author}</b>
            <span className="ml-1 mr-1 text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded shadow-sm" title="Reputación">{comment.reputation || 100}✨</span>
            · {comment.timeAgo} ·{" "}
            <span className={score < 0 ? 'text-destructive' : 'text-primary'}>{score > 0 ? `+${score}` : score}</span>
          </div>
          <div className={`text-[13px] leading-relaxed mb-2 ${isHidden ? 'text-muted-foreground opacity-70' : 'text-foreground'}`}>
            {comment.body}
          </div>
          <div className="flex gap-0.5 items-center">
            <button onClick={() => cast(1)} className={`py-0.5 px-2 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>▲ {score}</button>
            <button onClick={() => cast(-1)} className={`py-0.5 px-2 rounded-sm border-none bg-transparent text-[11px] cursor-pointer ${vote === -1 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>▼</button>
            <button onClick={() => handleReplyClick()} className="py-0.5 px-2 rounded-sm border-none bg-transparent text-muted-foreground hover:text-foreground transition-colors text-[11px] cursor-pointer">💬 Responder</button>
            {(canDelete || canEdit) && (
              <div className="relative ml-auto" onMouseLeave={() => setShowOptions(false)}>
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="py-0.5 px-2 rounded-sm border-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent text-[11px] cursor-pointer transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>
                {showOptions && (
                  <div className="absolute right-0 bottom-full w-28 bg-card border border-border rounded shadow-lg overflow-hidden z-20 flex flex-col">
                    {canEdit && (
                      <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-foreground hover:bg-accent border-none bg-transparent cursor-pointer text-left">
                        <Edit2 size={12} /> Editar
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => { handleDelete(); setShowOptions(false); }} className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 border-none bg-transparent cursor-pointer text-left">
                        <Trash2 size={12} /> Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isReplying && (
            <div className="mt-2 pl-2">
              <textarea
                autoFocus
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={2}
                className="w-full bg-accent border border-border rounded-md py-1.5 px-2.5 text-foreground text-[12px] resize-y outline-none focus:border-primary transition-colors mb-1.5"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsReplying(false)}
                  className="bg-transparent border border-border py-1 px-2.5 rounded text-[11px] text-muted-foreground hover:bg-accent cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyBody.trim()}
                  className={`bg-primary text-primary-foreground border-none py-1 px-2.5 rounded text-[11px] font-semibold ${!replyBody.trim() ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary/90 cursor-pointer'}`}
                >
                  Responder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar comentario?"
        description="Se eliminará el comentario y todas sus respuestas de forma permanente."
      />

      {comment.replies.map(r => <ReplyItem key={r.id} reply={r} forumId={forumId} onDelete={onDelete} onReplyTo={handleReplyClick} selection={selection} />)}
    </>
  );
}
