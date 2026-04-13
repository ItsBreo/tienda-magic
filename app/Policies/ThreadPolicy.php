<?php

namespace App\Policies;

use App\Models\Thread;
use App\Models\User;

class ThreadPolicy
{
    /**
     * ¿Puede el usuario actualizar este thread?
     * Solo el propio autor puede editar su thread.
     */
    public function update(User $user, Thread $thread): bool
    {
        return $user->id === $thread->user_id;
    }

    /**
     * ¿Puede el usuario eliminar este thread?
     *
     * Reglas:
     *  - El autor puede borrar su propio thread.
     *  - Un admin / super_admin puede borrar cualquier thread.
     *  - Un moderador sectorial puede borrar threads de su foro asignado.
     *  - Nadie más puede borrar threads ajenos.
     */
    public function delete(User $user, Thread $thread): bool
    {
        // El autor puede borrar su propio contenido
        if ($user->id === $thread->user_id) {
            return true;
        }

        // Admin y super_admin tienen acceso total
        if ($user->isAdmin()) {
            return true;
        }

        // El moderador sectorial puede borrar dentro de su foro
        return $user->isModeratorOf((int) $thread->forum_id);
    }

    /**
     * ¿Puede el usuario fijar / bloquear un thread?
     * Solo admins y moderadores del foro correspondiente.
     */
    public function pin(User $user, Thread $thread): bool
    {
        return $user->isAdmin() || $user->isModeratorOf((int) $thread->forum_id);
    }
}
