<?php

namespace App\Observers;

use App\Models\Vote;
use App\Models\Thread;

class VoteObserver
{
    /**
     * Handle the Vote "created" event.
     */
    public function created(Vote $vote): void
    {
        $this->updateScore($vote, $vote->value);
    }

    /**
     * Handle the Vote "updating" event.
     */
    public function updating(Vote $vote): void
    {
        // Calcular la diferencia si cambió de -1 a 1 (dif = +2)
        if ($vote->isDirty('value')) {
            $diff = $vote->value - $vote->getOriginal('value');
            $this->updateScore($vote, $diff);
        }
    }

    /**
     * Handle the Vote "deleted" event.
     */
    public function deleted(Vote $vote): void
    {
        // Revertir el valor otorgado
        $this->updateScore($vote, -$vote->value);
    }

    /**
     * Actualiza dinámicamente el puntaje en el Hilo o Comentario,
     * y aplica el multiplicador de impacto social al autor.
     */
    private function updateScore(Vote $vote, int $diff): void
    {
        $votableClass = $vote->votable_type;
        $votable = $votableClass::find($vote->votable_id);
        
        if ($votable) {
            $votable->increment('score', $diff);

            // Obtener el autor para actualizar la reputación
            $author = $votable->user;
            if ($author && $author->profile) {
                // Matemática de reputación: Votos de hilo valen x2, de comentario valen x1
                $multiplier = ($votableClass === Thread::class) ? 2 : 1;
                $repDiff = $diff * $multiplier;

                $author->profile->increment('reputation_score', $repDiff);
            }
        }
    }
}
