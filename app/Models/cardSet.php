<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardSet extends Model
{
    protected $fillable = [
        'code',
        'name',
        'released_at'
    ];

    public function boosterPacks()
    {
        return $this->hasMany(BoosterPack::class);
    }
}
