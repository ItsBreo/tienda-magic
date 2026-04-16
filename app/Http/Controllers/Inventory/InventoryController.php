<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // Añadido para optimizar los cálculos de stats
use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\Card;
use App\Models\User;
use App\Models\Market;

class InventoryController extends Controller
{
    /**
     * Muestra inventario del usuario autenticado con cartas y estadísticas.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $searchTerm = $request->input('search');
            $selectedSets = $request->input('sets');
            $sortBy = $request->input('sort', 'newest');

            // Log de entrada para depuración
            \Illuminate\Support\Facades\Log::debug('Inventory search attempt', [
                'user_id' => $user->id,
                'search' => $searchTerm,
                'sets' => $selectedSets,
                'sort' => $sortBy
            ]);

            // Consulta base con prefijos claros (SINGULAR: inventory_card)
            $query = InventoryCard::where('inventory_card.user_id', $user->id)
                ->where('inventory_card.quantity', '>', 0)
                ->select('inventory_card.*') 
                ->with(['card.set']);

            // Filtro por búsqueda de nombre (Case-insensitive para PostgreSQL usando ILIKE o LOWER)
            if (!empty($searchTerm)) {
                $query->whereHas('card', function($q) use ($searchTerm) {
                    $q->where('cards.name', 'ILIKE', '%' . $searchTerm . '%');
                });
            }

            // Filtro por sets seleccionado (Case-insensitive para PostgreSQL)
            if (!empty($selectedSets)) {
                if (is_string($selectedSets)) {
                    $selectedSets = array_values(array_filter(explode(',', $selectedSets)));
                }
                
                if (!empty($selectedSets)) {
                    $query->whereHas('card', function($q) use ($selectedSets) {
                        // Convertimos todo a minúsculas para comparar de forma segura en Postgres
                        $lowerSets = array_map('strtolower', $selectedSets);
                        $q->whereRaw('LOWER(cards.set_code) IN (' . implode(',', array_fill(0, count($lowerSets), '?')) . ')', $lowerSets);
                    });
                }
            }

            // Ordenamiento con joins protegidos (SINGULAR: inventory_card)
            switch ($sortBy) {
                case 'name_asc':
                    $query->join('cards', 'inventory_card.card_id', '=', 'cards.id')
                          ->orderBy('cards.name', 'asc');
                    break;
                case 'name_desc':
                    $query->join('cards', 'inventory_card.card_id', '=', 'cards.id')
                          ->orderBy('cards.name', 'desc');
                    break;
                case 'price_asc':
                    $query->join('cards', 'inventory_card.card_id', '=', 'cards.id')
                          ->orderBy('cards.market_avg_price', 'asc');
                    break;
                case 'price_desc':
                    $query->join('cards', 'inventory_card.card_id', '=', 'cards.id')
                          ->orderBy('cards.market_avg_price', 'desc');
                    break;
                case 'newest':
                default:
                    $query->orderBy('inventory_card.id', 'desc');
                    break;
            }

            $inventoryCardsPaginated = $query->paginate(24);

            $inventoryCards = $inventoryCardsPaginated->through(function($item) {
                return [
                    'id' => $item->id,
                    'user_id' => $item->user_id,
                    'card_id' => $item->card_id,
                    'quantity' => $item->quantity,
                    'quantity_locked' => $item->quantity_locked,
                    'is_foil' => $item->is_foil,
                    'condition' => $item->condition,
                    'language' => $item->language,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                    'card' => $item->card ? [
                        'id' => $item->card->id,
                        'name' => $item->card->name,
                        'image_url' => $item->card->image_url,
                        'image_uri' => $item->card->image_uri,
                        'image_uris' => $item->card->data['image_uris'] ?? null,
                        'rarity' => $item->card->rarity,
                        'market_avg_price' => $item->card->market_avg_price,
                        'set' => $item->card->set
                    ] : null
                ];
            });

            // Sobres (SINGULAR: inventory_pack)
            $inventoryPacksRaw = InventoryPack::where('inventory_pack.user_id', $user->id)
                ->where('inventory_pack.quantity', '>', 0)
                ->with('boosterPack.set')
                ->get();

            $inventoryPacks = $inventoryPacksRaw->map(function($item) {
                return [
                    'id' => $item->id,
                    'user_id' => $item->user_id,
                    'booster_pack_id' => $item->booster_pack_id,
                    'quantity' => $item->quantity,
                    'quantity_locked' => $item->quantity_locked,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                    'booster_pack' => $item->boosterPack ? [
                        'id' => $item->boosterPack->id,
                        'name' => $item->boosterPack->name,
                        'price' => $item->boosterPack->price,
                        'image_uri' => $item->boosterPack->image_uri,
                        'type' => $item->boosterPack->type,
                        'set' => $item->boosterPack->set
                    ] : null
                ];
            });

            $totalCards = InventoryCard::where('user_id', $user->id)->sum('quantity');
            $totalPacks = InventoryPack::where('user_id', $user->id)->sum('quantity');

            return response()->json([
                'inventoryCards' => $inventoryCards,
                'inventoryPacks' => $inventoryPacks,
                'stats' => [
                    'totalCards' => $totalCards,
                    'totalPacks' => $totalPacks,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Inventory Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error al cargar el inventario'], 500);
        }
    }

    /**
     * Muestra inventario público de otro usuario si es accesible.
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function userInventory($userId)
    {
        $user = User::findOrFail($userId);

        // Verificar si el inventario es público
        $preference = $user->preference ?? null;
        if (!$preference || !$preference->is_inventory_public) {
            // Si no es público, solo muestra si es el usuario autenticado
            if (Auth::id() !== (int) $userId) {
                return response()->json([
                    'error' => 'El inventario de este planeswalker es privado'
                ], 403);
            }
        }

        $inventoryCards = InventoryCard::where('user_id', $userId)
            ->with('card.set')
            ->paginate(24);

        $totalCards = InventoryCard::where('user_id', $userId)->sum('quantity');

        return response()->json([
            // Solo enviamos datos públicos del usuario
            'user' => $user->only(['id', 'name', 'username']),
            'inventoryCards' => $inventoryCards,
            'stats' => [
                'totalCards' => $totalCards,
            ]
        ]);
    }

    /**
     * Muestra items del inventario del usuario actualmente en venta.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function showInventoryInSale()
    {
        $user = Auth::user();

        $cardsInSale = InventoryCard::where('user_id', $user->id)
            ->whereHas('marketListings', function($query) {
                $query->where('status', 'active');
            })
            ->with(['card.set', 'marketListings' => function($query) {
                $query->where('status', 'active');
            }])
            ->paginate(24);

        return response()->json([
            'cardsInSale' => $cardsInSale,
        ]);
    }

    /**
     * Muestra items en venta de otro usuario.
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function userInSale($userId)
    {
        $user = User::findOrFail($userId);

        $cardsInSale = InventoryCard::where('user_id', $userId)
            ->whereHas('marketListings', function($query) {
                $query->where('status', 'active');
            })
            ->with(['card.set', 'marketListings' => function($query) {
                $query->where('status', 'active');
            }])
            ->paginate(24);

        return response()->json([
            'user' => $user->only(['id', 'name', 'username']),
            'cardsInSale' => $cardsInSale,
        ]);
    }

    /**
     * Muestra estadísticas completas del inventario del usuario autenticado.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function stats()
    {
        $user = Auth::user();

        $totalCards = InventoryCard::where('user_id', $user->id)->sum('quantity');
        $totalCardTypes = InventoryCard::where('user_id', $user->id)->count();
        $totalPacks = InventoryPack::where('user_id', $user->id)->sum('quantity');

        $cardsInSale = InventoryCard::where('user_id', $user->id)
            ->whereHas('marketListings', function($query) {
                $query->where('status', 'active');
            })
            ->count();

        // ¡OPTIMIZACIÓN CRÍTICA!
        // Antes cargabas todas las cartas en RAM para multiplicarlas.
        // Ahora le decimos a la base de datos que haga la multiplicación por nosotros usando JOIN.
        $totalValue = InventoryCard::where('user_id', $user->id)
            ->join('cards', 'inventory_card.card_id', '=', 'cards.id')
            ->sum(DB::raw('inventory_card.quantity * COALESCE(cards.market_avg_price, 0)'));

        return response()->json([
            'totalCards' => $totalCards,
            'totalCardTypes' => $totalCardTypes,
            'totalPacks' => $totalPacks,
            'cardsInSale' => $cardsInSale,
            'estimatedValue' => round($totalValue, 2)
        ]);
    }

    /**
     * Filtra y busca dentro del inventario del usuario autenticado.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function filter(Request $request)
    {
        $user = Auth::user();

        $query = InventoryCard::where('user_id', $user->id)
            ->where('quantity', '>', 0)
            ->with('card.set');

        // Búsqueda por nombre de carta con sanitización XSS
        if ($request->has('search') && $request->search) {
            $search = htmlspecialchars(strip_tags($request->search), ENT_QUOTES, 'UTF-8');
            $query->whereHas('card', function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            });
        }

        if ($request->has('condition') && $request->condition) {
            $query->where('condition', $request->condition);
        }

        if ($request->has('language') && $request->language) {
            $query->where('language', $request->language);
        }

        if ($request->has('is_foil')) {
            $query->where('is_foil', $request->boolean('is_foil'));
        }

        if ($request->has('inSale')) {
            if ($request->boolean('inSale')) {
                $query->whereHas('marketListings', function($q) {
                    $q->where('status', 'active');
                });
            } else {
                $query->whereDoesntHave('marketListings', function($q) {
                    $q->where('status', 'active');
                });
            }
        }

        $inventoryCards = $query->paginate(24);

        return response()->json([
            'inventoryCards' => $inventoryCards,
            'filters' => $request->all()
        ]);
    }

    /**
     * Añade cartas al inventario del usuario autenticado.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addCard(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'card_id' => 'required|exists:cards,id',
            'quantity' => 'required|integer|min:1',
            'is_foil' => 'boolean',
            'condition' => 'required|in:NM,LP,MP,HP',
            'language' => 'required|string|max:2'
        ]);

        $existingCard = InventoryCard::where('user_id', $user->id)
            ->where('card_id', $validated['card_id'])
            ->where('is_foil', $validated['is_foil'] ?? false)
            ->where('condition', $validated['condition'])
            ->where('language', $validated['language'])
            ->first();

        if ($existingCard) {
            $existingCard->increment('quantity', $validated['quantity']);
            $message = 'Cantidad actualizada en el inventario';
        } else {
            $inventoryCard = InventoryCard::create([
                'user_id' => $user->id,
                'card_id' => $validated['card_id'],
                'quantity' => $validated['quantity'],
                'is_foil' => $validated['is_foil'] ?? false,
                'condition' => $validated['condition'],
                'language' => $validated['language']
            ]);
            $message = 'Carta añadida al inventario';
        }

        return response()->json(['message' => $message], 201);
    }

    /**
     * Actualiza detalles de carta en inventario del usuario autenticado.
     *
     * @param Request $request
     * @param int $inventoryCardId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCard(Request $request, $inventoryCardId)
    {
        $user = Auth::user();
        $inventoryCard = InventoryCard::findOrFail($inventoryCardId);

        if ($inventoryCard->user_id !== $user->id) {
            return response()->json(['error' => 'No tienes permiso para actualizar esta carta'], 403);
        }

        $validated = $request->validate([
            'quantity' => 'sometimes|integer|min:1',
            'condition' => 'sometimes|in:NM,LP,MP,HP',
            'language' => 'sometimes|string|max:2'
        ]);

        $inventoryCard->update($validated);

        return response()->json([
            'message' => 'Carta actualizada correctamente',
            'inventoryCard' => $inventoryCard
        ]);
    }

    /**
     * Lista carta de inventario para venta en marketplace.
     *
     * @param Request $request
     * @param int $inventoryCardId
     * @return \Illuminate\Http\JsonResponse
     */
    public function listForSale(Request $request, $inventoryCardId)
    {
        $user = Auth::user();
        $inventoryCard = InventoryCard::findOrFail($inventoryCardId);

        if ($inventoryCard->user_id !== $user->id) {
            return response()->json(['error' => 'No tienes permiso para vender esta carta'], 403);
        }

        $validated = $request->validate([
            'price_per_card' => 'required|numeric|min:0.01',
            'quantity' => 'required|integer|min:1|max:' . ($inventoryCard->quantity - $inventoryCard->quantity_locked)
        ]);

        $marketListing = new Market();
        $marketListing->seller_id = $user->id;
        $marketListing->inventory_card_id = $inventoryCardId;

        $marketListing->quantity = $validated['quantity'];

        $marketListing->price_total = $validated['price_per_card'] * $validated['quantity'];
        $marketListing->fee_platform = $marketListing->price_total * 0.10;
        $marketListing->amount_to_seller = $marketListing->price_total - $marketListing->fee_platform;
        $marketListing->status = 'active';
        $marketListing->listed_at = now();
        $marketListing->save();

        // Bloquear cantidad exacta que se puso a la venta
        $inventoryCard->increment('quantity_locked', $validated['quantity']);

        return response()->json([
            'message' => 'Carta listada para venta correctamente',
            'marketListing' => $marketListing
        ], 201);
    }

