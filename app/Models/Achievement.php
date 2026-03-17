<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    public $timestamps = false; // 👈 la tabla no tiene created_at/updated_at

    protected $fillable = [
        'slug',
        'name',
        'description',
        'badge_icon',
        'xp_points',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_achievement')
                    ->withPivot('obtained_at');
    }
}
