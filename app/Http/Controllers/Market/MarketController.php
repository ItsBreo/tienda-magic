<?php

namespace App\Http\Controllers\Market;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use OpenApi\Attributes as OA;

use App\Models\MarketListing;
use App\Models\MarketTransaction;
use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\Card;
use App\Models\BoosterPack;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Services\AuditLogger;

class MarketController extends Controller
{
    /**
     * Listado público del mercado con filtros.
     */
    #[OA\Get(
        path: "/api/market",
        summary: "Ver mercado",
        description: "Lista las cartas puestas a la venta en el marketplace.",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Listado del mercado")]
    public function index(Request $request)
    {
        $query = MarketListing::with(['listable', 'seller.profile'])->active();

        // Filtros
        if ($request->has('type')) {
            $type = $request->type === 'card' ? Card::class : BoosterPack::class;
            $query->where('listable_type', $type);
        }

        if ($request->has('set')) {
            $setParam = $request->set;
            $setArray = is_string($setParam) ? explode(',', $setParam) : (array)$setParam;
            $query->whereHasMorph('listable', [Card::class, BoosterPack::class], function ($q) use ($setArray) {
                $q->whereHas('set', function($sq) use ($setArray) {
                    $sq->whereIn('code', $setArray);
                });
            });
        }

        $listings = $query->latest()->paginate(20);

        // List of relevant sets for the marketplace
        $sets = \App\Models\CardSet::select('id', 'name', 'code')->get();

        return response()->json([
            'data' => $listings->items(),
            'current_page' => $listings->currentPage(),
            'last_page' => $listings->lastPage(),
            'total' => $listings->total(),
            'sets' => $sets
        ]);
    }

    /**
     * Detalle de un producto específico (Carta o Sobre) con todos sus vendedores.
     */
    public function show($type, $id)
    {
        $modelType = $type === 'card' ? Card::class : BoosterPack::class;
        $product = $modelType::with('set')->findOrFail($id);

        // Obtener todos los anuncios activos para este producto
        $listings = MarketListing::with('seller.profile')
            ->where('listable_type', $modelType)
            ->where('listable_id', $id)
            ->active()
            ->orderBy('price_total', 'asc')
            ->get();

        return response()->json([
            'product' => $product,
            'listings' => $listings
        ]);
    }

