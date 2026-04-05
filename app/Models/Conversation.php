<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Conversation extends Model
{
    use HasUuids;

    protected $fillable = [
        'title',
        'type',
        'context_type',
        'context_id',
        'metadata',
        'last_message_at',
        'trade_id',
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_message_at' => 'datetime',
    ];

    public function context(): MorphTo
    {
        return $this->morphTo();
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants', 'conversation_id', 'user_id')
            ->withPivot(['role', 'joined_at', 'last_read_at', 'permissions'])
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function users(): BelongsToMany
    {
        return $this->participants();
    }

    public function hasUser(int $userId): bool
    {
        return $this->participants()->where('user_id', $userId)->exists();
    }

    public function getParticipantRole(int $userId): ?string
    {
        return $this->participants()->where('user_id', $userId)->value('role');
    }

    public function updateLastMessageAt(): void
    {
        $this->update(['last_message_at' => now()]);
    }
}
