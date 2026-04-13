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
  onCommentSubmit: (body: string) => void;
}

export default function ThreadDetailView({ post, comments, isSubmitting, onBack, onCommentSubmit }: ThreadDetailViewProps) {
  const { user } = useAuth();
  const [newCommentBody, setNewCommentBody] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = user && (
    user.id === post.author_id || 
    user.is_admin || 
    (user.role_name === 'mod_news' && post.forum_id === 2) ||
    (user.role_name === 'mod_tournaments' && post.forum_id === 5) ||
    (user.role_name === 'mod_general' && post.forum_id === 1)
  );

  const handleSubmit = () => {
    if (!newCommentBody.trim()) return;
    onCommentSubmit(newCommentBody);
    setNewCommentBody("");
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
    // Para simplificar, refrescamos cargando de nuevo el hilo o filtrando localmente
    // Aquí usamos el onBack para forzar un refresco del feed o podrías implementar un refresh local
    onBack(); 
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="p-4 bg-[var(--surface-2)] border-b border-[var(--border)] flex justify-between items-center gap-4">
        <h2 className="font-semibold text-[15px] text-[var(--text-primary)] flex-1">{post.title}</h2>
        <div className="flex items-center gap-2">
          {canDelete && (
            <button 
              onClick={handleDelete}
              className="p-1.5 text-[var(--red)] hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
              title="Eliminar hilo"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onBack} className="text-xs text-[var(--text-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-md bg-transparent hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0">
            ← Volver
          </button>
        </div>
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
          comments.map(c => <CommentItem key={c.id} comment={c} forumId={post.forum_id} onDelete={handleCommentDelete} />)
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
