<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    /**
     * ¿Puede el usuario actualizar este comentario?
     * Solo el propio autor puede editar su comentario.
     */
    public function update(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id;
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

        // Admin y super_admin tienen acceso total
        if ($user->isAdmin()) {
            return true;
        }

        // El moderador sectorial puede borrar en su foro.
        // Necesitamos el forum_id del thread al que pertenece el comentario.
        if ($user->isModerator()) {
            $forumId = $comment->thread?->forum_id
                ?? \Illuminate\Support\Facades\DB::table('threads')
                    ->where('id', $comment->thread_id)
                    ->value('forum_id');

            if ($forumId && $user->isModeratorOf((int) $forumId)) {
                return true;
            }
        }

        return false;
    }
}
