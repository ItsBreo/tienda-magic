<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardSet extends Model
{
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = 'code';
    protected $keyType = 'string'; // Prevents Eloquent casting the PK to int in WHERE IN queries

    protected $casts = [
        'is_active' => 'boolean',
        'released_at' => 'date',
    ];

    public function cards()
    {
        return $this->hasMany(Card::class, 'set_code', 'code');
    }

    public function boosterPacks()
    {
        return $this->hasMany(BoosterPack::class, 'card_set_id', 'code');
    }
}
