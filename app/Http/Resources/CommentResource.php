<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'body'       => $this->body,
            'score'      => $this->score,
            'is_hidden'  => $this->is_hidden,
            'can_delete' => (function () {
                /** @var \App\Models\User|null $user */
                $user = auth()->user();
                return $user && $user->can('delete', $this->resource);
            })(),
            'can_edit' => (function () {
                /** @var \App\Models\User|null $user */
                $user = auth()->user();
                return $user && $user->can('update', $this->resource);
            })(),
            'created_at' => $this->created_at->diffForHumans(),
            'author' => [
                'id'         => $this->user->id,
                'name'       => $this->user->name,
                'username'   => $this->user->username,
                'avatar_url' => $this->user->avatar_url,
                'reputation' => $this->user->reputation,
            ],
            // Respuestas anidadas — solo si se cargaron con with()
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
            // Solo se incluye si se cargó la relación votes con with()
            'user_vote' => $this->whenLoaded('votes', function () {
                $vote = $this->votes->where('user_id', auth()->id())->first();
                return $vote?->value; // 1, -1 o null
            }),
        ];
    }
}
