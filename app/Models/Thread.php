<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Thread extends Model
{
    use SoftDeletes;
    use HasFactory;

    protected $appends = ['user_vote', 'is_saved'];

    protected $fillable = [
        'forum_id',
        'user_id',
        'title',
        'body',
        'score',
        'views_count',
        'tags',
        'is_pinned',
        'is_locked',
        'image',
    ];

    protected $casts = [
        'tags'      => 'array',   // JSON → array automáticamente
        'is_pinned' => 'boolean',
        'is_locked' => 'boolean',
    ];

    public function getUserVoteAttribute()
    {
        // Obtenemos el ID del usuario autenticado (Sanctum)
        $userId = auth()->id() ?? auth('sanctum')->id();

        if (!$userId) {
            return 0;
        }

        return (int) $this->votes()->where('user_id', $userId)->value('value');
    }

    public function getIsSavedAttribute()
    {
        $userId = auth()->id();

        if (!$userId) {
            return false;
        }

        return $this->savedByUsers()->where('user_id', $userId)->exists();
    }

    // Un thread pertenece a un foro
    public function forum(): BelongsTo
    {
        return $this->belongsTo(Forum::class);
    }

    // Un thread pertenece a un usuario (autor)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Un thread tiene muchos comentarios
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // Un thread tiene muchos votos (polimórfico)
    public function votes(): MorphMany
    {
        return $this->morphMany(Vote::class, 'votable');
    }

    // Usuarios que han guardado este thread
    public function savedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_threads')->withTimestamps();
    }
}
