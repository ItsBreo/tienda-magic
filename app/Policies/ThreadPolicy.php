<?php

namespace App\Policies;

use App\Models\Thread;
use App\Models\User;

class ThreadPolicy
{
    /**
     * ¿Puede el usuario crear un thread?
     * Cualquier usuario registrado puede crear en cualquier foro.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * ¿Puede el usuario actualizar este thread?
     * Autor, Admin o Moderador del sector.
     */
    public function update(User $user, Thread $thread): bool
    {
        if ($user->id === $thread->user_id) return true;
        if ($user->isAdmin()) return true;
        
        return $user->isModeratorOf((int) $thread->forum_id);
    }

    /**
     * ¿Puede el usuario eliminar este thread?
     * Autor, Admin o Moderador del sector.
     */
    public function delete(User $user, Thread $thread): bool
    {
        if ($user->id === $thread->user_id) return true;
        if ($user->isAdmin()) return true;

        return $user->isModeratorOf((int) $thread->forum_id);
    }

    /**
     * ¿Puede el usuario fijar / bloquear un thread?
     */
    public function pin(User $user, Thread $thread): bool
    {
        return $user->isAdmin() || $user->isModeratorOf((int) $thread->forum_id);
    }
}
