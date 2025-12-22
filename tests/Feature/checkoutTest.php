<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\boosterPack;
use App\Models\Cart;
use App\Models\cartItem;
use Illuminate\Support\Facades\DB;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected $cardSetId;

    protected function setUp(): void
    {
        parent::setUp();

        // Creamos un Card Set base para evitar errores de Foreign Key
        $this->cardSetId = DB::table('card_sets')->insertGetId([
            'name' => 'Set Base',
            'code' => 'BASE',
            'released_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_usuario_puede_realizar_checkout_exitosamente()
    {
        // Usuario rico
        $user = User::factory()->create([
            'wallet_balance' => 100.00
        ]);

        // Producto (Usamos el ID del Set creado en setUp)
        $pack = boosterPack::create([
            'name' => 'Sobre Kamigawa',
            'price' => 10.00,
            'card_set_id' => $this->cardSetId, // <--- USO CORRECTO DEL ID
            'type' => 'draft',
            'config' => json_encode(['cards' => 15])
        ]);

        // Carrito
        $cart = Cart::create(['user_id' => $user->id]);

        cartItem::create([
            'cart_id' => $cart->id,
            'booster_pack_id' => $pack->id,
            'quantity' => 2
        ]);

        // Acción
        $response = $this->actingAs($user)->post(route('checkout.process'));

        // Verificación
        $response->assertRedirect(route('dashboard'));
        $this->assertDatabaseHas('orders', ['total_price' => 20.00]);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'wallet_balance' => 80.00]);
    }

    public function test_impide_compra_sin_saldo()
    {
        // Usuario pobre
        $user = User::factory()->create(['wallet_balance' => 5.00]);

        // Producto (Usamos el ID del Set creado en setUp)
        $pack = boosterPack::create([
            'name' => 'Pack Caro',
            'price' => 10.00,
            'card_set_id' => $this->cardSetId, // <--- USO CORRECTO DEL ID
            'type' => 'x',
            'config' => '{}'
        ]);

        // Carrito
        $cart = Cart::create(['user_id' => $user->id]);
        cartItem::create(['cart_id' => $cart->id, 'booster_pack_id' => $pack->id, 'quantity' => 1]);

        // Intentar comprar
        $response = $this->actingAs($user)->post(route('checkout.process'));

        // Verificar fallo
        $response->assertSessionHasErrors(['error']);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'wallet_balance' => 5.00]);
    }
}
