<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\BoosterPack;
use App\Models\User;


class InventoryPack extends Model
{
    protected $table = 'inventory_pack';

    protected $fillable = [
        'user_id',
        'booster_pack_id',
        'quantity',
        'quantity_locked'
    ];

    /**
     * Cantidad disponible (Total - Bloqueada).
     */
    public function getQuantityAvailableAttribute()
    {
        return $this->quantity - $this->quantity_locked;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function boosterPack()
    {
        return $this->belongsTo(BoosterPack::class, 'booster_pack_id');
    }
}
