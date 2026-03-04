<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CardSet;
use Illuminate\Http\Request;

class AdminSetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $sets = CardSet::latest('released_at')->paginate(20);
        return response()->json($sets);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:card_sets',
            'name' => 'required|string|max:255',
            'released_at' => 'nullable|date',
            'card_count' => 'required|integer|min:0',
            'icon_svg_uri' => 'nullable|url',
        ]);

        $set = CardSet::create($validated);

        return response()->json([
            'message' => 'Set creado exitosamente',
            'set' => $set
        ], 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($code)
    {
        $set = CardSet::findOrFail($code);
        $set->delete();

        return response()->json(['message' => 'Set eliminado exitosamente.']);
    }
}
