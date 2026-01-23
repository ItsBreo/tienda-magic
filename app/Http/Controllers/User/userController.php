<?php

namespace App\Http\Controllers\User;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Deck;

class userController extends Controller
{

    // Funciones CRUD

    // Mostrar info para el perfil (Propio usuario)
    public function show (){
        // 1. Obtener el usuario actual
        $user = auth()->user();

        // 2. Acceder al perfil
        $perfil = $user->profile;

        return response()->json([
            'usuario' => $user->name,
            'email' => $user->email,
            'bio' => $perfil->bio,        // Campo de la tabla profiles CAMBIAR A PROFILECONTROLLER
            'pais' => $perfil->country,   // Campo de la tabla profiles CAMBIAR A PROFILECONTROLLER
            'saldo' => $user->wallet_balance
        ]);
    }

    // Actualizar cuenta (nombre de usuario,email)
    public function updateProfile(Request $request, User $user) {

        $user = auth()->user();

        // Actualización parcial de datos
        $validated = $request->validate([
            'username' => 'sometimes|string|max:20|unique:users,username'.$user->id,
            'email' => 'sometimes|email|unique:users,email'.$user->id,
        ]);

        // Actualización de atributos
        $user->update($request->only(['username','email']));

        return response()->json([
            'message' => 'Cuenta actualizada',
            'user' => $user
        ]);
    }

    // Actualizar contraseña
    public function updatePassword(Request $request, User $user){
        $user = auth()->user();

        // Validaciones de contraseña
        $request -> validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed'
        ]);

        // 1. Comprobar que sabe su contraseña actual
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'La contraseña actual no es válida'], 400);
        }

        // 2. Encriptar y guardar la nueva
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Contraseña cambiada con éxito']);
    }

    // Eliminar usuario
    public function destroyUser(Request $request, User $user){
        $user->delete();
        return redirect()->route('$index}'); // TODO: pendiente cambiar el Index
    }

    // Mostrar sus decks
    public function showDecks(Request $request, User $user){
        $user->load(decks);
    }

    // Cartas favoritas
    public function showFavoriteCards(User $user){
        // Cargamos la relación 'favoriteCards' para ese usuario específico
        $user->load('favoriteCards');

        // Retornamos la vista pasando al usuario con sus cartas
        return view('usuarios.favorites', compact('user'));
    }

    // 1. Mostrar ventas realizadas (como vendedor)
    public function sales(){
        $sales = auth()->user()->sales()->with(['buyer', 'item'])->latest()->get();
        return view('user.sales.index', compact('sales'));
    }

    // 2. Estadísticas de venta
    public function salesStats(){
        $user = auth()->user();

        $totalSalesCount = $user->sales()->count();
        $totalEarned = $user->sales()->sum('price'); // Suponiendo columna 'price' en orders

        return view('user.sales.stats', [
            'totalSales' => $totalSalesCount,
            'totalEarned' => $totalEarned
        ]);
    }

    // 3. Historial de compras (como comprador)
    public function orderHistory(){
        $orders = auth()->user()->orders()->with(['seller', 'item'])->latest()->get();
        return view('user.purchases.history', compact('purchases'));
    }

    // 4. Saldo actual del Wallet
    public function getBalance(){
        // Asumiendo que tienes una columna 'balance' en la tabla users
        $balance = auth()->user()->balance;
        return response()->json(['balance' => $balance]);
    }

    // 5. Transacciones (Recargas y Gastos totales)
    public function transactions(){
        $user = auth()->user();

        $allTransactions = $user->transactions()->latest()->get();

        $totalDeposits = $user->transactions()->where('type', 'deposit')->sum('amount');
        $totalSpent = $user->transactions()->where('type', 'expense')->sum('amount');

        return view('user.wallet.transactions', [
            'transactions' => $allTransactions,
            'totalDeposits' => $totalDeposits,
            'totalSpent' => $totalSpent
        ]);
    }
}
