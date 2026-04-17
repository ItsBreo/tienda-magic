import { useState, useEffect } from "react";
import { Comment, Reply } from "./types";
import ApiService from "../../services/ApiService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Trash2, Edit2, MoreHorizontal, MessageSquare, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/UserAvatar";

interface CommentSelection {
  isSelected: (id: number) => boolean;
  toggle: (id: number) => void;
  isMod: boolean;
}

function CommentBox({
  initialBody = '',
  onCancel,
  onSubmit,
  placeholder = 'Escribe tu respuesta...',
}: {
  initialBody?: string;
  onCancel: () => void;
  onSubmit: (body: string) => void;
  placeholder?: string;
}) {
  const [body, setBody] = useState(initialBody);

  return (
    <div className="mt-3 mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-accent/50 border border-border/60 rounded-xl py-3 px-4 text-foreground text-[13px] resize-y outline-none focus:border-primary/50 transition-all font-literata shadow-inner"
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-accent rounded-lg"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => onSubmit(body)}
          disabled={!body.trim()}
          className="h-8 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground rounded-lg px-4 shadow-lg shadow-primary/10"
        >
          Responder
        </Button>
      </div>
    </div>
  );
}

function UniversalComment({
  item,
  forumId,
  depth = 0,
  onDelete,
  onReplySubmit,
  selection,
}: {
  item: Comment | Reply;
  forumId: number;
  depth?: number;
  onDelete: (id: number) => void;
  onReplySubmit?: (body: string, parentId?: number) => void;
  selection?: CommentSelection;
}) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(item.score || 0);
  const [vote, setVote] = useState<1 | -1 | 0>((item as any).userVote || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(item.body || '');
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setScore(item.score || 0);
    setVote((item as any).userVote || 0);
  }, [item.score, (item as any).userVote]);

  const canDelete = (item as any).can_delete || false;
  const canEdit = (item as any).can_edit || (user?.id === item.author_id) || false;

  const handleUpdate = async () => {
    try {
      await ApiService.axiosInstance.put(`/api/comments/${item.id}`, { body: editBody });
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      toast.error('Error al actualizar');
    }
  };

  const cast = async (dir: 1 | -1) => {
    const newVote = vote === dir ? 0 : dir;
    const scoreDiff = newVote - vote;
    setScore((s) => s + scoreDiff);
    setVote(newVote);
    try {
      const data = await ApiService.vote(item.id, 'comment', dir);
      setScore(data.score);
      setVote(data.user_vote || 0);
    } catch (err) {
      setScore((s) => s - scoreDiff);
      setVote(vote);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await ApiService.deleteComment(item.id);
      setShowDeleteDialog(false);
      onDelete(item.id);
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const isHidden = (item as any).is_hidden || (item as any).hidden || score < -5;

  if (isHidden && !revealed) {
    return (
      <div className={`py-3 px-4 border-b border-border/30 flex gap-3 items-center ${depth > 0 ? 'ml-6 md:ml-12 border-l border-border/60' : ''}`}>
        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-muted-foreground">?</div>
        <div onClick={() => setRevealed(true)} className="bg-destructive/10 border border-destructive/20 rounded-xl py-2 px-4 text-xs text-destructive flex items-center gap-2 cursor-pointer hover:bg-destructive/20 transition-colors">
          <AlertCircle size={14} />
{' '}
Comentario oculto · puntuación
{score}
{' '}
· Haz clic para ver
</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`py-4 px-4 border-b border-border/30 transition-all group ${selection?.isSelected(item.id) ? 'bg-primary/5' : ''} ${depth > 0 ? 'ml-6 md:ml-12 border-l border-border/60 bg-accent/5' : ''}`}>

        {/* Nivel de anidación superior con línea visual */}
        {depth > 0 && (
          <div className="absolute left-[-1px] top-0 bottom-0 w-[1px] bg-border/60" />
        )}

        <div className="flex gap-4">
          {selection?.isMod && (
            <div className="flex items-start pt-1">
              <input
                type="checkbox"
                checked={selection.isSelected(item.id)}
                onChange={() => selection.toggle(item.id)}
                className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary cursor-pointer mt-1"
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <UserAvatar 
              src={item.avatar_url}
              name={item.author}
              initials={item.initials}
              className="w-8 h-8 rounded-xl shadow-sm ring-2 ring-background ring-offset-1"
              imageClassName="object-cover"
              fallbackClassName="text-[10px] text-white font-black"
            />
            {item.replies && item.replies.length > 0 && !isEditing && (
              <div className="w-[1px] flex-1 bg-border/40 rounded-full" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-black text-foreground">
@
{item.author}
</span>
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shadow-sm" title="Reputación">{item.reputation || 100}</span>
              <span className="text-[10px] text-muted-foreground/50">
·
{item.timeAgo}
</span>
            </div>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full bg-accent border border-border rounded-xl p-4 text-foreground text-sm font-literata outline-none focus:ring-1 focus:ring-primary mb-3"
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(false)} className="h-8 text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                  <Button onClick={handleUpdate} className="h-8 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/10">Guardar</Button>
                </div>
              </div>
            ) : (
              <div className={`text-[14px] leading-relaxed mb-3 font-literata ${isHidden ? 'text-muted-foreground opacity-70' : 'text-foreground/90'}`}>
                {item.body}
              </div>
            )}

            <div className="flex gap-4 items-center">
                <button 
                    onClick={() => cast(1)} 
                    className={`h-7 px-3 rounded-md transition-all flex items-center gap-1.5 text-[11px] font-black tracking-tight ${vote === 1 ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ChevronUp size={14} strokeWidth={3} /> {score > 0 ? `+${score}` : score}
                </button>
                <button 
                    onClick={() => cast(-1)} 
                    className={`h-7 px-2 rounded-md transition-all flex items-center justify-center ${vote === -1 ? 'bg-background text-destructive shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ChevronDown size={14} strokeWidth={3} />
                </button>

              <button
                  onClick={() => {
                    setIsReplying(!isReplying);
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                <MessageSquare size={13} strokeWidth={3} />
                Responder
              </button>

              {(canDelete || canEdit) && (
                <div className="relative ml-auto" onMouseLeave={() => setShowOptions(false)}>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-all"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 bottom-full mb-1 w-32 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                      {canEdit && (
                        <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground hover:bg-accent w-full text-left">
                          <Edit2 size={12} />
{' '}
Editar
</button>
                      )}
                      {canDelete && (
                        <button onClick={() => { setShowDeleteDialog(true); setShowOptions(false); }} className="flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 w-full text-left">
                          <Trash2 size={12} />
{' '}
Eliminar
</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isReplying && (
              <CommentBox
                initialBody={`@${item.author} `}
                onCancel={() => setIsReplying(false)}
                onSubmit={(body) => {
                  if (onReplySubmit) onReplySubmit(body, item.id);
                  setIsReplying(false);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar comentario?"
        description="Esta acción no se puede deshacer."
      />

      {/* Renderizado recursivo de hijos */}
      {item.replies && item.replies.length > 0 && (
        <div className="relative">
          {item.replies.map((r) => (
            <UniversalComment
              key={r.id}
              item={r}
              forumId={forumId}
              depth={depth + 1}
              onDelete={onDelete}
              onReplySubmit={onReplySubmit}
              selection={selection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentItem({
  comment,
  forumId,
  onDelete,
  onReplySubmit,
  selection,
}: {
  comment: Comment;
  forumId: number;
  onDelete: (id: number) => void,
  onReplySubmit?: (body: string, parentId?: number) => void;
  selection?: CommentSelection;
}) {
  return (
    <UniversalComment
      item={comment}
      forumId={forumId}
      depth={0}
      onDelete={onDelete}
      onReplySubmit={onReplySubmit}
      selection={selection}
    />
  );
}
