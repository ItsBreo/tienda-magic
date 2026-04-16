<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'content' => $this->content,
            'type' => $this->type,
            'is_system_message' => $this->is_system_message,
            'metadata' => $this->metadata,
            'edited_at' => $this->edited_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user', function () {
                return $this->user ? [
                    'id' => $this->user->id,
                    'username' => $this->user->username,
                ] : null;
            }),
            'can_edit' => $this->canBeEditedBy($request->user()?->id ?? 0),
            'can_delete' => $this->canBeDeletedBy($request->user()?->id ?? 0),
        ];
    }
}
