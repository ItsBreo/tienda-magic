<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Deck extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'name',
        'is_public',
        'is_in_sale',
    ];

    /**
     * The events that should be dispatched.
     */
    protected $dispatchesEvents = [
        'created' => \App\Events\DeckCreated::class,
    ];

    /**
     * Get the user that owns the deck.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the cards in the deck.
     */
    public function cards(): BelongsToMany
    {
        return $this->belongsToMany(Card::class)
            ->withPivot('quantity')
            ->withTimestamps();
    }
}
