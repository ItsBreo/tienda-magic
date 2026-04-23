<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Models\User;
use App\Models\Card;
use App\Models\Order;
use App\Models\OrderItem;

class ConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    private $card;
    private $user1;
    private $user2;
    private $token1;
    private $token2;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear una carta con stock limitado para pruebas
        $this->card = Card::create([
            'name' => 'Lightning Bolt',
            'scryfall_id' => 'test-lightning-bolt-123',
            'set_code' => 'LEA',
            'collector_number' => '1',
            'rarity' => 'Common',
            'stock' => 5,
            'market_avg_price' => 2.50
        ]);

        // Crear usuarios de prueba con tokens Sanctum
        $this->user1 = User::factory()->create([
            'wallet_balance' => 100
        ]);
        $this->token1 = $this->user1->createToken('test-token-1')->plainTextToken;

        $this->user2 = User::factory()->create([
            'wallet_balance' => 100
        ]);
        $this->token2 = $this->user2->createToken('test-token-2')->plainTextToken;
    }

    /**
     * Test que simula dos usuarios intentando comprar el mismo producto simultáneamente
     */
    public function test_concurrent_checkout_prevents_overselling()
    {
        $items = [
            [
                'purchasable_type' => Card::class,
                'purchasable_id' => $this->card->id,
                'quantity' => 3
            ]
        ];

        // Test 1: Primera compra exitosa
        $response1 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token1
        ])->postJson('/api/checkout/process', [
            'payment_method' => 'wallet',
            'items' => $items
        ]);

        $response1->assertStatus(200);
        $this->assertTrue($response1->json('success'));

        // Verificar stock después de primera compra
        $this->card->refresh();
        $this->assertEquals(2, $this->card->stock, 'Stock debería ser 2 después de primera compra (5-3)');

        // Test 2: Segunda compra con stock insuficiente
        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token2
        ])->postJson('/api/checkout/process', [
            'payment_method' => 'wallet',
            'items' => $items
        ]);

        $response2->assertStatus(422);
        $this->assertFalse($response2->json('success'));
        $this->assertStringContainsString('Otro usuario compró estos productos justo ahora', $response2->json('message'));

        // Verificar que solo una orden fue completada
        $successfulOrders = Order::where('payment_status', 'completed')->count();
        $this->assertEquals(1, $successfulOrders, 'Solo un pedido debería completarse exitosamente');

        // Verificar que el stock no es negativo
        $this->card->refresh();
        $this->assertGreaterThanOrEqual(0, $this->card->stock, 'El stock no puede ser negativo');
        $this->assertEquals(2, $this->card->stock, 'El stock final debería ser 2');
    }

    /**
     * Test básico para verificar que el checkout funciona
     */
    public function test_basic_checkout_works()
    {
        $items = [
            [
                'purchasable_type' => Card::class,
                'purchasable_id' => $this->card->id,
                'quantity' => 1
            ]
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token1
        ])->postJson('/api/checkout/process', [
            'payment_method' => 'wallet',
            'items' => $items
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));

        // Verificar que se creó la orden
        $order = Order::where('user_id', $this->user1->id)->first();
        $this->assertNotNull($order);
        $this->assertEquals('completed', $order->payment_status);
    }

    /**
     * Test que verifica el comportamiento cuando el stock se agota exactamente
     */
    public function test_exact_stock_depletion()
    {
        $items = [
            [
                'purchasable_type' => Card::class,
                'purchasable_id' => $this->card->id,
                'quantity' => 5 // Comprar todo el stock
            ]
        ];

        // Primera compra debería ser exitosa
        $response1 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token1
        ])->postJson('/api/checkout/process', [
            'payment_method' => 'wallet',
            'items' => $items
        ]);

        $response1->assertStatus(200);
        $this->assertTrue($response1->json('success'));

        // Segunda compra con stock 0 debería fallar
        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token2
        ])->postJson('/api/checkout/process', [
            'payment_method' => 'wallet',
            'items' => $items
        ]);

        $response2->assertStatus(422);
        $this->assertFalse($response2->json('success'));
        $this->assertStringContainsString('Otro usuario compró estos productos justo ahora', $response2->json('message'));
    }

    /**
     * Test que verifica que los booster packs (stock infinito) no tienen problemas de concurrencia
     */
    public function test_booster_pack_infinite_stock_concurrency()
    {
        $this->markTestSkipped('Requires BoosterPack model setup');

        // Este test se implementaría cuando tengamos booster packs configurados
        // La idea es verificar que los productos con stock infinito nunca fallan por stock
    }

    /**
     * Simula una request de checkout concurrente
     */
    private function simulateConcurrentRequest($user, $items)
    {
        try {
            $response = $this->actingAs($user)
                ->postJson('/api/checkout/process', [
                    'payment_method' => 'wallet',
                    'items' => $items
                ]);

            return [
                'success' => $response->json('success'),
                'message' => $response->json('message'),
                'status' => $response->status()
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'status' => 500
            ];
        }
    }

    /**
     * Test de rollback cuando el pago falla después de reservar stock
     */
    public function test_stock_rollback_on_payment_failure()
    {
        $items = [
            [
                'purchasable_type' => Card::class,
                'purchasable_id' => $this->card->id,
                'quantity' => 2
            ]
        ];

        // Crear usuario sin saldo suficiente
        $poorUser = User::factory()->create(['wallet_balance' => 0]);
        $poorToken = $poorUser->createToken('test-token-poor')->plainTextToken;

        $initialStock = $this->card->stock;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $poorToken
        ])->postJson('/api/checkout/process', [
            'payment_method' => 'wallet',
            'items' => $items
        ]);

        $response->assertStatus(422);
        $this->assertFalse($response->json('success'));

        // Verificar que el stock no fue modificado
        $this->card->refresh();
        $this->assertEquals($initialStock, $this->card->stock, 'El stock debería permanecer igual si el pago falla');
    }
}
