<?php

namespace App\Http\Controllers\User;

use Illuminate\Http\Request;

class userController extends Controller
/* Funciones del usuario:
    -Show(perfil público) X
    -Update(Editar información) X
    -Destroy(Eliminar cuenta)
    -ChangePassword(Actualizar contraseña)
    -Decks(mostrar listado de decks)
    -Favorites(Listado de cartas favoritas)
    -Si el usuario es vendedor:
    -Inventory(Inventario puesto en venta)
    -Sales(Mostrar sus ventas realizadas)
    -salesStats(Total de ventas, dinero ganado)
    -Si el usuario es comprador:
    -orderHistory(Historial de compras)
    -Wallet:
    -getBalance(Devolver saldo actual)
    -Transactions(Recargas y gastos totales)
*/
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
            'bio' => $perfil->bio,        // Campo de la tabla profiles
            'pais' => $perfil->country,   // Campo de la tabla profiles
            'saldo' => $user->wallet_balance
        ]);
    }

    // Actualizar cuenta (nombre de usuario,email)
    public function updateProfile(Request $request) {

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
    public function updatePassword(Request $request){
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
}