    /**
     * Poner un item a la venta (desde el inventario).
     */
    #[OA\Post(
        path: "/api/market/cards",
        summary: "Publicar carta en mercado",
        description: "Pone a la venta una carta del inventario del usuario.",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 201, description: "Carta publicada en el mercado")]
    public function store(Request $request)
    {
        $request->validate([
            'inventory_item_id' => 'required|integer',
            'type' => 'required|in:card,pack',
            'amount_to_seller' => 'required|numeric|min:0.01',
        ]);

        $user = Auth::user();
        $amountToSeller = $request->amount_to_seller;

        // Calcular comisión (mínimo 0.02 o 10%)
        $fee = max(0.02, round($amountToSeller * 0.10, 2));
        $priceTotal = $amountToSeller + $fee;

        return DB::transaction(function () use ($user, $request, $amountToSeller, $fee, $priceTotal) {
            if ($request->type === 'card') {
                $item = InventoryCard::where('user_id', $user->id)
                    ->lockForUpdate()
                    ->findOrFail($request->inventory_item_id);
                $listableId = $item->card_id;
                $listableType = Card::class;
            } else {
                $item = InventoryPack::where('user_id', $user->id)
                    ->lockForUpdate()
                    ->findOrFail($request->inventory_item_id);
                $listableId = $item->booster_pack_id;
                $listableType = BoosterPack::class;
            }

            // Validar disponibilidad en inventario
            if (($item->quantity - $item->quantity_locked) < 1) {
                return response()->json(['message' => 'No tienes unidades disponibles de este item.'], 422);
            }

            // Bloquear 1 unidad
            $item->increment('quantity_locked');

            $listing = MarketListing::create([
                'seller_id' => $user->id,
                'listable_id' => $listableId,
                'listable_type' => $listableType,
                'inventory_item_id' => $item->id,
                'price_total' => $priceTotal,
                'fee_platform' => $fee,
                'amount_to_seller' => $amountToSeller,
                'status' => 'active'
            ]);

            AuditLogger::log('market.listing_created', $listing, [
                'type' => $request->type,
                'price' => $priceTotal,
                'item_id' => $listableId
            ]);

            event(new \App\Events\CardListed($user));

            return response()->json([
                'message' => 'Item puesto a la venta con éxito',
                'listing' => $listing
            ], 201);
        });
    }

    /**
     * Iniciar proceso de compra (Billetera o Stripe).
     */
    #[OA\Post(
        path: "/api/market/cards/{id}/buy",
        summary: "Comprar carta",
        description: "Compra una carta que está listada en el mercado.",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID del listado/carta", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Compra exitosa")]
    public function initiatePurchase(Request $request, $id)
    {
        $request->validate([
            'payment_method' => 'required|in:wallet,stripe'
        ]);

        $buyer = Auth::user();

        return DB::transaction(function () use ($buyer, $request, $id) {
            $listing = MarketListing::lockForUpdate()->findOrFail($id);

            if ($listing->status !== 'active') {
                return response()->json(['message' => 'Este artículo ya no está disponible.'], 422);
            }

            if ($listing->seller_id === $buyer->id) {
                return response()->json(['message' => 'No puedes comprar tu propio artículo.'], 422);
            }

            // 1. Crear Orden (Referencia para factura)
            $order = \App\Models\Order::create([
                'user_id' => $buyer->id,
                'total_amount' => $listing->price_total,
                'payment_method' => $request->payment_method,
                'payment_status' => 'pending',
                'status' => 'pending'
            ]);

            // Crear item de orden
            \App\Models\OrderItem::create([
                'order_id' => $order->id,
                'purchasable_type' => $listing->listable_type,
                'purchasable_id' => $listing->listable_id,
                'quantity' => 1,
                'price_at_purchase' => $listing->price_total
            ]);

            if ($request->payment_method === 'wallet') {
                if ($buyer->wallet_balance < $listing->price_total) {
                    throw new \Exception('Saldo insuficiente en tu billetera.');
                }

                // Ejecutar transferencia
                $this->executeTransaction($listing, $buyer, $order);

                return response()->json([
                    'success' => true,
                    'message' => 'Compra completada con éxito',
                    'order_id' => $order->id
                ]);
            } else {
                // Stripe
                \Stripe\Stripe::setApiKey(config('services.stripe.secret'));
                $session = \Stripe\Checkout\Session::create([
                    'payment_method_types' => ['card'],
                    'line_items' => [[
                        'price_data' => [
                            'currency' => 'eur',
                            'product_data' => [
                                'name' => 'Compra Mercado: ' . $listing->listable->name,
                                'description' => 'Vendedor: ' . $listing->seller->username
                            ],
                            'unit_amount' => $listing->price_total * 100,
                        ],
                        'quantity' => 1,
                    ]],
                    'mode' => 'payment',
                    'success_url' => config('app.url') . '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
                    'cancel_url' => config('app.url') . '/market',
                    'metadata' => [
                        'order_id' => $order->id,
                        'market_listing_id' => $listing->id,
                        'type' => 'market'
                    ]
                ]);

                $order->update(['stripe_session_id' => $session->id]);

                return response()->json([
                    'success' => true,
                    'checkout_url' => $session->url
                ]);
            }
        });
    }

    /**
     * Lógica compartida para ejecutar la transferencia.
     */
    private function executeTransaction($listing, $buyer, $order)
    {
        // 1. Transferencia Monetaria
        $buyer->decrement('wallet_balance', $listing->price_total);
        $listing->seller->increment('wallet_balance', $listing->amount_to_seller);

        // 2. Transferencia de Propiedad
        if ($listing->listable_type === Card::class) {
            $sellerItem = InventoryCard::findOrFail($listing->inventory_item_id);
            $sellerItem->decrement('quantity');
            $sellerItem->decrement('quantity_locked');

            $buyerItem = InventoryCard::firstOrNew([
                'user_id' => $buyer->id,
                'card_id' => $listing->listable_id,
                'condition' => $sellerItem->condition,
                'language' => $sellerItem->language,
                'is_foil' => $sellerItem->is_foil,
            ]);
            $buyerItem->quantity = ($buyerItem->quantity ?? 0) + 1;
            $buyerItem->save();
        } else {
            $sellerItem = InventoryPack::findOrFail($listing->inventory_item_id);
            $sellerItem->decrement('quantity');
            $sellerItem->decrement('quantity_locked');

            $buyerItem = InventoryPack::firstOrNew([
                'user_id' => $buyer->id,
                'booster_pack_id' => $listing->listable_id,
            ]);
            $buyerItem->quantity = ($buyerItem->quantity ?? 0) + 1;
            $buyerItem->save();
        }

        AuditLogger::log('market.item_sold', $listing, [
            'buyer_id' => $buyer->id,
            'buyer_name' => $buyer->name,
            'seller_id' => $listing->seller_id,
            'seller_name' => $listing->seller->name,
            'item_name' => $listing->listable->name ?? 'Unknown',
            'price' => $listing->price_total
        ]);

        // 3. Cerrar Anuncio
        $listing->update(['status' => 'sold', 'buyer_id' => $buyer->id]);

        // 4. Log de Transacción
        MarketTransaction::create([
            'seller_id' => $listing->seller_id,
            'buyer_id' => $buyer->id,
            'sellable_id' => $listing->listable_id,
            'sellable_type' => $listing->listable_type,
            'price_total' => $listing->price_total,
            'fee_platform' => $listing->fee_platform,
            'amount_to_seller' => $listing->amount_to_seller,
            'item_details' => [
                'name' => $listing->listable->name,
                'order_id' => $order->id
            ]
        ]);

        $order->update(['payment_status' => 'completed', 'status' => 'completed']);

        // Triggers de Logros
        if ($listing->listable_type === Card::class) {
            event(new \App\Events\CardPurchased($buyer));
        } else {
            event(new \App\Events\PackPurchased($buyer));
        }
        event(new \App\Events\TransactionCompleted($buyer));
    }

    /**
     * Gráfico de precios para un item.
     */
    public function getPriceHistory($type, $id)
    {
        $modelType = $type === 'card' ? Card::class : BoosterPack::class;
        
        // 1. Obtener historial de precios del mercado (snapshots)
        $marketHistory = \App\Models\CardPriceHistory::where('priceable_id', $id)
            ->where('priceable_type', $modelType)
            ->orderBy('recorded_at', 'asc')
            ->get()
            ->map(function($h) {
                return [
                    'price' => $h->price,
                    'recorded_at' => $h->recorded_at,
                    'is_market' => true
                ];
            });

        // 2. Obtener historial de ventas reales en la tienda
        $salesHistory = \App\Models\MarketTransaction::where('sellable_id', $id)
            ->where('sellable_type', $modelType)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function($t) {
                return [
                    'price' => $t->price_total,
                    'recorded_at' => $t->created_at,
                    'is_sale' => true
                ];
            });

        // Combinar y ordenar por fecha
        $combinedHistory = $marketHistory->concat($salesHistory)->sortBy('recorded_at')->values();

        return response()->json($combinedHistory);
    }

    /**
     * Mis anuncios activos.
     */
    public function myListings()
    {
        $user = Auth::user();
        $listings = MarketListing::with(['listable'])
            ->where('seller_id', $user->id)
            ->active()
            ->latest()
            ->paginate(20);

        return response()->json($listings);
    }

    /**
     * Cancelar un anuncio.
     */
    public function cancelListing($id)
    {
        $user = Auth::user();
        
        return DB::transaction(function () use ($user, $id) {
            $listing = MarketListing::where('seller_id', $user->id)
                ->lockForUpdate()
                ->findOrFail($id);

            if ($listing->status !== 'active') {
                return response()->json(['message' => 'Solo se pueden cancelar anuncios activos.'], 422);
            }

            // Desbloquear item
            if ($listing->listable_type === Card::class) {
                $item = InventoryCard::findOrFail($listing->inventory_item_id);
            } else {
                $item = InventoryPack::findOrFail($listing->inventory_item_id);
            }
            $item->decrement('quantity_locked');

            $listing->update(['status' => 'cancelled']);

            AuditLogger::log('market.listing_cancelled', $listing);

            return response()->json(['message' => 'Anuncio cancelado con éxito']);
        });
    }
}
