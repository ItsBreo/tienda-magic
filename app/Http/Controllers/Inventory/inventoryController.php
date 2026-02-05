<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\Card;
use App\Models\User;
use App\Models\Market;

class InventoryController extends Controller
{
    /**
     * Ver el inventario del usuario autenticado
     */
    public function index()
    {
        $user = Auth::user();

        $inventoryCards = InventoryCard::where('user_id', $user->id)
            ->with('card')
            ->get();

        $inventoryPacks = InventoryPack::where('user_id', $user->id)
            ->with('boosterPack')
            ->get();

        return Inertia::render('Inventory/Index', [
            'inventoryCards' => $inventoryCards,
            'inventoryPacks' => $inventoryPacks,
            'totalCards' => $inventoryCards->sum('quantity'),
            'totalPacks' => $inventoryPacks->sum('quantity'),
        ]);
    }

    /**
     * Ver el inventario de otro usuario (si es público)
     */
    public function userInventory($userId)
    {
        $user = User::findOrFail($userId);

        // Verificar si el inventario es público
        $preference = $user->preference ?? null;
        if (!$preference || !$preference->is_inventory_public) {
            // Si no es público, solo muestra si es el usuario autenticado
            if (Auth::id() !== $userId) {
                return response()->json([
                    'error' => 'El inventario de este usuario es privado'
                ], 403);
            }
        }

        $inventoryCards = InventoryCard::where('user_id', $userId)
            ->with('card')
            ->get();

        $inventoryPacks = InventoryPack::where('user_id', $userId)
            ->with('boosterPack')
            ->get();

        return Inertia::render('Inventory/UserPublic', [
            'user' => $user,
            'inventoryCards' => $inventoryCards,
            'inventoryPacks' => $inventoryPacks,
            'totalCards' => $inventoryCards->sum('quantity'),
            'totalPacks' => $inventoryPacks->sum('quantity'),
        ]);
    }

    /**
     * Inventario puesto en venta del usuario autenticado
     */
    public function showInventoryInSale()
    {
        $user = Auth::user();

        $cardsInSale = InventoryCard::where('user_id', $user->id)
            ->whereHas('marketListings', function($query) {
                $query->where('status', 'active');
            })
            ->with(['card', 'marketListings' => function($query) {
                $query->where('status', 'active');
            }])
            ->get();

        return Inertia::render('Inventory/InSale', [
            'cardsInSale' => $cardsInSale,
            'totalListings' => $cardsInSale->count(),
        ]);
    }

    /**
     * Ver cartas en venta de otro usuario
     */
    public function userInSale($userId)
    {
        $user = User::findOrFail($userId);

        $cardsInSale = InventoryCard::where('user_id', $userId)
            ->whereHas('marketListings', function($query) {
                $query->where('status', 'active');
            })
            ->with(['card', 'marketListings' => function($query) {
                $query->where('status', 'active');
            }])
            ->get();

        return Inertia::render('Inventory/UserSelling', [
            'user' => $user,
            'cardsInSale' => $cardsInSale,
            'totalListings' => $cardsInSale->count(),
        ]);
    }

    /**
     * Estadísticas del inventario del usuario autenticado
     */
    public function stats()
    {
        $user = Auth::user();

        $totalCards = InventoryCard::where('user_id', $user->id)
            ->sum('quantity');

        $totalCardsTypes = InventoryCard::where('user_id', $user->id)
            ->count();

        $totalPacks = InventoryPack::where('user_id', $user->id)
            ->sum('quantity');

        $cardsInSale = InventoryCard::where('user_id', $user->id)
            ->whereHas('marketListings', function($query) {
                $query->where('status', 'active');
            })
            ->count();

        $totalValue = InventoryCard::where('user_id', $user->id)
            ->with('card')
            ->get()
            ->sum(function($item) {
                return $item->quantity * ($item->card->market_avg_price ?? 0);
            });

        return response()->json([
            'totalCards' => $totalCards,
            'totalCardTypes' => $totalCardsTypes,
            'totalPacks' => $totalPacks,
            'cardsInSale' => $cardsInSale,
            'estimatedValue' => round($totalValue, 2)
        ]);
    }

