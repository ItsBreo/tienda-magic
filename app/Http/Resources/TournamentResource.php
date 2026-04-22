<?php
// app/Http/Resources/TournamentResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'starts_at'   => $this->starts_at->format('D d M · H:i'),
            'location'    => $this->location,
            'format'      => $this->format,
            'max_players' => $this->max_players,
            'spots_left'  => $this->spotsLeft(),
            'is_full'     => $this->isFull(),
            'entry_fee'   => (float) $this->entry_fee,
            'prize'       => $this->prize,
            'status'      => $this->status,

            'creator'     => $this->whenLoaded('creator', fn() => [
                'id'   => $this->creator->id,
                'name' => $this->creator->name,
            ]),

            'registrations_count' => $this->whenLoaded(
                'confirmedPlayers',
                fn() => $this->confirmedPlayers->count()
            ),

            'confirmed_players' => $this->whenLoaded('confirmedPlayers', fn() =>
                $this->confirmedPlayers->map(fn($p) => [
                    'id'   => $p->id,
                    'name' => $p->name,
                ])
            ),

            'can_edit'   => (function () {
                /** @var \App\Models\User|null $user */
                $user = auth()->user();
                return $user && $user->can('update', $this->resource);
            })(),

            'can_delete' => (function () {
                /** @var \App\Models\User|null $user */
                $user = auth()->user();
                return $user && $user->can('delete', $this->resource);
            })(),
        ];
    }
}
