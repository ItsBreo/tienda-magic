<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Comment extends Model
{
    use SoftDeletes;
    use HasFactory;

    protected $appends = [
        'user_vote',
        'created_at_formatted',
        'author_name'
    ];

    protected $fillable = [
        'thread_id',
        'user_id',
        'parent_id',
        'body',
        'score',
        'is_hidden',
    ];

    protected $casts = [
        'is_hidden' => 'boolean',
    ];

    public function getUserVoteAttribute()
    {
        // Forzamos a Laravel a revisar el token JWT, incluso si la ruta no tiene middleware auth
        $userId = auth('api')->id() ?? auth()->id();

        if (!$userId) {
            return 0;
        }

        return (int) $this->votes()->where('user_id', $userId)->value('value');
    }

    /**
     * Accesor para obtener la fecha de creación formateada para humanos.
     * Esto resuelve el problema de la fecha no formateada.
     */
    protected function createdAtFormatted(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->created_at ? $this->created_at->diffForHumans() : 'Fecha desconocida',
        );
    }

    /**
     * Accesor para obtener el nombre del autor de forma segura.
     * NOTA: Esto depende de que la relación 'user' se cargue previamente
     * con ->with('user') en el controlador.
     */
    protected function authorName(): Attribute
    {
        return Attribute::make(
            // Comprueba que la relación 'user' fue cargada y no es nula antes de acceder al nombre.
            get: fn () => $this->relationLoaded('user') && $this->user ? $this->user->name : 'Desconocido',
        );
    }

    protected static function booted()
    {
        // Cuando se crea un comentario, sumamos 1 al contador del thread
        static::created(function ($comment) {
            if ($comment->thread_id) {
                $comment->thread()->increment('comments_count');
            }
        });

        // Cuando se elimina (soft delete), restamos 1
        static::deleted(function ($comment) {
            if ($comment->thread_id) {
                $comment->thread()->decrement('comments_count');
            }
        });

        // Si se restaura el comentario, volvemos a sumar 1
        static::restored(function ($comment) {
            if ($comment->thread_id) {
                $comment->thread()->increment('comments_count');
            }
        });
    }

    // Un comentario pertenece a un thread
    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    // Un comentario pertenece a un usuario (autor)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Comentario padre (si es una respuesta)
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    // Respuestas anidadas a este comentario
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    // Un comentario tiene muchos votos (polimórfico)
    public function votes(): MorphMany
    {
        return $this->morphMany(Vote::class, 'votable');
    }
}
