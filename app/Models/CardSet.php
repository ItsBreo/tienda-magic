<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CardSet extends Model
{
    use SoftDeletes;

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
