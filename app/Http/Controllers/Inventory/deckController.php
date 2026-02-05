<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Deck;
use App\Models\Card; // TODO: ¿Vas a utilizar el modelo de cartas?

class DeckController extends Controller
{
    // 1. VER MIS MAZOS
    public function index()
    {
        $user = Auth::user();

        // Obtenemos los mazos del usuario con la cuenta de cartas que tienen
        $decks = Deck::where('user_id', $user->id)
            ->withCount('cards') // Cuántas cartas tiene cada mazo
            ->get();

        return Inertia::render('Decks/Index', [
            'decks' => $decks
        ]);
    }

    // 2. CREAR UN MAZO NUEVO (Vacío)
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
            'is_in_sale' => false // Por defecto no se vende
        ]);

        return back()->with('success', 'Mazo creado correctamente');
    }

    // 3. VER UN MAZO (El "Constructor" estilo Archidekt)
    public function show($id)
    {
        $deck = Deck::with(['cards' => function($query) {
            // Traemos los datos de la carta y la cantidad (pivot)
            $query->withPivot('quantity');
        }])->findOrFail($id);

        // Verificamos que el mazo sea del usuario o sea público
        if ($deck->user_id !== Auth::id() && !$deck->is_public) {
            abort(403);
        }

        return Inertia::render('Decks/Builder', [
            'deck' => $deck
        ]);
    }

    // 4. VER MAZOS PÚBLICOS DE OTRO USUARIO
    public function userPublicDecks($userId)
    {
        $user = \App\Models\User::findOrFail($userId);

        // Obtenemos todos los mazos públicos del usuario
        $decks = Deck::where('user_id', $userId)
            ->where('is_public', true)
            ->withCount('cards')
            ->with('user:id,name,username') // Cargamos info básica del usuario
            ->get();

        return Inertia::render('Decks/UserPublic', [
            'user' => $user,
            'decks' => $decks
        ]);
    }

    // 5. EXPLORAR MAZOS PÚBLICOS (Todos los mazos públicos)
    public function explore(Request $request)
    {
        $query = Deck::where('is_public', true)
            ->withCount('cards')
            ->with('user:id,name,username');

        // Búsqueda opcional
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', '%' . $search . '%');
        }

        // Ordenamiento
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

        return Inertia::render('Decks/Explore', [
            'decks' => $decks,
            'search' => $request->get('search', ''),
            'sort' => $sort
        ]);
    }

    // 6. VER LOS MAZOS A LA VENTA
    public function forSale(Request $request)
    {
        $decks = Deck::where('is_public', true)
            ->where('is_in_sale', true)
            ->withCount('cards')
            ->with('user:id,name,username')
            ->latest()
            ->paginate(12);

        return Inertia::render('Decks/ForSale', [
            'decks' => $decks
        ]);
    }

    // 7. AÑADIR CARTA AL MAZO
    public function addCard(Request $request, $deckId)
    {
        $request->validate([
            'card_id' => 'required|exists:cards,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $deck = Deck::where('user_id', Auth::id())->findOrFail($deckId);

        // Usamos syncWithoutDetaching para añadir o actualizar la cantidad
        // Esto busca si la carta ya está en el mazo. Si está, actualiza. Si no, crea.
        // Pero Eloquent attach() a veces duplica, mejor comprobar:

        $existingCard = $deck->cards()->where('card_id', $request->card_id)->first();

        if ($existingCard) {
            // Si ya existe, sumamos la cantidad
            $newQuantity = $existingCard->pivot->quantity + $request->quantity;
            $deck->cards()->updateExistingPivot($request->card_id, ['quantity' => $newQuantity]);
        } else {
            // Si no existe, la añadimos
            $deck->cards()->attach($request->card_id, ['quantity' => $request->quantity]);
        }

    }

    // 8. BORRAR CARTA DEL MAZO
    public function removeCard($deckId, $cardId)
    {
        $deck = Deck::where('user_id', Auth::id())->findOrFail($deckId);
        $deck->cards()->detach($cardId);

        return back();
    }
}
