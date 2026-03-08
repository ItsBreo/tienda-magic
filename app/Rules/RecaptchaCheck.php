<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class RecaptchaCheck implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Bypass en ambientes de desarrollo y testing
        if (app()->environment(['local', 'testing'])) {
            return;
        }
        // Preguntamos a la API de Google si el token es válido
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => env('RECAPTCHA_SECRET_KEY'), // Usamos la nueva variable del .env
            'response' => $value,
            'remoteip' => request()->ip(),
        ]);

        // Si la respuesta de Google dice que NO es exitosa ('success' => false)
        if (! $response->json('success')) {
            $fail('No se pudo verificar el reCAPTCHA. Por favor, marca la casilla de "No soy un robot" e intenta de nuevo.');
        }
    }
}
