<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'permission_ids',
    ];

    protected $casts = [
        'permission_ids' => 'array',
    ];

    /**
     * Accesor para obtener los objetos Permission basados en los IDs del JSON.
     * Esto mantiene la compatibilidad con el frontend que espera objetos.
     */
    public function getPermissionsAttribute()
    {
        $ids = $this->permission_ids ?? [];
        if (empty($ids)) return collect();

        return Permission::whereIn('id', $ids)->get();
    }

    protected $appends = ['permissions'];

    /**
     * Obtener todos los usuarios con este rol
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_role', 'roles_id', 'user_id')
                    ->withPivot('forum_id')
                    ->withTimestamps();
    }

    /**
     * Obtener los permisos de este rol (COMENTADO: YA NO EXISTE TABLA PIVOT)
     */
    /*
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission');
    }
    */
}
