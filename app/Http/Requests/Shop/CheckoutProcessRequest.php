<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CheckoutProcessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // NOTA: El frontend NO debe enviar el total. El backend lo calculará.
            // Este campo solo se usa para validación básica de formato, no para el cálculo.
            'payment_method' => [
                'required',
                'string',
                'in:wallet,stripe' // Métodos de pago permitidos
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'payment_method.required' => 'El método de pago es requerido',
            'payment_method.in' => 'El método de pago seleccionado no es válido'
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
