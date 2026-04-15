<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Comment extends Model
{
    use HasFactory;

    protected $guarded = [];

    /**
     * Los atributos que deben ser añadidos a las serializaciones del modelo.
     *
     * @var array
     */
    protected $appends = [
        'created_at_formatted',
        'author_name'
    ];

    /**
     * Relación: Un comentario pertenece a un usuario (autor).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación: Un comentario pertenece a un hilo.
     */
    public function thread()
    {
        return $this->belongsTo(Thread::class);
    }

    /**
     * Relación: Un comentario puede tener respuestas (es padre).
     */
    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    /**
     * Relación: Una respuesta pertenece a un comentario (es hijo).
     */
    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
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
     * NOTA: Esto depende de que la relación 'user' se cargue previamente.
     */
    protected function authorName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->user->name ?? 'Desconocido',
        );
    }
}
