<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'type' => $this->type,
            'context_type' => $this->context_type,
            'context_id' => $this->context_id,
            'metadata' => $this->metadata,
            'last_message_at' => $this->last_message_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'participants' => $this->whenLoaded('participants', function () {
                return $this->participants->map(function ($participant) {
                    return [
                        'id' => $participant->id,
                        'role' => $participant->role,
                        'joined_at' => $participant->joined_at,
                        'last_read_at' => $participant->last_read_at,
                        'user' => [
                            'id' => $participant->user->id,
                            'username' => $participant->user->username,
                        ],
                    ];
                });
            }),
            'latest_message' => $this->whenLoaded('messages', function () {
                $message = $this->messages->first();
                return $message ? [
                    'id' => $message->id,
                    'content' => $message->content,
                    'type' => $message->type,
                    'is_system_message' => $message->is_system_message,
                    'created_at' => $message->created_at,
                    'user' => $message->user ? [
                        'id' => $message->user->id,
                        'username' => $message->user->username,
                    ] : null,
                ] : null;
            }),
        ];
    }
}
