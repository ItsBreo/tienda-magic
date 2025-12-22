<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $table = 'cart';

    protected $fillable = ['user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        // Asegúrate que coincida con tu archivo (CartItem o cartItem)
        return $this->hasMany(CartItem::class);
    }
}
