import { useState, useEffect } from "react";
import { Post } from "./types";
import { CAT_LABELS } from "./constants";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const CAT_CLASS: Record<string, string> = {
  noticias:   "cat-noticias",
  estrategia: "cat-estrategia",
  torneos:    "cat-torneos",
  general:    "cat-general",
};

function VoteCol({ threadId, initialScore, initialVote = 0 }: { threadId: number; initialScore: number; initialVote?: number; }) {
  const [score, setScore] = useState(initialScore);
  const [vote,  setVote]  = useState<1 | -1 | 0>(initialVote as any);

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
      const data = await ApiService.vote(threadId, "thread", dir);
      setScore(data.score);
      setVote(data.user_vote || 0);
    } catch (err) {
      console.error("Error al votar", err);
      setScore(s => s - scoreDiff);
      setVote(vote);
    }
  };

  return (
    <div className="flex flex-col items-center py-2.5 px-2 bg-accent gap-1 min-w-[42px]">
      <button onClick={() => cast(1)} className={`w-6 h-6 border-none bg-transparent cursor-pointer rounded-sm text-sm ${vote === 1 ? 'text-primary' : 'text-muted-foreground'}`}>▲</button>
      <span className={`text-xs font-bold min-w-[20px] text-center ${score > 200 ? 'text-primary' : 'text-muted-foreground'}`}>{score}</span>
      <button onClick={() => cast(-1)} className={`w-6 h-6 border-none bg-transparent cursor-pointer rounded-sm text-sm ${vote === -1 ? 'text-destructive' : 'text-muted-foreground'}`}>▼</button>
    </div>
  );
}

function ActionBtn({ label, onClick, active, variant = "default" }: { label: string | React.ReactNode; onClick?: () => void; active?: boolean; variant?: "default" | "danger" }) {
  const baseClasses = "flex items-center gap-1.5 py-1 px-2 rounded border-none bg-transparent text-xs cursor-pointer transition-all duration-150";
  const variants = {
    default: `hover:bg-primary/10 hover:text-muted-foreground ${active ? 'text-primary font-semibold' : 'text-muted-foreground font-normal'}`,
    danger: "hover:bg-destructive/10 text-destructive font-normal",
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      {label}
    </button>
  );
}

export default function PostCard({ post, onOpen, onDeleteSuccess }: { post: Post; onOpen: () => void; onDeleteSuccess?: () => void }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState((post as any).isSaved || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = (post as any).can_delete || false;

  useEffect(() => {
    setIsSaved((post as any).isSaved || false);
  }, [(post as any).isSaved]);

  const toggleSave = async () => {
    const newVal = !isSaved;
    setIsSaved(newVal);
    try {
      if (newVal) {
        await ApiService.saveThread(post.id);
      } else {
        await ApiService.unsaveThread(post.id);
      }
    } catch (err) {
      console.error("Error al guardar/quitar hilo:", err);
      setIsSaved(!newVal);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await ApiService.deleteThread(post.id);
      toast.success("Post eliminado correctamente");
      setShowDeleteDialog(false);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err) {
      console.error("Error al eliminar post:", err);
      toast.error("No se pudo eliminar el post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex bg-card border border-border rounded-lg mb-2 overflow-hidden transition-colors duration-150 hover:border-muted group">
      <VoteCol threadId={post.id} initialScore={post.score} initialVote={post.userVote} />

      <div className="py-2.5 px-3.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className={`${CAT_CLASS[post.category]} text-[11px] font-semibold py-0.5 px-2 rounded-full tracking-wide`}>
            {CAT_LABELS[post.category]}
          </span>
          <span className="text-xs text-muted-foreground">
            por <b className="text-foreground font-semibold">{post.author}</b>
            {post.isMod && " 🛡️"}
          </span>
          <span className="text-xs text-muted-foreground">· {post.timeAgo}</span>
        </div>

        <div onClick={onOpen} className="text-[15px] font-semibold text-foreground hover:text-primary mb-1.5 leading-snug cursor-pointer transition-colors duration-150">
          {post.title}
        </div>

        <div className="text-[13px] text-muted-foreground mb-2 leading-relaxed line-clamp-2">
          {post.preview}
        </div>

        <div className="flex gap-1 mb-2 flex-wrap">
          {post.tags.map(t => (
            <span key={t} className="text-[11px] py-0.5 px-2 rounded-full bg-primary/10 text-muted-foreground border border-border cursor-pointer">
              {t}
            </span>
          ))}
        </div>

        <div className="flex gap-0.5 mt-auto">
          <ActionBtn label={`💬 ${post.comments} comentarios`} onClick={onOpen} />
          <ActionBtn label="🔗 Compartir" />
          <ActionBtn label={isSaved ? "🔖 Guardado" : "🔖 Guardar"} onClick={toggleSave} active={isSaved} />
          
          {canDelete && (
            <div className="ml-auto">
              <ActionBtn 
                label={<Trash2 size={14} />} 
                variant="danger" 
                onClick={handleDelete} 
              />
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar publicación?"
        description={`Estás a punto de eliminar "${post.title}". Esta acción es permanente y borrará todos los comentarios asociados.`}
      />
    </div>
  );
}
