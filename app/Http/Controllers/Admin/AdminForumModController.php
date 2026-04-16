<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ThreadResource;
use App\Http\Resources\CommentResource;
use App\Models\Thread;
use App\Models\Comment;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

/**
 * Controlador de moderación del foro.
 *
 * Accesible para: admin, super_admin y moderadores sectoriales.
 * Un moderador solo puede actuar sobre contenido de su foro asignado.
 */
class AdminForumModController extends Controller
{
    #[OA\Get(
        path: "/api/mod/forums/{forumId}/threads",
        summary: "Lista de hilos del foro para moderadores",
        description: "Obtiene la lista de los hilos del foro para moderar.",
        tags: ["Moderation"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "forumId", in: "path", required: true, description: "ID del foro", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Lista de hilos de moderación")]
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

    #[OA\Delete(
        path: "/api/mod/threads/{thread}",
        summary: "Eliminar hilo (Moderación)",
        description: "Elimina un hilo del foro (solo moderadores/admins).",
        tags: ["Moderation"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "thread", in: "path", required: true, description: "ID del hilo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Hilo eliminado")]
    public function deleteThread(Request $request, int $id)
    {
        $thread = Thread::findOrFail($id);
        Gate::authorize('moderate', $thread);

        $thread->delete();

        return response()->json([
            'message' => "Thread #{$thread->id} eliminado por {$request->user()->username}.",
        ]);
    }

    #[OA\Delete(
        path: "/api/mod/comments/{comment}",
        summary: "Eliminar comentario (Moderación)",
        description: "Elimina un comentario del foro (solo moderadores/admins).",
        tags: ["Moderation"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "comment", in: "path", required: true, description: "ID del comentario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Comentario eliminado")]
    public function deleteComment(Request $request, int $id)
    {
        $comment = Comment::findOrFail($id);
        Gate::authorize('moderate', $comment);

        $comment->delete();

        return response()->json([
            'message' => "Comentario #{$comment->id} eliminado por {$request->user()->username}.",
        ]);
    }

    #[OA\Post(
        path: "/api/mod/threads/{threadId}/restore",
        summary: "Restaurar hilo (Admin)",
        description: "Restaura un hilo que fue eliminado (solo admins).",
        tags: ["Moderation"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "threadId", in: "path", required: true, description: "ID del hilo a restaurar", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Hilo restaurado")]
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

    #[OA\Post(
        path: "/api/mod/comments/{commentId}/restore",
        summary: "Restaurar comentario (Admin)",
        description: "Restaura un comentario que fue eliminado (solo admins).",
        tags: ["Moderation"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "commentId", in: "path", required: true, description: "ID del comentario a restaurar", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Comentario restaurado")]
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

    /**
     * Acciones Masivas (Bulk Actions)
     */

    public function bulkDeleteThreads(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:threads,id'
        ]);

        $threads = Thread::whereIn('id', $validated['ids'])->get();
        $deletedCount = 0;
        foreach ($threads as $thread) {
            /** @var Thread $thread */
            if (Gate::allows('moderate', $thread)) {
                $thread->delete();
                $deletedCount++;
            }
        }

        return response()->json([
            'message' => "{$deletedCount} hilos eliminados correctamente."
        ]);
    }

    public function bulkDeleteComments(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comments,id'
        ]);

        $comments = Comment::whereIn('id', $validated['ids'])->get();
        $deletedCount = 0;
        foreach ($comments as $comment) {
            /** @var Comment $comment */
            if (Gate::allows('moderate', $comment)) {
                $comment->delete();
                $deletedCount++;
            }
        }

        return response()->json([
            'message' => "{$deletedCount} comentarios eliminados correctamente."
        ]);
    }
}
