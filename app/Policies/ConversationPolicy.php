<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->hasUser($user->id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Conversation $conversation): bool
    {
        return $conversation->hasUser($user->id) &&
               in_array($conversation->getParticipantRole($user->id), ['admin', 'creator']);
    }

    public function delete(User $user, Conversation $conversation): bool
    {
        return $conversation->hasUser($user->id) &&
               in_array($conversation->getParticipantRole($user->id), ['admin', 'creator']);
    }

    public function participate(User $user, Conversation $conversation): bool
    {
        return $conversation->hasUser($user->id);
    }

    public function addParticipant(User $user, Conversation $conversation): bool
    {
        $role = $conversation->getParticipantRole($user->id);
        return in_array($role, ['admin', 'creator']);
    }

    public function removeParticipant(User $user, Conversation $conversation): bool
    {
        $role = $conversation->getParticipantRole($user->id);
        return in_array($role, ['admin', 'creator']);
    }

    public function restore(User $user, Conversation $conversation): bool
    {
        return false;
    }

    public function forceDelete(User $user, Conversation $conversation): bool
    {
        return false;
    }
}
