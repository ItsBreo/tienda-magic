<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use OpenApi\Attributes as OA;

/**
 * Controlador principal de gestión de usuarios.
 *
 * Maneja operaciones CRUD del usuario autenticado y funciones de perfil.
 */
class UserController extends Controller
{

    // Funciones CRUD

    /**
     * Muestra información básica del usuario autenticado.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/api/account",
        summary: "Ver cuenta del usuario",
        description: "Obtiene información de la cuenta base del usuario autenticado.",
        tags: ["Account"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Datos de usuario obtenidos")]
    public function show(Request $request)
    {
        $user = $request->user();

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
            'permissions'    => $user->all_permissions,
            'reputation'     => $user->reputation,
            'created_at'     => $user->created_at,
            'updated_at'     => $user->updated_at
        ]);
    }

    /**
     * Actualiza datos básicos del perfil del usuario.
     *
     * @param Request $request
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request, User $user)
    {
        $user = $request->user();

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

    /**
     * Actualiza contraseña del usuario autenticado.
     *
     * @param Request $request
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Patch(
        path: "/api/account/password",
        summary: "Cambiar contraseña",
        description: "Actualiza la contraseña del usuario autenticado indicando la actual.",
        tags: ["Account"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "current_password", type: "string"),
            new OA\Property(property: "new_password", type: "string"),
            new OA\Property(property: "new_password_confirmation", type: "string")
        ])
    )]
    #[OA\Response(response: 200, description: "Contraseña cambiada exitosamente")]
    public function updatePassword(Request $request, User $user)
    {
        $user = $request->user();

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

    /**
     * Elimina cuenta de usuario.
     *
     * @param Request $request
     * @param User $user
     * @return \Illuminate\Http\RedirectResponse
     */
    #[OA\Delete(
        path: "/api/account",
        summary: "Eliminar cuenta",
        description: "Elimina permanentemente la cuenta de usuario.",
        tags: ["Account"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Cuenta eliminada")]
    public function destroyUser(Request $request, User $user)
    {
        $user->delete();
        return redirect()->route('$index}'); // TODO: pendiente cambiar el Index
    }

    /**
     * Muestra decks del usuario.
     *
     * @param Request $request
     * @param User $user
     * @return void
     */
    #[OA\Get(
        path: "/api/account/decks",
        summary: "Mazos del usuario",
        description: "Carga la relación de mazos creados por el usuario.",
        tags: ["Account"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Listado de mazos (puede devolver vista o json)")]
    public function showDecks(Request $request, User $user)
    {
        $user->load('decks');
    }

    /**
     * Muestra cartas favoritas del usuario.
     *
     * @param User $user
     * @return \Illuminate\View\View
     */
    #[OA\Get(
        path: "/api/account/favorites",
        summary: "Cartas favoritas",
        description: "Muestra cartas marcadas como preferidas por el usuario.",
        tags: ["Account"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Listado de favoritos")]
    public function showFavoriteCards(User $user)
    {
        $user->load('favoriteCards');

        return view('usuarios.favorites', compact('user'));
    }

    /**
     * Muestra ventas realizadas como vendedor.
     *
     * @return \Illuminate\View\View
     */
    public function sales(Request $request)
    {
        $sales = $request->user()->sales()->with(['buyer', 'item'])->latest()->get();
        return view('user.sales.index', compact('sales'));
    }

    /**
     * Muestra estadísticas de ventas del usuario.
     *
     * @return \Illuminate\View\View
     */
    public function salesStats(Request $request)
    {
        $user = $request->user();

        $totalSalesCount = $user->sales()->count();
        $totalEarned     = $user->sales()->sum('price');

        return view('user.sales.stats', [
            'totalSales'   => $totalSalesCount,
            'totalEarned'  => $totalEarned
        ]);
    }

    /**
     * Muestra historial de compras como comprador.
     *
     * @return \Illuminate\View\View
     */
    public function orderHistory(Request $request)
    {
        $orders = $request->user()->orders()->with(['seller', 'item'])->latest()->get();
        return view('user.purchases.history', compact('purchases'));
    }

    /**
     * Obtiene saldo actual del wallet del usuario.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/api/account/balance",
        summary: "Consultar saldo",
        description: "Devuelve el saldo actual de la billetera en la tienda.",
        tags: ["Account"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Saldo obtenido con éxito")]
    public function getBalance(Request $request)
    {
        $balance = $request->user()->balance;
        return response()->json(['balance' => $balance]);
    }

    /**
     * Muestra transacciones del wallet y estadísticas.
     *
     * @return \Illuminate\View\View
     */
    #[OA\Get(
        path: "/api/account/transactions",
        summary: "Historial de transacciones de billetera",
        description: "Muestra los movimientos (recargas y deducciones) de saldo.",
        tags: ["Account"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de transacciones")]
    public function transactions(Request $request)
    {
        $user = $request->user();

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
