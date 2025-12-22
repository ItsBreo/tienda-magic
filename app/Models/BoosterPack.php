<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class boosterPack extends Model
{

    protected $table = 'booster_pack';

    protected $fillable = [
        'name',
        'price',
        'card_set_id',
        'type',
        'config'
    ];

    public function cardSet()
    {
        return $this->belongsTo(cardSet::class);
    }
}
