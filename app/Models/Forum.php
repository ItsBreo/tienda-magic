<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Forum extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'icon',
        'description',
    ];

    /**
     * Indicar a Laravel que las URLs de foro se buscarán mediante su slug.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // Un foro tiene muchos threads
    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
    }
}
