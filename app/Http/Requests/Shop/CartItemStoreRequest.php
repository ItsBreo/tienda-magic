<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CartItemStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'booster_pack_id' => [
                'required',
                'integer',
                'exists:booster_pack,id'
            ],
            'quantity' => [
                'required',
                'integer',
                'min:1',
                'max:100' // Límite de seguridad para evitar abusos
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'booster_pack_id.required' => 'El ID del pack es requerido',
            'booster_pack_id.exists' => 'El pack seleccionado no existe',
            'quantity.required' => 'La cantidad es requerida',
            'quantity.integer' => 'La cantidad debe ser un número entero',
            'quantity.min' => 'La cantidad mínima es 1',
            'quantity.max' => 'La cantidad máxima por pack es 100'
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422)
        );
    }
}
