import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, MessageSquare, Bookmark, Share2, Flame, ChevronUp, ChevronDown } from "lucide-react"; 
import { Post } from "./types";
import { CAT_LABELS } from "./constants";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/common/UserAvatar";

const CAT_COLORS: Record<string, string> = {
  noticias: 'bg-primary/10 text-primary border-primary/20',
  estrategia: 'bg-primary/10 text-primary border-primary/20',
  torneos: 'bg-primary/10 text-primary border-primary/20',
  general: 'bg-primary/10 text-primary border-primary/20',
};

function VoteCol({ threadId, initialScore, initialVote = 0 }: { threadId: number; initialScore: number; initialVote?: number; }) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState<1 | -1 | 0>(initialVote as any);

  useEffect(() => {
    setScore(initialScore);
    setVote(initialVote as any);
  }, [initialScore, initialVote]);

  const cast = async (dir: 1 | -1) => {
    const newVote = vote === dir ? 0 : dir;
    const scoreDiff = newVote - vote;
    setScore((s) => s + scoreDiff);
    setVote(newVote);
    try {
      const data = await ApiService.vote(threadId, 'thread', dir);
      setScore(data.score);
      setVote(data.user_vote || 0);
    } catch (err) {
      console.error('Error al votar', err);
      setScore((s) => s - scoreDiff);
      setVote(vote);
    }
  };

  return (
    <div className="flex flex-col items-center py-4 px-2 bg-zinc-50 dark:bg-zinc-900/50 gap-1.5 min-w-[50px] border-r border-border/50">
      <button 
        onClick={() => cast(1)} 
        className={cn(
            'w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90',
            vote === 1 ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
      >
        <ChevronUp size={18} strokeWidth={3} />
      </button>
      <span className={cn(
          'text-[12px] font-black font-forum text-center tabular-nums',
          score > 50 ? 'text-primary' : 'text-muted-foreground',
      )}>
{score}
</span>
      <button
        onClick={() => cast(-1)}
        className={cn(
            'w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90',
            vote === -1 ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
      >
        <ChevronDown size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

function ActionBtn({
 label, icon: Icon, onClick, active, variant = 'default',
}: { label: string; icon: any; onClick?: (e: React.MouseEvent) => void; active?: boolean; variant?: 'default' | 'danger' }) {
  return (
    <button
        onClick={onClick}
        className={cn(
            'flex items-center gap-2 py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 group font-montserrat',
            variant === 'danger'
                ? 'text-destructive hover:bg-destructive/10'
                : active
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-accent',
        )}
    >
      <Icon size={14} className={cn('transition-transform group-hover:scale-110', active && 'fill-current')} />
      {label}
    </button>
  );
}

export default function PostCard({
  post,
  onOpen,
  onDeleteSuccess,
  selection,
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
        toast.success('Hilo guardado en favoritos');
      } else {
        await ApiService.unsaveThread(post.id);
        toast.success('Hilo quitado de favoritos');
      }
    } catch (err) {
      console.error('Error al guardar/quitar hilo:', err);
      setIsSaved(!newVal);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/forum/threads/${post.id}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('¡Enlace copiado al portapapeles!', {
            description: 'Ya puedes compartir este hilo con otros magos.',
        });
    }).catch(() => {
        toast.error('No se pudo copiar el enlace.');
    });
  };

  const canSelect = selection?.isMod || post.can_delete;

  return (
    <div className={cn(
        "flex bg-card border border-border rounded-xl mb-4 overflow-hidden transition-all duration-300 group shadow-md min-h-[160px]",
        selection?.isSelected ? 'ring-2 ring-primary border-primary bg-primary/[0.03]' : 'hover:border-primary/40 hover:shadow-primary/5 hover:-translate-y-0.5'
    )}>
      {canSelect && (
        <div className="flex items-center px-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-r border-border/50">
          <input 
            type="checkbox" 
            checked={selection?.isSelected || false}
            onChange={(e) => {
              e.stopPropagation();
              selection?.toggle();
            }}
            className="w-5 h-5 rounded-lg border-border bg-background text-primary focus:ring-primary cursor-pointer transition-all"
          />
        </div>
      )}

      <VoteCol threadId={post.id} initialScore={post.score} initialVote={post.userVote} />

      <div className="py-5 px-6 flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap font-montserrat overflow-hidden">
            <span className={cn(
                'text-[8px] font-black py-1 px-3 rounded-lg uppercase tracking-widest border shrink-0 w-24 text-center',
                CAT_COLORS[post.category] || 'bg-primary/10 text-primary border-primary/20',
            )}>
                {CAT_LABELS[post.category]}
            </span>
            <div className="flex items-center gap-2">
              <UserAvatar 
                src={post.avatar_url}
                name={post.author}
                className="w-5 h-5 rounded-md bg-accent border border-border/50"
                fallbackClassName="text-[10px] text-muted-foreground"
              />
              <b className="text-[11px] text-foreground font-black truncate leading-none hover:text-primary transition-colors cursor-pointer">@{post.author}</b>
            </div>
            
            <Badge variant="outline" className="text-[9px] font-black text-primary bg-primary/5 border-primary/10 px-2 py-0 h-5" title="Reputación">
                {post.reputation || 100} EP
            </Badge>
            {post.isMod && <Badge className="bg-primary text-primary-foreground text-[8px] font-black h-4 px-1">MOD</Badge>}
            
            <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest font-montserrat">
              · {post.timeAgo}
            </span>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
                <h3 onClick={() => onOpen()} className="text-xl font-forum font-bold text-foreground hover:text-primary transition-colors cursor-pointer leading-[1.2] mb-3 line-clamp-2">
                    {post.title}
                </h3>
                <p className="text-sm text-muted-foreground font-literata italic leading-relaxed line-clamp-2 opacity-80 mb-4">
                    {post.preview}
                </p>
            </div>
            {post.image_url && (
                <div onClick={() => onOpen()} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-border cursor-pointer group-hover:border-primary/50 transition-all shadow-sm">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
            {post.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {post.tags.map((t) => (
                        <span key={t} className="text-[8px] py-1 px-2.5 rounded-lg bg-accent/50 text-muted-foreground/60 border border-border/50 font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-colors cursor-pointer font-montserrat">
                            #{t}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-1 border-t border-border/40 pt-1 -mx-2">
                <ActionBtn icon={MessageSquare} label={`${post.comments}`} onClick={() => onOpen()} />
                <ActionBtn icon={Share2} label="Share" onClick={handleShare} />
                <ActionBtn icon={Bookmark} label={isSaved ? "Saved" : "Save"} onClick={toggleSave} active={isSaved} />
                {post.can_delete && !selection && (
                    <div className="ml-auto">
                        <ActionBtn icon={Trash2} label="" onClick={(e) => { e.stopPropagation(); if(window.confirm('¿Seguro?')) ApiService.deleteThread(post.id).then(() => onDeleteSuccess?.()); }} variant="danger" />
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