    /**
     * Quita carta de venta en marketplace.
     *
     * @param int $marketListingId
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeFromSale($marketListingId)
    {
        $user = Auth::user();
        $marketListing = Market::findOrFail($marketListingId);

        if ($marketListing->seller_id !== $user->id) {
            return response()->json(['error' => 'No tienes permiso para eliminar este listado'], 403);
        }

        if ($marketListing->status !== 'active') {
            return response()->json(['error' => 'Este listado ya no está activo'], 400);
        }

        $inventoryCard = $marketListing->inventoryCard;

        // ¡CORRECCIÓN! Usamos la cantidad real guardada para desbloquear, en vez de matemáticas locas.
        $inventoryCard->decrement('quantity_locked', $marketListing->quantity);

        $marketListing->status = 'cancelled';
        $marketListing->save();

        return response()->json(['message' => 'Carta removida de la venta correctamente']);
    }

    /**
     * Elimina carta del inventario del usuario autenticado.
     *
     * @param int $inventoryCardId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteCard($inventoryCardId)
    {
        $user = Auth::user();
        $inventoryCard = InventoryCard::findOrFail($inventoryCardId);

        if ($inventoryCard->user_id !== $user->id) {
            return response()->json(['error' => 'No tienes permiso para eliminar esta carta'], 403);
        }

        if ($inventoryCard->quantity_locked > 0) {
            return response()->json(['error' => 'No puedes eliminar cartas que están a la venta. Cancela el listado primero.'], 400);
        }

        $inventoryCard->delete();

        return response()->json(['message' => 'Carta eliminada de tu colección correctamente']);
    }
}
