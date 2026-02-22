<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\BoosterPack;
use App\Models\Card;

class PackDetailController extends Controller
{
    public function show($id)
    {
        $pack = BoosterPack::with('cardSet')
            ->findOrFail($id);

        // Buscar packs del mismo set
        $relatedPacks = BoosterPack::with('cardSet')
            ->where('card_set_id', $pack->card_set_id)
            ->where('id', '!=', $pack->id)
            ->take(6)
            ->get();

        // Buscar cartas del set ordenadas por rareza
        $possibleCards = Card::where('card_set_id', $pack->card_set_id)
            ->orderByRaw("FIELD(rarity, 'mythic', 'rare', 'uncommon', 'common')")
            ->orderBy('id', 'asc')
            ->take(20)
            ->get();

        // Buscar cartas con imagen para mostrar
        $chaseCards = Card::where('card_set_id', $pack->card_set_id)
            ->whereNotNull('image_uri')
            ->select('id', 'name', 'rarity', 'image_uri')
            ->orderBy('rarity', 'desc')
            ->orderBy('id', 'asc')
            ->limit(10)
            ->get();

        // Si no hay cartas con imagen, buscar de cualquier set
        if ($chaseCards->isEmpty()) {
            $chaseCards = Card::whereNotNull('image_uri')
                ->select('id', 'name', 'rarity', 'image_uri')
                ->orderBy('rarity', 'desc')
                ->orderBy('id', 'asc')
                ->limit(10)
                ->get();
        }

        return Inertia::render('shop/PackDetail', [
            'pack' => $pack,
            'relatedPacks' => $relatedPacks,
            'possibleCards' => $possibleCards,
            'chaseCards' => $chaseCards,
        ]);
    }
}
