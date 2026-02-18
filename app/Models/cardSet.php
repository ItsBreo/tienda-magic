<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardSet extends Model
{
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = 'code';
    protected $keyType = 'string';

    public function cards()
    {
        return $this->hasMany(Card::class, 'set_code', 'code');
    }
}
