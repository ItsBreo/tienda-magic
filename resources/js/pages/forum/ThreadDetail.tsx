import React, { useState } from 'react';
import { Post, Comment } from './types';
import CommentItem from './CommentItem';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, ArrowLeft, Edit2, Send, Loader2 } from 'lucide-react';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';

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
      onBack(); // Volver al feed
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
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-2xl">
      {/* Header con acciones */}
      <div className="p-4 bg-accent border-b border-border flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0">
            <ArrowLeft size={14} strokeWidth={3} /> Volver
          </button>
          <h2 className="font-serif font-black text-[16px] text-foreground truncate">{post.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-[11px] font-black text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-md uppercase tracking-wider transition-all"
            >
              <Edit2 size={12} /> Editar
            </button>
          )}
          {canDelete && (
            <button 
              onClick={handleDeleteThread}
              className="text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer px-2 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Cuerpo del Post */}
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-[12px] font-black text-primary-foreground shadow-lg shadow-primary/20">
            {(post.author || "U").substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black text-foreground leading-none">@{post.author}</span>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter" title="Reputación de usuario">
                {post.reputation || 100}✨
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">{post.timeAgo}</div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <input 
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-accent border border-border rounded-lg p-3 text-foreground font-bold outline-none focus:ring-1 focus:ring-primary text-base"
              placeholder="Título de la publicación"
            />
            <textarea 
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={8}
              className="w-full bg-accent border border-border rounded-lg p-4 text-foreground text-sm outline-none focus:ring-1 focus:ring-primary resize-y whitespace-pre-wrap leading-relaxed"
              placeholder="Escribe el contenido aquí..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="text-[12px] font-bold text-muted-foreground px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-accent transition-all cursor-pointer">Cancelar</button>
              <button onClick={handleUpdate} className="text-[12px] font-bold text-primary-foreground bg-primary px-6 py-2 rounded-lg border-none hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer">Guardar Cambios</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-serif font-black text-foreground mb-6 leading-tight decoration-primary/10 underline underline-offset-8 decoration-2">
              {post.title}
            </h1>
            {post.image_url && (
              <div className="mb-6 rounded-lg overflow-hidden border border-border max-w-full">
                <img src={post.image_url} alt={post.title} className="max-w-full h-auto block" />
              </div>
            )}

            <div className="text-[15px] text-foreground leading-loose whitespace-pre-wrap mb-7 opacity-90 font-medium">
              {post.body || post.preview}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {post.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-widest font-black bg-accent text-muted-foreground px-3 py-1 rounded-md border border-border hover:border-primary/50 transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Caja de Comentarios */}
      <div className="p-6 border-b border-border bg-accent/20">
        <div className="relative group">
          <textarea
            value={newCommentBody}
            onChange={e => setNewCommentBody(e.target.value)}
            placeholder="Escribe un comentario constructivo..."
            rows={3}
            className="w-full bg-card border border-border rounded-xl py-4 px-5 text-foreground text-sm font-medium resize-y outline-none focus:ring-1 focus:ring-primary transition-all mb-3 shadow-inner"
          />
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight italic">Recuerda seguir las normas del foro.</p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newCommentBody.trim()}
              className={`flex items-center gap-2 bg-primary text-primary-foreground border-none py-2 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all ${isSubmitting || !newCommentBody.trim() ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-primary/90 hover:translate-y-[-1px] active:translate-y-[0px] cursor-pointer'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={14} strokeWidth={3} /> Publicar</>}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Comentarios */}
      <div className="pb-8 relative">
        <div className="px-6 py-4 border-b border-border bg-accent/10">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Discusión ({comments.length})</h3>
        </div>
        
        {comments.length > 0 ? (
          comments.map(c => (
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
          ))
        ) : (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Cargando la conversación...</p>
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
              className: 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20'
            }
          ]}
        />
      </div>
    </div>
  );
}

