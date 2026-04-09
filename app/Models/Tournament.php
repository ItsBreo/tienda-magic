<?php
// app/Models/Tournament.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tournament extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'created_by',
        'name',
        'description',
        'starts_at',
        'location',
        'format',
        'max_players',
        'entry_fee',
        'prize',
        'status',
    ];

    protected $casts = [
        'starts_at'  => 'datetime',
        'entry_fee'  => 'decimal:2',
        'max_players' => 'integer',
    ];

    // ─── Relaciones ───────────────────────────────────────────

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function registrations()
    {
        return $this->hasMany(TournamentRegistration::class);
    }

    public function players()
    {
        return $this->belongsToMany(User::class, 'tournament_registrations')
                    ->withPivot('status', 'registered_at', 'confirmed_at')
                    ->withTimestamps();
    }

    public function confirmedPlayers()
    {
        return $this->players()->wherePivot('status', 'confirmed');
    }

    // ─── Scopes ───────────────────────────────────────────────

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'upcoming')
                     ->where('starts_at', '>', now())
                     ->orderBy('starts_at');
    }

    public function scopeByFormat($query, string $format)
    {
        return $query->where('format', $format);
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function isFull(): bool
    {
        return $this->confirmedPlayers()->count() >= $this->max_players;
    }

    public function spotsLeft(): int
    {
        return max(0, $this->max_players - $this->confirmedPlayers()->count());
    }

    public function isRegistered(int $userId): bool
    {
        return $this->registrations()
                    ->where('user_id', $userId)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->exists();
    }
}
