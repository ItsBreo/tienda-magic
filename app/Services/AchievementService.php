<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\User;

class AchievementService
{
    public function unlock(User $user, string $slug): bool
    {
        $achievement = Achievement::where('slug', $slug)->first();

        if (!$achievement) return false;

        // Evita duplicados — si ya lo tiene, no hace nada
        $alreadyHas = $user->achievements()->where('achievement_id', $achievement->id)->exists();
        if ($alreadyHas) return false;

        $user->achievements()->attach($achievement->id, [
            'obtained_at' => now(),
        ]);

        return true; // true = se desbloqueó ahora
    }

    public function checkTransactionMilestones(User $user): void
    {
        $total = $user->purchases()->count() + $user->sales()->count();

        if ($total >= 10) $this->unlock($user, 'transactions_10');
        if ($total >= 50) $this->unlock($user, 'transactions_50');
    }
}
