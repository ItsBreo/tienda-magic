import { useState, useEffect } from "react";
import { Post } from "./types";
import { CAT_LABELS } from "./constants";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { Trash2 } from "lucide-react"; 
// import DeleteConfirmDialog from "./DeleteConfirmDialog"; // Eliminado

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
    <div className="flex flex-col items-center py-2.5 px-2 bg-accent gap-1 min-w-[42px] border-r border-border/50">
      <button onClick={() => cast(1)} className={`w-6 h-6 border-none bg-transparent cursor-pointer rounded-sm text-sm font-black transition-colors ${vote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>▲</button>
      <span className={`text-[11px] font-black min-w-[20px] text-center ${score > 50 ? 'text-primary' : 'text-muted-foreground'}`}>{score}</span>
      <button onClick={() => cast(-1)} className={`w-6 h-6 border-none bg-transparent cursor-pointer rounded-sm text-sm font-black transition-colors ${vote === -1 ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>▼</button>
    </div>
  );
}

function ActionBtn({ label, onClick, active, variant = "default" }: { label: string | React.ReactNode; onClick?: () => void; active?: boolean; variant?: "default" | "danger" }) {
  const baseClasses = "flex items-center gap-1.5 py-1.5 px-3 rounded-md border-none bg-transparent text-xs cursor-pointer transition-all duration-150 font-bold uppercase tracking-tight";
  const variants = {
    default: `hover:bg-primary/10 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`,
    danger: "hover:bg-destructive/10 text-destructive",
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      {label}
    </button>
  );
}

export default function PostCard({ 
  post, 
  onOpen, 
  onDeleteSuccess,
  selection 
}: { 
  post: Post; 
  onOpen: () => void; 
  onDeleteSuccess?: () => void;
  selection?: {
    isSelected: boolean;
    toggle: () => void;
    isMod: boolean;
  }
}) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState((post as any).isSaved || false);

  useEffect(() => {
    setIsSaved((post as any).isSaved || false);
  }, [(post as any).isSaved]);

  const toggleSave = async () => {
    const newVal = !isSaved;
    setIsSaved(newVal);
    try {
      if (newVal) {
        await ApiService.saveThread(post.id);
        toast.success("Hilo guardado en favoritos");
      } else {
        await ApiService.unsaveThread(post.id);
        toast.success("Hilo quitado de favoritos");
      }
    } catch (err) {
      console.error("Error al guardar/quitar hilo:", err);
      setIsSaved(!newVal);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    try {
      await ApiService.deleteThread(post.id);
      toast.success("Publicación eliminada correctamente");
      onDeleteSuccess?.();
    } catch (err) {
      console.error("Error al eliminar hilo:", err);
      toast.error("No se pudo eliminar la publicación");
    }
  };

  const canSelect = selection?.isMod || post.can_delete;

  return (
    <div className={`flex bg-card border border-border rounded-xl mb-3 overflow-hidden transition-all duration-200 hover:border-primary/50 group shadow-md ${selection?.isSelected ? 'border-primary bg-primary/5' : ''}`}>
      {canSelect && (
        <div className="flex items-center px-3 bg-accent/40 border-r border-border">
          <input 
            type="checkbox" 
            checked={selection?.isSelected || false}
            onChange={(e) => {
              e.stopPropagation();
              selection?.toggle();
            }}
            className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}
      <VoteCol threadId={post.id} initialScore={post.score} initialVote={post.userVote} />

      <div className="py-3 px-4 flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2 flex-wrap min-w-0">
          <span className={`text-[10px] font-black py-0.5 px-2.5 rounded uppercase tracking-widest border shrink-0 ${
            post.category === 'noticias' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
            post.category === 'estrategia' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            post.category === 'torneos' ? 'bg-primary/10 text-primary border-primary/20' :
            'bg-muted text-muted-foreground border-border'
          }`}>
            {CAT_LABELS[post.category]}
          </span>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="text-[11px] text-muted-foreground shrink-0 uppercase font-bold tracking-tight">por</span>
            <b className="text-[11px] text-foreground font-black truncate leading-none">@{post.author}</b>
            <span className="shrink-0 text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-tighter" title="Reputación">{post.reputation || 100}✨</span>
            {post.isMod && <span className="text-[9px] font-black ml-1 bg-primary text-primary-foreground px-1 py-0.5 rounded">MOD</span>}
          </div>
          <span className="text-xs text-muted-foreground opacity-60">· {post.timeAgo}</span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <div onClick={onOpen} className="text-[17px] font-serif font-black text-foreground hover:text-primary mb-2 leading-tight cursor-pointer transition-colors duration-150 decoration-primary/20 hover:underline underline-offset-4">
              {post.title}
            </div>

            <div className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2 font-medium opacity-80">
              {post.preview}
            </div>
          </div>

          {post.image_url && (
            <div onClick={onOpen} className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-colors">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {post.tags.map(t => (
              <span key={t} className="text-[9px] py-0.5 px-2 rounded-md bg-accent text-muted-foreground border border-border font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-colors cursor-pointer">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-1 mt-auto border-t border-border pt-2 mx-[-4px]">
          <ActionBtn label={`💬 ${post.comments} comentarios`} onClick={onOpen} />
          <ActionBtn label="🔗 Compartir" />
          <ActionBtn label={isSaved ? "🔖 Guardado" : "🔖 Guardar"} onClick={toggleSave} active={isSaved} />
        </div>
      </div>
    </div>
  );
}
