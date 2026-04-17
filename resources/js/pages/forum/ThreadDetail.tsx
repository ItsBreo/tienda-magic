import React, { useState } from 'react';
import { Post, Comment } from './types';
import CommentItem from './CommentItem';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, ArrowLeft, Edit2, Send, Loader2, Bookmark, Share2 } from 'lucide-react';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThreadDetailViewProps {
  post: Post;
  comments: Comment[];
  isSubmitting: boolean;
  onBack: () => void;
  onCommentSubmit: (body: string, parentId?: number) => void;
}

export default function ThreadDetailView({ post, comments, isSubmitting, onBack, onCommentSubmit }: ThreadDetailViewProps) {
  const { user } = useAuth();
  const [newCommentBody, setNewCommentBody] = useState("");

  const canDelete = post.can_delete || false;
  const canEdit = post.can_edit || false;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editBody, setEditBody] = useState(post.body || "");

  const allCommentsFlat = comments.flatMap(c => [c, ...(c.replies || [])]);
  
  const {
    selectedList,
    selectedCount,
    toggle,
    clear,
    isSelected
  } = useSelection(allCommentsFlat);

  const isModOrAdmin = user?.is_admin || (user as any)?.all_permissions?.includes('moderate-forum');

  const handleSubmit = () => {
    if (!newCommentBody.trim()) return;
    onCommentSubmit(newCommentBody);
    setNewCommentBody("");
  };

  const handleUpdate = async () => {
    try {
      await ApiService.updateThread(post.id, { title: editTitle, body: editBody });
      toast.success("Publicación actualizada correctamente");
      setIsEditing(false);
      window.location.reload(); 
    } catch (err) {
      toast.error("Error al actualizar la publicación");
    }
  };

  const handleDeleteThread = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este hilo permanentemente?")) return;
    try {
      await ApiService.deleteThread(post.id);
      toast.success("Hilo eliminado correctamente");
      onBack(); 
    } catch (err) {
      console.error("Error al eliminar hilo:", err);
      toast.error("No se pudo eliminar el hilo");
    }
  };

  const handleCommentDelete = (commentId: number) => {
    window.location.reload(); 
  };

  const handleBulkDeleteComments = async () => {
    if (!window.confirm(`¿Seguro que deseas eliminar ${selectedCount} comentarios/respuestas?`)) return;
    try {
      const { data } = await ApiService.axiosInstance.post('/api/mod/comments/bulk-delete', { ids: selectedList });
      toast.success(data.message);
      clear();
      window.location.reload();
    } catch (error) {
      toast.error('Error al realizar borrado masivo de comentarios');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-2xl shadow-black/10">
      <div className="p-4 bg-accent/40 border-b border-border flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group font-montserrat">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Volver al Feed
          </button>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <Button 
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-8 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg px-3"
            >
              <Edit2 size={12} className="mr-1.5" /> Editar
            </Button>
          )}
          {canDelete && (
            <Button 
                variant="ghost"
                onClick={handleDeleteThread}
                className="h-8 text-[9px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 rounded-lg px-3"
            >
              <Trash2 size={12} className="mr-1.5" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="p-8 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[14px] font-black text-primary shadow-sm">
                {(post.author || "U").substring(0, 2).toUpperCase()}
            </div>
            <div>
                <div className="flex items-center gap-3 mb-1 font-montserrat">
                    <span className="text-sm font-black text-foreground uppercase tracking-tight">@{post.author}</span>
                    <Badge variant="outline" className="text-[9px] font-black text-primary bg-primary/5 border-primary/10 px-2 py-0 h-5 uppercase tracking-widest">
                        {post.reputation || 100} EP
                    </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.1em] font-montserrat">{post.timeAgo}</div>
            </div>
            <div className="ml-auto flex gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-accent/30 border-border/50 text-muted-foreground hover:text-primary">
                    <Bookmark size={16} />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-accent/30 border-border/50 text-muted-foreground hover:text-primary">
                    <Share2 size={16} />
                </Button>
            </div>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <input 
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-accent border border-border/50 rounded-xl p-4 text-foreground font-forum font-black outline-none focus:ring-1 focus:ring-primary text-2xl shadow-inner"
              placeholder="Título de la publicación"
            />
            <textarea 
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={10}
              className="w-full bg-accent border border-border/50 rounded-xl p-5 text-foreground text-base font-literata outline-none focus:ring-1 focus:ring-primary resize-y leading-relaxed shadow-inner"
              placeholder="Escribe el contenido aquí..."
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setIsEditing(false)} variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] px-6 h-11 rounded-xl">Cancelar</Button>
              <Button onClick={handleUpdate} className="text-[10px] font-black uppercase tracking-[0.2em] px-8 h-11 rounded-xl bg-primary shadow-xl shadow-primary/20">Guardar Cambios</Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-forum font-black text-foreground mb-8 leading-[1.1] tracking-tight">
              {post.title}
            </h1>
            
            {post.image_url && (
              <div className="mb-8 rounded-2xl overflow-hidden border border-border/50 shadow-2xl relative group">
                <img src={post.image_url} alt={post.title} className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            )}

            <div className="text-[17px] text-foreground/90 font-literata leading-[1.8] whitespace-pre-wrap mb-10 italic">
              {post.body || post.preview}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-6 border-t border-border/30">
                {post.tags.map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-[0.2em] font-black bg-accent/40 text-muted-foreground/60 px-3.5 py-1.5 rounded-lg border border-border/30 hover:border-primary/50 hover:text-primary transition-all cursor-pointer font-montserrat">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-8 bg-accent/10">
        <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] font-montserrat">La Conversación</h3>
        </div>
        <div className="relative">
          <textarea
            value={newCommentBody}
            onChange={e => setNewCommentBody(e.target.value)}
            placeholder="¿Qué piensas al respecto? Deja tu huella..."
            rows={4}
            className="w-full bg-card border border-border/50 rounded-2xl py-5 px-6 text-foreground text-sm font-literata resize-none outline-none focus:ring-1 focus:ring-primary transition-all mb-4 shadow-xl shadow-black/5"
          />
          <div className="flex justify-between items-center px-2">
            <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.1em] font-montserrat italic max-w-xs">
              Tu palabra tiene peso. Sé respetuoso con el resto de Caminantes.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newCommentBody.trim()}
              className={cn(
                  "bg-primary text-primary-foreground h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95",
                  (isSubmitting || !newCommentBody.trim()) && "opacity-40 grayscale"
              )}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={14} className="mr-2" strokeWidth={3} /> Publicar</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="pb-12">
        <div className="px-8 py-4 border-b border-border/30 bg-accent/5 flex items-center justify-between">
          <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] font-montserrat">Comentarios ({comments.length})</span>
        </div>
        
        {comments.length > 0 ? (
          <div className="divide-y divide-border/20">
            {comments.map(c => (
              <CommentItem 
                key={c.id} 
                comment={c} 
                forumId={post.forum_id} 
                onDelete={handleCommentDelete} 
                onReplySubmit={onCommentSubmit}
                selection={{
                  isSelected: (id: number) => isSelected(id),
                  toggle: (id: number) => toggle(id),
                  isMod: isModOrAdmin
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-20 text-center opacity-40">
            <div className="text-4xl mb-4">📜</div>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] font-montserrat">El silencio reina aquí...</p>
          </div>
        )}

        <BulkActionsToolbar
          count={selectedCount}
          onClear={clear}
          actions={[
            {
              label: 'Eliminar Selección',
              icon: <Trash2 className="w-4 h-4" />,
              onClick: handleBulkDeleteComments,
              variant: 'destructive',
              className: 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 rounded-xl'
            }
          ]}
        />
      </div>
    </div>
  );
}
