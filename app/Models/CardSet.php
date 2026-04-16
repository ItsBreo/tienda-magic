<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardSet extends Model
{
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = 'code';

    protected $casts = [
        'is_active' => 'boolean',
        'released_at' => 'date',
    ];

    public function cards()
    {
        return $this->hasMany(Card::class, 'set_code', 'code');
    }
}