    /**
     * Filtrar y buscar en el inventario
     */
    public function filter(Request $request)
    {
        $user = Auth::user();

        $query = InventoryCard::where('user_id', $user->id)
            ->with('card');

        // Búsqueda por nombre de carta
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('card', function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            });
        }

        // Filtrar por condición
        if ($request->has('condition') && $request->condition) {
            $query->where('condition', $request->condition);
        }

        // Filtrar por idioma
        if ($request->has('language') && $request->language) {
            $query->where('language', $request->language);
        }

        // Filtrar por foil
        if ($request->has('is_foil')) {
            $query->where('is_foil', $request->get('is_foil') === 'true');
        }

        // Filtrar por disponibilidad en venta
        if ($request->has('inSale')) {
            if ($request->get('inSale') === 'true') {
                $query->whereHas('marketListings', function($q) {
                    $q->where('status', 'active');
                });
            } else {
                $query->whereDoesntHave('marketListings', function($q) {
                    $q->where('status', 'active');
                });
            }
        }

        $inventoryCards = $query->paginate(20);

        return Inertia::render('Inventory/Filtered', [
            'inventoryCards' => $inventoryCards,
            'filters' => $request->all()
        ]);
    }

    /**
     * Agregar cartas al inventario
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

        return response()->json([
            'message' => $message
        ], 201);
    }

    /**
     * Actualizar cartas en el inventario
     */
    public function updateCard(Request $request, $inventoryCardId)
    {
        $user = Auth::user();
        $inventoryCard = InventoryCard::findOrFail($inventoryCardId);

        // Verificar que sea del usuario
        if ($inventoryCard->user_id !== $user->id) {
            return response()->json([
                'error' => 'No tiene permiso para actualizar esta carta'
            ], 403);
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
     * Listar carta para venta en el mercado
     */
    public function listForSale(Request $request, $inventoryCardId)
    {
        $user = Auth::user();
        $inventoryCard = InventoryCard::findOrFail($inventoryCardId);

        // Verificar que sea del usuario
        if ($inventoryCard->user_id !== $user->id) {
            return response()->json([
                'error' => 'No tiene permiso para vender esta carta'
            ], 403);
        }

        $validated = $request->validate([
            'price_per_card' => 'required|numeric|min:0.01',
            'quantity' => 'required|integer|min:1|max:' . ($inventoryCard->quantity - $inventoryCard->quantity_locked)
        ]);

        // Crear listado en el mercado
        $marketListing = new Market();
        $marketListing->seller_id = $user->id;
        $marketListing->inventory_card_id = $inventoryCardId;
        $marketListing->price_total = $validated['price_per_card'] * $validated['quantity'];
        $marketListing->fee_platform = $marketListing->price_total * 0.10; // 10% de comisión
        $marketListing->amount_to_seller = $marketListing->price_total - $marketListing->fee_platform;
        $marketListing->status = 'active';
        $marketListing->listed_at = now();
        $marketListing->save();

        // Bloquear cantidad
        $inventoryCard->increment('quantity_locked', $validated['quantity']);

        return response()->json([
            'message' => 'Carta listada para venta correctamente',
            'marketListing' => $marketListing
        ], 201);
    }

    /**
     * Quitar carta de la venta
     */
    public function removeFromSale($marketListingId)
    {
        $user = Auth::user();
        $marketListing = Market::findOrFail($marketListingId);

        // Verificar que sea del usuario
        if ($marketListing->seller_id !== $user->id) {
            return response()->json([
                'error' => 'No tiene permiso para eliminar este listado'
            ], 403);
        }

        // Solo se puede quitar si está activo
        if ($marketListing->status !== 'active') {
            return response()->json([
                'error' => 'Este listado ya no está activo'
            ], 400);
        }

        $inventoryCard = $marketListing->inventoryCard;
        $quantity = $marketListing->price_total / ($marketListing->price_total - $marketListing->fee_platform) * ($marketListing->amount_to_seller);

        // Desbloquear cantidad (estimado)
        $inventoryCard->decrement('quantity_locked', 1);

        $marketListing->status = 'cancelled';
        $marketListing->save();

        return response()->json([
            'message' => 'Carta removida de la venta correctamente'
        ]);
    }

    /**
     * Eliminar cartas del inventario
     */
    public function deleteCard($inventoryCardId)
    {
        $user = Auth::user();
        $inventoryCard = InventoryCard::findOrFail($inventoryCardId);

        // Verificar que sea del usuario
        if ($inventoryCard->user_id !== $user->id) {
            return response()->json([
                'error' => 'No tiene permiso para eliminar esta carta'
            ], 403);
        }

        // No se puede eliminar si hay cantidad bloqueada
        if ($inventoryCard->quantity_locked > 0) {
            return response()->json([
                'error' => 'No puede eliminar cartas que están en venta'
            ], 400);
        }

        $inventoryCard->delete();

        return response()->json([
            'message' => 'Carta eliminada del inventario correctamente'
        ]);
    }
}

