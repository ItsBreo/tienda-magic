<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Deck;

class UserController extends Controller
{

    // Funciones CRUD

    // Mostrar info para el perfil (Propio usuario)
    public function show()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name,
            'username'       => $user->username,
            'email'          => $user->email,
            'wallet_balance' => $user->wallet_balance,
            'is_admin'       => $user->is_admin,
            'created_at'     => $user->created_at,
            'updated_at'     => $user->updated_at
        ]);
    }

    // Actualizar cuenta (nombre de usuario, email)
    public function updateProfile(Request $request, User $user)
    {
        $user = auth()->user();

        // FIX: Faltaba la coma antes del ID — sin ella Laravel no puede ignorar
        // el propio registro del usuario al validar el unique y lanza un error 500
        $validated = $request->validate([
            'username' => 'sometimes|string|max:20|unique:users,username,' . $user->id,
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only(['username', 'email']));

        return response()->json([
            'message' => 'Cuenta actualizada',
            'user'    => $user
        ]);
    }

    // Actualizar contraseña
    public function updatePassword(Request $request, User $user)
    {
        $user = auth()->user();

        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|min:8|confirmed'
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'La contraseña actual no es válida'], 400);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Contraseña cambiada con éxito']);
    }

    // Eliminar usuario
    public function destroyUser(Request $request, User $user)
    {
        $user->delete();
        return redirect()->route('$index}'); // TODO: pendiente cambiar el Index
    }

    // Mostrar sus decks
    public function showDecks(Request $request, User $user)
    {
        $user->load('decks');
    }

    // Cartas favoritas
    public function showFavoriteCards(User $user)
    {
        $user->load('favoriteCards');

        return view('usuarios.favorites', compact('user'));
    }

    // 1. Mostrar ventas realizadas (como vendedor)
    public function sales()
    {
        $sales = auth()->user()->sales()->with(['buyer', 'item'])->latest()->get();
        return view('user.sales.index', compact('sales'));
    }

    // 2. Estadísticas de venta
    public function salesStats()
    {
        $user = auth()->user();

        $totalSalesCount = $user->sales()->count();
        $totalEarned     = $user->sales()->sum('price');

        return view('user.sales.stats', [
            'totalSales'   => $totalSalesCount,
            'totalEarned'  => $totalEarned
        ]);
    }

    // 3. Historial de compras (como comprador)
    public function orderHistory()
    {
        $orders = auth()->user()->orders()->with(['seller', 'item'])->latest()->get();
        return view('user.purchases.history', compact('purchases'));
    }

    // 4. Saldo actual del Wallet
    public function getBalance()
    {
        $balance = auth()->user()->balance;
        return response()->json(['balance' => $balance]);
    }

    // 5. Transacciones (Recargas y Gastos totales)
    public function transactions()
    {
        $user = auth()->user();

        $allTransactions = $user->transactions()->latest()->get();
        $totalDeposits   = $user->transactions()->where('type', 'deposit')->sum('amount');
        $totalSpent      = $user->transactions()->where('type', 'expense')->sum('amount');

        return view('user.wallet.transactions', [
            'transactions'  => $allTransactions,
            'totalDeposits' => $totalDeposits,
            'totalSpent'    => $totalSpent
        ]);
    }
}
