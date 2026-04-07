<?php

namespace App\Http\Controllers\Card;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Card;

class CardController extends Controller
{
    public function index()
    {
        $cards = Card::with('cardSet')->get();
        return response()->json($cards);
    }
}
