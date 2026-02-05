<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class userProfile extends Model
{
    protected $table = 'profile';

    protected $fillable = [
        'display_name',
        'avatar_url',
        'banner_url',
        'bio',
        'country',
        'reputation_score',
        'trade_terms',
    ];

    /**
     * Obtener el usuario propietario de este perfil
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
