<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryPack extends Model
{
    protected $table = 'inventory_pack';

    protected $fillable = [
        'user_id',
        'card_sets_id',
        'quantity'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cardSet()
    {
        return $this->belongsTo(cardSet::class, 'card_sets_id');
    }
}
