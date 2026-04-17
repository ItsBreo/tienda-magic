<?php
// app/Policies/TournamentPolicy.php

namespace App\Policies;

use App\Models\Tournament;
use App\Models\User;

class TournamentPolicy
{
    public function update(User $user, Tournament $tournament): bool
    {
        return $user->id === $tournament->created_by
            || $user->isAdmin() 
            || $user->hasRole('mod_tournaments');
    }

    public function delete(User $user, Tournament $tournament): bool
    {
        return $user->id === $tournament->created_by
            || $user->isAdmin()
            || $user->hasRole('mod_tournaments');
    }
}
