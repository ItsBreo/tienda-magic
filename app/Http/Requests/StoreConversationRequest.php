<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'type' => 'required|in:direct,group,trade',
            'context_type' => 'nullable|string|max:255',
            'context_id' => 'nullable|uuid|required_with:context_type',
            'participant_ids' => 'nullable|array',
            'participant_ids.*' => 'exists:users,id',
            'metadata' => 'nullable|array',
        ];
    }
}
