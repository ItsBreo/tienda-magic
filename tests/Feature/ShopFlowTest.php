<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\boosterPack;
use App\Models\cardSet;
use App\Models\Cart;
use App\Models\cartItem;
use Inertia\Testing\AssertableInertia as Assert;

class ShopFlowTest extends TestCase
{
    use RefreshDatabase; // Borramos la DB despues de cada test para no dejar basura

    protected function setUp(): void
    {
        parent::setUp();

        // Evitamos que el test falle por faltar el 'npm run build' o archivos .tsx
        $this->withoutVite();
        config()->set('inertia.testing.ensure_pages_exist', false);


        // Creamos datos base para todos los tests
        // Creamos un Set de cartas
        $this->set = cardSet::create([
            'name' => 'Kamigawa: Neon Dynasty',
            'code' => 'NEO',
            'released_at' => now()
        ]);

        // Creamos dos Packs diferentes
        $this->pack1 = boosterPack::create([
            'name' => 'Sobre Draft Kamigawa',
            'price' => 4.50,
            'card_set_id' => $this->set->id,
            'type' => 'draft',
            'config' => json_encode(['cards' => 15])
        ]);

        $this->pack2 = boosterPack::create([
            'name' => 'Sobre Coleccionista Ixalan',
            'price' => 25.00,
            'card_set_id' => $this->set->id,
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
        $response = $this->get(route('shop.index'));

        $response->assertStatus(200)
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Shop/Catalog')
                    ->has('packs.data', 2) // Se esperan 2 productos
                );

        // Se prueba el filtro de Busqueda (Buscar 'Ixalan')
        $response = $this->get(route('shop.index', ['search' => 'Ixalan']));

        $response->assertStatus(200)
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Shop/Catalog')
                    ->has('packs.data', 1) // Solo debe salir 1
                    ->where('packs.data.0.name', 'Sobre Coleccionista Ixalan')
                );

        // Prueba de filtro por Tipo (Buscar 'draft')
        $response = $this->get(route('shop.index', ['type' => 'draft']));

        $response->assertStatus(200)
                ->assertInertia(fn (Assert $page) => $page
                    ->has('packs.data', 1)
                    ->where('packs.data.0.type', 'draft')
                );
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
                         ->post(route('cart.add'), [
                             'booster_pack_id' => $this->pack1->id,
                             'quantity' => 2
                         ]);

        // Verificamos la redirección y DB
        $response->assertRedirect();

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
        cartItem::create([
            'cart_id' => $cart->id,
            'booster_pack_id' => $this->pack1->id,
            'quantity' => 1
        ]);

        // Se añade el mismo producto 3 veces
        $this->actingAs($user)
             ->post(route('cart.add'), [
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

        $item = cartItem::create([
            'cart_id' => $cart->id,
            'booster_pack_id' => $this->pack1->id,
            'quantity' => 1
        ]);

        // Probamos a borrar un item
        $response = $this->actingAs($user)
                         ->delete(route('cart.destroy', $item->id));

        // Verificamos que se haya borrado
        $response->assertRedirect();
        $this->assertDatabaseMissing('cart_item', ['id' => $item->id]);
    }
}
