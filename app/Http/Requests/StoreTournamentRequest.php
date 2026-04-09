<?php
// app/Http/Requests/StoreTournamentRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTournamentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Cualquier usuario autenticado puede crear un torneo
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'starts_at'   => 'required|date|after:now',
            'location'    => 'required|string|max:255',
            'format'      => 'required|in:standard,modern,pioneer,legacy,draft,sealed,commander',
            'max_players' => 'required|integer|min:2|max:512',
            'entry_fee'   => 'nullable|numeric|min:0',
            'prize'       => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'El nombre del torneo es obligatorio.',
            'starts_at.required'   => 'La fecha de inicio es obligatoria.',
            'starts_at.after'      => 'El torneo debe empezar en el futuro.',
            'location.required'    => 'El lugar es obligatorio.',
            'format.required'      => 'El formato es obligatorio.',
            'format.in'            => 'El formato elegido no es válido.',
            'max_players.required' => 'El número máximo de jugadores es obligatorio.',
            'max_players.min'      => 'El torneo debe tener al menos 2 jugadores.',
            'entry_fee.numeric'    => 'El precio de inscripción debe ser un número.',
            'entry_fee.min'        => 'El precio no puede ser negativo.',
        ];
    }

    // Preprocesar datos antes de validar
    protected function prepareForValidation(): void
    {
        $this->merge([
            'entry_fee' => $this->entry_fee ?? 0.00,
        ]);
    }
}
