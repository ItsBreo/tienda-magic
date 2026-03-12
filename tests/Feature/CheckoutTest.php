<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\BoosterPack;
use App\Models\CardSet;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryPack;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected $cardSet;

    protected function setUp(): void
    {
        parent::setUp();

        // Creamos un Card Set base para evitar errores de Foreign Key
        $this->cardSet = CardSet::create([
            'name' => 'Set Base',
            'code' => 'BASE',
            'released_at' => now(),
        ]);
    }

    public function test_usuario_puede_realizar_checkout_exitosamente()
    {
        // Usuario autenticado
        $user = User::factory()->create();

        // Producto
        $pack = BoosterPack::create([
            'name' => 'Sobre Kamigawa',
            'price' => 10.00,
            'card_set_id' => $this->cardSet->code,
            'type' => 'draft',
            'config' => json_encode(['cards' => 15])
        ]);

        // Carrito con items
        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'booster_pack_id' => $pack->id,
            'quantity' => 2
        ]);

        // Acción - Petición JSON a API
        $response = $this->actingAs($user)->postJson('/api/checkout');

        // Verificaciones de API REST
        $response->assertStatus(200)
                ->assertJsonFragment([
                    'message' => '¡Pedido completado con éxito! (Modo Demo)',
                    'total' => 20.00,
                    'items_count' => 1
                ])
                ->assertJsonStructure([
                    'message',
                    'order_id',
                    'total',
                    'items_count'
                ]);

        // Verificaciones en base de datos
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'total_price' => 20.00,
            'status' => 'completed'
        ]);

        $this->assertDatabaseHas('order_items', [
            'booster_pack_id' => $pack->id,
            'quantity' => 2,
            'price_at_purchase' => 10.00
        ]);

        $this->assertDatabaseHas('inventory_pack', [
            'user_id' => $user->id,
            'booster_pack_id' => $pack->id,
            'quantity' => 2
        ]);

        // Verificar que el carrito está vacío
        $this->assertDatabaseMissing('cart_item', [
            'cart_id' => $cart->id
        ]);
    }

    public function test_impide_checkout_con_carrito_vacio()
    {
        // Usuario sin carrito
        $user = User::factory()->create();

        // Intentar checkout sin carrito
        $response = $this->actingAs($user)->postJson('/api/checkout');

        // Verificar error 400
        $response->assertStatus(400)
                ->assertJsonFragment([
                    'message' => 'Carrito no encontrado'
                ]);
    }

    public function test_impide_checkout_con_carrito_sin_items()
    {
        // Usuario con carrito vacío
        $user = User::factory()->create();
        $cart = Cart::create(['user_id' => $user->id]);

        // Intentar checkout con carrito vacío
        $response = $this->actingAs($user)->postJson('/api/checkout');

        // Verificar error 400
        $response->assertStatus(400)
                ->assertJsonFragment([
                    'message' => 'El carrito está vacío'
                ]);
    }

    public function test_usuario_no_autenticado_no_puede_hacer_checkout()
    {
        // Intentar checkout sin autenticación
        $response = $this->postJson('/api/checkout');

        // Verificar error 401
        $response->assertStatus(401)
                ->assertJsonFragment([
                    'message' => 'Unauthenticated.'
                ]);
    }

    public function test_checkout_actualiza_inventario_existente()
    {
        // Usuario con inventario previo
        $user = User::factory()->create();
        $pack = BoosterPack::create([
            'name' => 'Sobre Kamigawa',
            'price' => 10.00,
            'card_set_id' => $this->cardSet->code,
            'type' => 'draft',
            'config' => json_encode(['cards' => 15])
        ]);

        // Inventario previo: 3 unidades
        InventoryPack::create([
            'user_id' => $user->id,
            'booster_pack_id' => $pack->id,
            'quantity' => 3
        ]);

        // Carrito con 2 unidades más
        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'booster_pack_id' => $pack->id,
            'quantity' => 2
        ]);

        // Checkout
        $response = $this->actingAs($user)->postJson('/api/checkout');

        // Verificar éxito
        $response->assertStatus(200);

        // Verificar que el inventario se actualizó (3 + 2 = 5)
        $this->assertDatabaseHas('inventory_pack', [
            'user_id' => $user->id,
            'booster_pack_id' => $pack->id,
            'quantity' => 5
        ]);
    }
}
