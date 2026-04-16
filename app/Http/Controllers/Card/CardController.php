<?php

namespace App\Http\Controllers\Card;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Card;

class CardController extends Controller
{
    public function index(Request $request)
    {
        $query = Card::with('cardSet');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('set')) {
            $query->whereHas('cardSet', function($q) use ($request) {
                $q->where('code', $request->set);
            });
        }

        $cards = $query->paginate(50);
        return response()->json($cards);
    }
}
