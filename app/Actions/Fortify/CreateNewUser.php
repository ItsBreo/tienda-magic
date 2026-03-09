<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;
// 1. Importamos tu nueva regla de reCAPTCHA
use App\Rules\RecaptchaCheck;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique(User::class)],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
            // 2. Cambiamos el nombre del campo y usamos la nueva regla
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ], [
            // Opcional: Mensaje de error personalizado en español
            'recaptcha_token.required' => 'Debes completar el captcha para poder registrarte.'
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'username' => $input['username'],
            'email' => $input['email'],
            'password' => $input['password'], // Fortify hace el hash automáticamente por defecto en el modelo, o asegúrate de usar Hash::make($input['password']) si tu modelo no lo hace.
        ]);
    }
}
