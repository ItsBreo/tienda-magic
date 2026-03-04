<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Card;
use Illuminate\Http\Request;

class AdminCardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $cards = Card::latest()->paginate(20);
        return response()->json($cards);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'scryfall_id' => 'required|string|unique:cards',
            'name' => 'required|string|max:255',
            'set_code' => 'required|string|exists:card_sets,code',
            'collector_number' => 'required|string',
            'rarity' => 'required|string',
            'price_eur' => 'nullable|numeric|min:0',
            'price_usd' => 'nullable|numeric|min:0',
            'mana_value' => 'required|numeric|min:0',
            'image_uri' => 'nullable|url'
        ]);

        $validated['card_set_id'] = strtolower($validated['set_code']);

        $card = Card::create($validated);

        return response()->json([
            'message' => 'Carta creada exitosamente',
            'card' => $card
        ], 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Card $card)
    {
        $card->delete();
        return response()->json(['message' => 'Carta eliminada exitosamente.']);
    }
}
