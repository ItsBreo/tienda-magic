<?php

namespace App\Observers;

use App\Models\Thread;

class ThreadObserver
{
    /**
     * Handle the Thread "created" event.
     */
    public function created(Thread $thread): void
    {
        // Otorgar +2 de reputación por iniciar una discusión.
        if ($thread->user && $thread->user->profile) {
            $thread->user->profile->increment('reputation_score', 2);
        }
    }

    /**
     * Handle the Thread "deleted" event.
     */
    public function deleted(Thread $thread): void
    {
        // Restar los 2 puntos si el hilo se elimina (evita farmeo).
        if ($thread->user && $thread->user->profile) {
            $thread->user->profile->decrement('reputation_score', 2);
        }
    }
}
