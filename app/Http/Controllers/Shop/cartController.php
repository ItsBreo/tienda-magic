<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Cart;
use App\Models\CartItem;


class CartController extends Controller
{
    // Visualizar carrito
    public function index()
    {
        $user = Auth::user();

        // Search for cart with items and booster pack details, or create an empty cart if none exists
        $cart = Cart::with('items.boosterPack.cardSet')
                    ->firstOrCreate(['user_id' => $user->id]);

        return Inertia::render('Shop/Cart', [
            'cart' => $cart
        ]);
    }

    // Add item to cart
    public function store(Request $request)
    {
        $request->validate([
            'booster_pack_id' => 'required|exists:booster_pack,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $user = Auth::user();

        // Obtain or create cart for user
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        // Search for existing cart item with the same booster pack, or create a new instance (without saving yet)
        $item = CartItem::firstOrNew([
            'cart_id' => $cart->id,
            'booster_pack_id' => $request->booster_pack_id
        ]);

        // Increment quantity if item already exists, otherwise set to requested quantity
        $item->quantity = ($item->quantity ?? 0) + $request->quantity;
        $item->save();

        return back()->with('success', 'Producto añadido al carrito.');
    }

    // Delete item from cart
    public function destroy($id)
    {
        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->first();

        if ($cart) {
            // Delete only if the item belongs to the cart
            CartItem::where('cart_id', $cart->id)
                    ->where('id', $id)
                    ->delete();
        }

        return back()->with('success', 'Producto eliminado del carrito.');
    }
}
