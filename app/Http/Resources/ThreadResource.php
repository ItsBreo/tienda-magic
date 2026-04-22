<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThreadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'forum_id'       => $this->forum_id,
            'title'          => $this->title,
            'body'           => $this->body,
            'score'          => $this->score,
            'views_count'    => $this->views_count,
            'tags'           => $this->tags,
            'is_pinned'      => $this->is_pinned,
            'is_locked'      => $this->is_locked,
            'image_url'      => $this->image ? asset('storage/' . $this->image) : null,
            'comments_count' => $this->comments_count,
            'can_delete'     => (function () {
                /** @var \App\Models\User|null $user */
                $user = auth()->user();
                return $user && $user->can('delete', $this->resource);
            })(),
            'can_edit'       => (function () {
                /** @var \App\Models\User|null $user */
                $user = auth()->user();
                return $user && $user->can('update', $this->resource);
            })(),
            'created_at'     => $this->created_at->diffForHumans(),
            'forum' => [
                'id'   => $this->forum->id,
                'name' => $this->forum->name,
                'icon' => $this->forum->icon,
                'slug' => $this->forum->slug,
            ],
            'author' => [
                'id'         => $this->user->id,
                'name'       => $this->user->name,
                'avatar_url' => $this->user->avatar_url,
            ],
            // Solo se incluye si se cargó la relación votes con with()
            'user_vote' => $this->whenLoaded('votes', function () {
                $vote = $this->votes->where('user_id', auth()->id())->first();
                return $vote?->value; // 1, -1 o null
            }),

            'is_saved' => $this->is_saved,

            'comments' => CommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}
