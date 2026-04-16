import React, { useState } from 'react';
import { Post, Comment } from './types';
import CommentItem from './CommentItem';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import DeleteConfirmDialog from './DeleteConfirmDialog';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = (post as any).can_delete || false;
  const canEdit = (post as any).can_edit || false;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editBody, setEditBody] = useState(post.body || "");

  const handleSubmit = () => {
    if (!newCommentBody.trim()) return;
    onCommentSubmit(newCommentBody);
    setNewCommentBody("");
  };

  const handleUpdate = async () => {
    try {
      await ApiService.updateThread(post.id, { title: editTitle, body: editBody });
      toast.success("Publicación actualizada");
      setIsEditing(false);
      window.location.reload(); 
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await ApiService.deleteThread(post.id);
      toast.success("Hilo eliminado");
      setShowDeleteDialog(false);
      onBack();
    } catch (err) {
      toast.error("Error al eliminar el hilo");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentDelete = (commentId: number) => {
    // Al borrar un comentario no expulsamos al usuario, solo quitamos el comentario de la lista
    const removeComment = (commentsList: Comment[]): Comment[] => {
      // Intentar remover el comentario de la lista principal
      const filtered = commentsList.filter(c => c.id !== commentId);
      
      // Si el tamaño no cambió, quizás es una respuesta (reply) hija
      if (filtered.length === commentsList.length) {
        return filtered.map(c => {
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.filter((r: any) => r.id !== commentId)
            };
          }
          return c;
        });
      }
      return filtered;
    };
    
    // Asumimos que podemos disparar onBack pero como un re-fetch.
    // Dado que dependemos del setComments que está fuera de aquí (probablemente en la página superior),
    // si no lo tenemos podemos simplemente mutar para ocultarlo o lanzar onError.
    // Lo más recomendable es recargar sin onBack o implementar la mutación si nos pasan onDelete.
    // Temporalmente: Notificamos arriba pero no retrocedemos, si no hay setter, lanzamos refresh
    window.location.reload(); 
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden flex flex-col">
      {/* Header con acciones */}
      <div className="p-4 bg-[var(--surface-2)] border-b border-[var(--border)] flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs text-[var(--text-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-md bg-transparent hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0">
            ← Volver
          </button>
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)] truncate">{post.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-[var(--accent)] hover:underline bg-transparent border-none cursor-pointer px-2"
            >
              Editar
            </button>
          )}
          {canDelete && (
            <button 
              onClick={handleDelete}
              className="p-1.5 text-[var(--red)] hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
              title="Eliminar hilo"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Cuerpo del Post */}
      <div className="p-5 border-b border-[var(--border)] bg-[var(--surface)] font-inter">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            {(post.author || "U").substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[12px] font-bold text-[var(--text-primary)] leading-none mb-1">{post.author}</div>
            <div className="text-[10px] text-[var(--text-secondary)] leading-none">{post.timeAgo}</div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <input 
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2 text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)] text-sm"
              placeholder="Título"
            />
            <textarea 
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={8}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-3 text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] resize-y whitespace-pre-wrap"
              placeholder="Contenido..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="text-[11px] text-[var(--text-secondary)] px-3 py-1.5 rounded-md border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] cursor-pointer">Cancelar</button>
              <button onClick={handleUpdate} className="text-[11px] font-bold text-white bg-[var(--accent)] px-4 py-1.5 rounded-md border-none hover:brightness-110 cursor-pointer">Guardar cambios</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="text-[14px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap mb-5">
              {post.body || post.preview}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-wider font-bold bg-[var(--surface-2)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-b border-[var(--border)]">
        <textarea
          value={newCommentBody}
          onChange={e => setNewCommentBody(e.target.value)}
          placeholder="Añade un comentario…"
          rows={3}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md py-2.5 px-3.5 text-[var(--text-primary)] text-[13px] resize-y outline-none focus:border-[var(--accent)] transition-colors mb-2"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !newCommentBody.trim()}
            className={`bg-[var(--accent)] text-white border-none py-1.5 px-3.5 rounded-md text-[13px] font-semibold transition-colors ${isSubmitting || !newCommentBody.trim() ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[var(--accent-hover)] cursor-pointer'}`}
          >
            {isSubmitting ? "Enviando..." : "Comentar"}
          </button>
        </div>
      </div>

      <div className="pb-4">
        {comments.length > 0 ? (
          comments.map(c => <CommentItem key={c.id} comment={c} forumId={post.forum_id} onDelete={handleCommentDelete} onReplySubmit={onCommentSubmit} />)
        ) : (
          <div className="p-5 text-center text-sm text-[var(--text-muted)]">
            Cargando comentarios...
          </div>
        )}
      </div>

      <DeleteConfirmDialog 
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar hilo?"
        description="Esta acción eliminará el hilo y todos sus comentarios de forma permanente."
      />
    </div>
  );
}
