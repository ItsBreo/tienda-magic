<?php
// app/Models/TournamentRegistration.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TournamentRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'tournament_id',
        'user_id',
        'status',
        'registered_at',
        'confirmed_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'confirmed_at'  => 'datetime',
    ];

    // ─── Relaciones ───────────────────────────────────────────

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ───────────────────────────────────────────────

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function confirm(): bool
    {
        return $this->update([
            'status'       => 'confirmed',
            'confirmed_at' => now(),
        ]);
    }

    public function cancel(): bool
    {
        return $this->update(['status' => 'cancelled']);
    }
}
