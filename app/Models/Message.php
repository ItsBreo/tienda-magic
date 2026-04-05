<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'content',
        'type',
        'is_system_message',
        'metadata',
        'edited_at',
    ];

    protected $casts = [
        'is_system_message' => 'boolean',
        'metadata' => 'array',
        'edited_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOwnedBy(int $userId): bool
    {
        return $this->user_id === $userId && !$this->is_system_message;
    }

    public function canBeEditedBy(int $userId): bool
    {
        return $this->isOwnedBy($userId) && !$this->edited_at;
    }

    public function canBeDeletedBy(int $userId): bool
    {
        return $this->isOwnedBy($userId) || $this->conversation->getParticipantRole($userId) === 'admin';
    }

    public function markAsEdited(): void
    {
        $this->update(['edited_at' => now()]);
    }

    public function scopeNotSystem($query)
    {
        return $query->where('is_system_message', false);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system_message', true);
    }
}
