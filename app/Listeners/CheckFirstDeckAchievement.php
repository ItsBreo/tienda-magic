<?php

namespace App\Listeners;

use App\Events\DeckCreated;
use App\Models\Achievement;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CheckFirstDeckAchievement
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(DeckCreated $event): void
    {
        $user = $event->deck->user;

        // Contar cuántos mazos tiene el usuario
        $deckCount = $user->decks()->count();

        // Si es el primer mazo, otorgar el logro
        if ($deckCount === 1) {
            // Buscar o crear el logro "Primer Mazo Creado"
            $achievement = Achievement::firstOrCreate(
                ['name' => 'Primer Mazo Creado'],
                [
                    'description' => 'Otorgado por crear tu primer mazo',
                ]
            );

            // Verificar que el usuario no tenga el logro ya
            if (!$user->achievements()->where('achievement_id', $achievement->id)->exists()) {
                $user->achievements()->attach($achievement->id);
            }
        }
    }
}
