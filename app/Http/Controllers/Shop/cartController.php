<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Cart;
use App\Models\cartItem;


class cartController extends Controller
{
    // Visualizar carrito
    public function index()
    {
        $user = Auth::user();

        // Buscamos el carrito del usuario o creamos uno vacío si no tiene
        $cart = Cart::with('items.boosterPack.cardSet')
                    ->firstOrCreate(['user_id' => $user->id]);

        return Inertia::render('Shop/Cart', [
            'cart' => $cart
        ]);
    }

    // Añadir productos al carrito
    public function store(Request $request)
    {
        $request->validate([
            'booster_pack_id' => 'required|exists:booster_pack,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $user = Auth::user();

        // Obtenemos el Carrito
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        // Buscamos un item con este cart_id y booster_pack_id.
        // Si no existe, se crea una instancia en memoria con cantidad 0 (o null).
        $item = cartItem::firstOrNew([
            'cart_id' => $cart->id,
            'booster_pack_id' => $request->booster_pack_id
        ]);

        // Sumamos la cantidad (si es nuevo, será -> 0 + cantidad)
        $item->quantity = ($item->quantity ?? 0) + $request->quantity;
        $item->save();

        return back()->with('success', 'Producto añadido');
    }

    // Eliminar item del carrito
    public function destroy($id)
    {
        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->first();

        if ($cart) {
            // Borramos solo si el item pertenece al carrito
            cartItem::where('cart_id', $cart->id)
                    ->where('id', $id)
                    ->delete();
        }

        return back()->with('success', 'Producto eliminado del carrito.');
    }
}
