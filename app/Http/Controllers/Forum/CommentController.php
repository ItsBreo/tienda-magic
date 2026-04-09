<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Thread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    // Crea un comentario en un thread (o responde a otro comentario)
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

        $comment->load('user');

        return new CommentResource($comment);
    }

    // Edita un comentario (solo el autor)
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

    // Elimina un comentario (soft delete, solo el autor)
    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comentario eliminado correctamente.']);
    }
}
