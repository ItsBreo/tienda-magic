<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ThreadResource;
use App\Http\Resources\CommentResource;
use App\Models\Thread;
use App\Models\Comment;
use Illuminate\Http\Request;

/**
 * Controlador de moderación del foro.
 *
 * Accesible para: admin, super_admin y moderadores sectoriales.
 * Un moderador solo puede actuar sobre contenido de su foro asignado.
 */
class AdminForumModController extends Controller
{
    /**
     * Lista los threads de un foro (para el panel de moderación).
     * GET /mod/forums/{forum}/threads
     */
    public function threads(Request $request, int $forumId)
    {
        $user = $request->user();

        if (!$user->isAdmin() && !$user->isModeratorOf($forumId)) {
            return response()->json(['message' => 'No tienes acceso a este foro.'], 403);
        }

        $threads = Thread::with(['user', 'forum'])
            ->where('forum_id', $forumId)
            ->withTrashed()          // los mods también ven los soft-deleted
            ->latest()
            ->paginate(30);

        return ThreadResource::collection($threads);
    }

    /**
     * Elimina (soft delete) un thread desde el panel de moderación.
     * DELETE /mod/threads/{thread}
     */
    public function deleteThread(Request $request, Thread $thread)
    {
        $user = $request->user();

        $this->authorize('delete', $thread);

        $thread->delete();

        return response()->json([
            'message' => "Thread #{$thread->id} eliminado por {$user->username}.",
        ]);
    }

    /**
     * Elimina (soft delete) un comentario desde el panel de moderación.
     * DELETE /mod/comments/{comment}
     */
    public function deleteComment(Request $request, Comment $comment)
    {
        $user = $request->user();

        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json([
            'message' => "Comentario #{$comment->id} eliminado por {$user->username}.",
        ]);
    }

    /**
     * Restaura un thread eliminado (solo admin/super_admin).
     * POST /mod/threads/{thread}/restore
     */
    public function restoreThread(Request $request, int $threadId)
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Solo los admins pueden restaurar threads.'], 403);
        }

        $thread = Thread::withTrashed()->findOrFail($threadId);
        $thread->restore();

        return response()->json(['message' => "Thread #{$thread->id} restaurado."]);
    }

    /**
     * Restaura un comentario eliminado (solo admin/super_admin).
     * POST /mod/comments/{comment}/restore
     */
    public function restoreComment(Request $request, int $commentId)
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Solo los admins pueden restaurar comentarios.'], 403);
        }

        $comment = Comment::withTrashed()->findOrFail($commentId);
        $comment->restore();

        return response()->json(['message' => "Comentario #{$comment->id} restaurado."]);
    }
}
