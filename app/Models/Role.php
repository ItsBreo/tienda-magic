<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = [
        'name',
    ];

    /**
     * Obtener todos los usuarios con este rol
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'roles_id');
    }
}
