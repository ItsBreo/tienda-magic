<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    // ¿Puede el usuario actualizar este comentario?
    public function update(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id;
    }

    // ¿Puede el usuario eliminar este comentario?
    public function delete(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id;
    }
}
