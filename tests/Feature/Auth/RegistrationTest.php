<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertStatus(200);
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'recaptcha_token' => 'fake-test-token', // Token falso para tests
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));

        // Verificar que el usuario fue creado
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
        ]);

        // Hacer una petición al dashboard; el cliente de test conserva las cookies
        // de la respuesta anterior, así que la sesión con el usuario logueado se mantiene
        $this->get(route('dashboard'));
        $this->assertAuthenticated();
    }
}
