<?php

namespace App\Observers;

use App\Models\Comment;

class CommentObserver
{
    /**
     * Handle the Comment "created" event.
     */
    public function created(Comment $comment): void
    {
        // Otorgar +1 de reputación por participar en discusiones.
        if ($comment->user && $comment->user->profile) {
            $comment->user->profile->increment('reputation_score', 1);
        }
    }

    /**
     * Handle the Comment "deleted" event.
     */
    public function deleted(Comment $comment): void
    {
        // Restar el punto de reputación si se elimina el comentario.
        if ($comment->user && $comment->user->profile) {
            $comment->user->profile->decrement('reputation_score', 1);
        }
    }
}
