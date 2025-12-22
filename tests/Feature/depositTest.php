<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\depositOrder;
use App\Models\walletTransaction;

class depositTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_puede_recargar_saldo()
    {
        // Preparamos un usuario con 0 euros
        $user = User::factory()->create(['wallet_balance' => 0]);

        // Intentamos recargar 50€
        $response = $this->actingAs($user)
                         ->post(route('wallet.deposit'), [
                             'amount' => 50
                         ]);

        // Verificamos la redirección
        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Verificamos la Base de Datos
        //  El usuario tiene el dinero
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'wallet_balance' => 50.00
        ]);

        // Se crea la orden de depósito
        $this->assertDatabaseHas('deposit_order', [
            'user_id' => $user->id,
            'amount_eur' => 50.00,
            'status' => 'COMPLETED'
        ]);

        // Se crea el log en el historial
        $this->assertDatabaseHas('wallet_transaction', [
            'user_id' => $user->id,
            'type' => 'DEPOSIT',
            'amount' => 50.00,
            'balance_after' => 50.00
        ]);
    }

    public function test_no_puede_recargar_menos_del_minimo()
    {
        $user = User::factory()->create(['wallet_balance' => 10]);

        // Intentar recargar 1€ (el mínimo pusimos que era 5)
        $response = $this->actingAs($user)
                         ->post(route('wallet.deposit'), [
                             'amount' => 1
                         ]);

        $response->assertSessionHasErrors(['amount']);

        // El saldo no debe cambiar
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'wallet_balance' => 10.00
        ]);
    }
}
