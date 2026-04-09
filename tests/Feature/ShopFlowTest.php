<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\BoosterPack;
use App\Models\CardSet;
use App\Models\Cart;
use App\Models\CartItem;
// use Inertia\Testing\AssertableInertia as Assert;

class ShopFlowTest extends TestCase
{
    use RefreshDatabase; // Borramos la DB despues de cada test para no dejar basura

    protected function setUp(): void
    {
        parent::setUp();

        // Evitamos que el test falle por faltar el 'npm run build' o archivos .tsx
        $this->withoutVite();
        // config()->set('inertia.testing.ensure_pages_exist', false);


        // Creamos datos base para todos los tests
        // Creamos un Set de cartas
        $this->set = CardSet::create([
            'name' => 'Kamigawa: Neon Dynasty',
            'code' => 'NEO',
            'released_at' => now()
        ]);

        // Creamos dos Packs diferentes
        $this->pack1 = BoosterPack::create([
            'name' => 'Sobre Draft Kamigawa',
            'price' => 4.50,
            'card_set_id' => $this->set->code,
            'type' => 'draft',
            'config' => json_encode(['cards' => 15])
        ]);

        $this->pack2 = BoosterPack::create([
            'name' => 'Sobre Coleccionista Ixalan',
            'price' => 25.00,
            'card_set_id' => $this->set->code,
            'type' => 'collector',
            'config' => json_encode(['cards' => 15])
        ]);
    }
    /*  ------------------------
        --- Test de Catalogo ---
        ------------------------
    */
    public function test_catalogo_muestra_productos_y_filtros_funcionan()
    {
        // Visualización del catalogo sin filtros (deben salir los 2 boosterPacks)
        $response = $this->getJson('/api/shop');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'packs' => [
                            'data' => [
                                '*' => [
                                    'id',
                                    'name',
                                    'price',
                                    'type'
                                ]
                            ]
                        ]
                    ]
                ]);

        // Se prueba el filtro de Busqueda (Buscar 'Ixalan')
        $response = $this->getJson('/api/shop?search=Ixalan');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'packs' => [
                            'data' => [
                                '*' => [
                                    'id',
                                    'name',
                                    'price',
                                    'type'
                                ]
                            ]
                        ]
                    ]
                ])
                ->assertJsonFragment([
                    'name' => 'Sobre Coleccionista Ixalan'
                ]);

        // Prueba de filtro por Tipo (Buscar 'draft')
        $response = $this->getJson('/api/shop?type=draft');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'packs' => [
                            'data' => [
                                '*' => [
                                    'id',
                                    'name',
                                    'price',
                                    'type'
                                ]
                            ]
                        ]
                    ]
                ])
                ->assertJsonFragment([
                    'type' => 'draft'
                ]);
    }

    /*  ---------------------------------
        --- Test de añadir al Carrito ---
        ---------------------------------
    */
    public function test_usuario_puede_anadir_producto_al_carrito()
    {
        $user = User::factory()->create();

        // Añadimos 2 unidades del Pack 1
        $response = $this->actingAs($user)
                         ->postJson('/api/cart', [
                             'booster_pack_id' => $this->pack1->id,
                             'quantity' => 2
                         ]);

        // Verificamos respuesta JSON exitosa
        $response->assertStatus(201)
                ->assertJsonFragment([
                    'message' => 'Producto añadido al carrito'
                ]);

        // Verificamos la DB
        $this->assertDatabaseHas('cart_item', [
            'booster_pack_id' => $this->pack1->id,
            'quantity' => 2
        ]);
    }

    /*  ------------------------------
        ---   Test de incremento   ---
        --- de quantity en Carrito ---
        ------------------------------
    */
    public function test_anadir_mismo_producto_suma_cantidad()
    {
        $user = User::factory()->create();
        $cart = Cart::create(['user_id' => $user->id]);

        // Ya tenemos un item en el carrito
        CartItem::create([
            'cart_id' => $cart->id,
            'booster_pack_id' => $this->pack1->id,
            'quantity' => 1
        ]);

        // Se añade el mismo producto 3 veces
        $response = $this->actingAs($user)
             ->postJson('/api/cart', [
                 'booster_pack_id' => $this->pack1->id,
                 'quantity' => 3
             ]);

        // Verificamos que se haya aumentado la cantidad a 4
        $this->assertDatabaseHas('cart_item', [
            'cart_id' => $cart->id,
            'booster_pack_id' => $this->pack1->id,
            'quantity' => 4
        ]);
    }

    /*  -----------------------------
        --- Test eliminar product ---
        ---      del carrito      ---
        -----------------------------
    */
    public function test_usuario_puede_borrar_item_del_carrito()
    {
        $user = User::factory()->create();
        $cart = Cart::create(['user_id' => $user->id]);

        $item = CartItem::create([
            'cart_id' => $cart->id,
            'booster_pack_id' => $this->pack1->id,
            'quantity' => 1
        ]);

        // Probamos a borrar un item
        $response = $this->actingAs($user)
                         ->deleteJson("/api/cart/{$item->id}");

        // Verificamos respuesta JSON exitosa
        $response->assertStatus(200)
                ->assertJsonFragment([
                    'message' => 'Producto eliminado del carrito'
                ]);

        // Verificamos que se haya borrado
        $this->assertDatabaseMissing('cart_item', ['id' => $item->id]);
    }
}
