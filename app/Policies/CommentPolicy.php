<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    /**
     * ¿Puede el usuario actualizar este comentario?
     */
    public function update(User $user, Comment $comment): bool
    {
        if ($user->id === $comment->user_id) return true;
        if ($user->isAdmin()) return true;

        $forumId = $comment->thread?->forum_id
            ?? \Illuminate\Support\Facades\DB::table('threads')
                ->where('id', $comment->thread_id)
                ->value('forum_id');

        return $forumId && $user->isModeratorOf((int) $forumId);
    }

    /**
     * ¿Puede el usuario eliminar este comentario?
     *
     * Reglas:
     *  - El autor puede borrar su propio comentario.
     *  - Un admin / super_admin puede borrar cualquier comentario.
     *  - Un moderador sectorial puede borrar comentarios dentro de su foro.
     *  - Nadie puede borrar comentarios de otros en sus propios posts
     *    (esa restricción se aplica al no cumplir ninguna de las condiciones anteriores).
     */
    public function delete(User $user, Comment $comment): bool
    {
        // El autor puede borrar su propio comentario
        if ($user->id === $comment->user_id) {
            return true;
        }

        // Admin y moderador pueden borrar (delegado a moderate)
        return $this->moderate($user, $comment);
    }

    /**
     * ¿Puede el usuario moderar este comentario?
     */
    public function moderate(User $user, Comment $comment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $forumId = $comment->thread?->forum_id
            ?? \Illuminate\Support\Facades\DB::table('threads')
                ->where('id', $comment->thread_id)
                ->value('forum_id');

        return $forumId && $user->isModeratorOf((int) $forumId);
    }
}
