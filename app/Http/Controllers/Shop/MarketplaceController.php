<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\CardSet;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    public function index()
    {
        // Query sets with more than 50 cards
        $sets = CardSet::where('card_count', '>', 50)
            ->orderBy('released_at', 'desc')
            ->paginate(12);

        return Inertia::render('Marketplace/Index', [
            'sets' => $sets
        ]);
    }
}
