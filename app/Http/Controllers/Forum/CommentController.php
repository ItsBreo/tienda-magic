<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Services\AuditLogger;
use App\Models\Thread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

class CommentController extends Controller
{
    #[OA\Post(
        path: "/api/threads/{thread}/comments",
        summary: "Añadir comentario",
        description: "Añade un comentario a un hilo o responde a otro comentario.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "thread", in: "path", required: true, description: "ID del hilo", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "body", type: "string"),
            new OA\Property(property: "parent_id", type: "integer", nullable: true)
        ])
    )]
    #[OA\Response(response: 201, description: "Comentario creado")]
    public function store(Request $request, Thread $thread)
    {
        $validated = $request->validate([
            'body'      => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = $thread->comments()->create([
            ...$validated,
            'user_id' => Auth::id(),
        ]);

        AuditLogger::log('forum.comment_created', $comment, [
            'thread_id' => $thread->id,
            'content_snippet' => mb_substr($comment->body, 0, 50) . '...'
        ]);

        $comment->load('user');

        return new CommentResource($comment);
    }

    #[OA\Put(
        path: "/api/comments/{comment}",
        summary: "Editar comentario",
        description: "Edita un comentario propio.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "comment", in: "path", required: true, description: "ID del comentario", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "body", type: "string")
        ])
    )]
    #[OA\Response(response: 200, description: "Comentario editado")]
    public function update(Request $request, Comment $comment)
    {
        $this->authorize('update', $comment);

        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        $comment->update($validated);
        $comment->load('user');

        return new CommentResource($comment);
    }

    #[OA\Delete(
        path: "/api/comments/{comment}",
        summary: "Eliminar comentario",
        description: "Borra un comentario (soft delete).",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "comment", in: "path", required: true, description: "ID del comentario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Comentario eliminado")]
    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comentario eliminado correctamente.']);
    }
}
