<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Deck;
use OpenApi\Attributes as OA;

class DeckController extends Controller
{
    #[OA\Get(
        path: "/api/decks",
        summary: "Mis mazos",
        description: "Lista los mazos del usuario autenticado.",
        tags: ["Decks"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Mazos listados")]
    public function index()
    {
        $user = Auth::user();

        $decks = Deck::where('user_id', $user->id)
            ->withCount('cards')
            ->get();

        return response()->json([
            'decks' => $decks
        ]);
    }

    #[OA\Post(
        path: "/api/decks",
        summary: "Crear mazo",
        description: "Crea un mazo nuevo.",
        tags: ["Decks"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "is_public", type: "boolean")
        ])
    )]
    #[OA\Response(response: 200, description: "Mazo creado")]
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'is_public' => 'boolean'
        ]);

        Deck::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'is_public' => $request->is_public ?? false,
            'is_in_sale' => false
        ]);

        return response()->json(['success' => true]);
    }

    #[OA\Get(
        path: "/api/decks/{id}",
        summary: "Ver mazo",
        description: "Obtiene los detalles de un mazo y las cartas contenidas.",
        tags: ["Decks"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID del mazo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Mazo cargado exitosamente")]
    #[OA\Response(response: 403, description: "Mazo privado")]
    public function show($id)
    {
        $deck = Deck::with(['cards' => function($query) {
            $query->withPivot('quantity');
        }])->findOrFail($id);

        if ($deck->user_id !== Auth::id() && !$deck->is_public) {
            abort(403);
        }

        return response()->json([
            'deck' => $deck
        ]);
    }

    public function userPublicDecks($userId)
    {
        $user = \App\Models\User::findOrFail($userId);

        $decks = Deck::where('user_id', $userId)
            ->where('is_public', true)
            ->withCount('cards')
            ->with('user:id,name,username')
            ->get();

        return response()->json([
            'user' => $user,
            'decks' => $decks
        ]);
    }

    public function explore(Request $request)
    {
        $query = Deck::where('is_public', true)
            ->withCount('cards')
            ->with('user:id,name,username');

        if ($request->has('search')) {
            $search = $request->get('search');
            $search = htmlspecialchars(strip_tags($search), ENT_QUOTES, 'UTF-8');
            $query->where('name', 'like', '%' . $search . '%');
        }

        $sort = $request->get('sort', 'latest');
        switch ($sort) {
            case 'popular':
                $query->orderBy('views', 'desc');
                break;
            case 'oldest':
                $query->oldest();
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        $decks = $query->paginate(12);

        return response()->json([
            'decks' => $decks,
            'search' => $request->get('search', ''),
            'sort' => $sort
        ]);
    }

    public function forSale(Request $request)
    {
        $decks = Deck::where('is_public', true)
            ->where('is_in_sale', true)
            ->withCount('cards')
            ->with('user:id,name,username')
            ->latest()
            ->paginate(12);

        return response()->json([
            'decks' => $decks
        ]);
    }

    #[OA\Post(
        path: "/api/decks/{deckId}/cards",
        summary: "Añadir carta al mazo",
        description: "Añade una cantidad de una carta a un mazo específico.",
        tags: ["Decks"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "deckId", in: "path", required: true, description: "ID del mazo", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "card_id", type: "integer"),
            new OA\Property(property: "quantity", type: "integer", example: 1)
        ])
    )]
    #[OA\Response(response: 200, description: "Carta añadida exitosamente")]
    public function addCard(Request $request, $deckId)
    {
        $request->validate([
            'card_id' => 'required|exists:cards,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $deck = Deck::where('user_id', Auth::id())->findOrFail($deckId);
        $existingCard = $deck->cards()->where('card_id', $request->card_id)->first();

        if ($existingCard) {
            $newQuantity = $existingCard->pivot->quantity + $request->quantity;
            $deck->cards()->updateExistingPivot($request->card_id, ['quantity' => $newQuantity]);
        } else {
            $deck->cards()->attach($request->card_id, ['quantity' => $request->quantity]);
        }
        
        return response()->json(['success' => true]);
    }

    #[OA\Delete(
        path: "/api/decks/{deckId}/cards/{cardId}",
        summary: "Quitar carta del mazo",
        description: "Elimina una carta de un mazo específico.",
        tags: ["Decks"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "deckId", in: "path", required: true, description: "ID del mazo", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "cardId", in: "path", required: true, description: "ID de la carta", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Carta eliminada exitosamente")]
    public function removeCard($deckId, $cardId)
    {
        $deck = Deck::where('user_id', Auth::id())->findOrFail($deckId);
        $deck->cards()->detach($cardId);

        return response()->json(['success' => true]);
    }
}
