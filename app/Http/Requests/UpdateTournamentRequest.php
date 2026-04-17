<?php
// app/Http/Requests/UpdateTournamentRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTournamentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $tournament = $this->route('tournament');

        return $this->user()->id === $tournament->created_by
            || $this->user()->is_admin;
    }

    public function rules(): array
    {
        return [
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'starts_at'   => 'sometimes|date|after:now',
            'location'    => 'sometimes|string|max:255',
            'format'      => 'sometimes|in:standard,modern,pioneer,legacy,draft,sealed,commander',
            'max_players' => 'sometimes|integer|min:2|max:512',
            'entry_fee'   => 'nullable|numeric|min:0',
            'prize'       => 'nullable|string|max:255',
            'status'      => 'sometimes|in:upcoming,ongoing,finished,cancelled',
        ];
    }

    public function messages(): array
    {
        return [
            'starts_at.after'  => 'El torneo debe empezar en el futuro.',
            'format.in'        => 'El formato elegido no es válido.',
            'max_players.min'  => 'El torneo debe tener al menos 2 jugadores.',
            'entry_fee.min'    => 'El precio no puede ser negativo.',
            'status.in'        => 'El estado indicado no es válido.',
        ];
    }

    public function rules_after_validation(): void
    {
        // Si se reduce max_players, no puede quedar por debajo de los ya confirmados
        if ($this->has('max_players')) {
            $confirmed = $this->route('tournament')
                              ->confirmedPlayers()
                              ->count();

            if ($this->max_players < $confirmed) {
                $this->validator->errors()->add(
                    'max_players',
                    "No puedes bajar el límite por debajo de los {$confirmed} jugadores ya confirmados."
                );
            }
        }
    }
}
