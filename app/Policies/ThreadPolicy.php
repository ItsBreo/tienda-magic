<?php

namespace App\Policies;

use App\Models\Thread;
use App\Models\User;

class ThreadPolicy
{
    // ¿Puede el usuario actualizar este thread?
    public function update(User $user, Thread $thread): bool
    {
        return $user->id === $thread->user_id;
    }

    // ¿Puede el usuario eliminar este thread?
    public function delete(User $user, Thread $thread): bool
    {
        return $user->id === $thread->user_id;
    }
}
