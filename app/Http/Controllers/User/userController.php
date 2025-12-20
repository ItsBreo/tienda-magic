<?php

namespace App\Http\Controllers\User;

use Illuminate\Http\Request;
use \App\Models\User;

class userController extends Controller
/* Funciones del usuario:
    -Show(perfil público) X
    -Update(Editar información) X
    -Destroy(Eliminar cuenta) X
    -ChangePassword(Actualizar contraseña) X
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
    public function current(Request $request)
    {
        // Obtiene al usuario dueño del Token
        // Devuelve TODO: email, saldo, preferencias...
        return response()->json(auth()->user());
    }

    public function show($id)
    {
        // Busca a un usuario por su ID
        $user = User::with('profile')->find($id);

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // IMPORTANTE: Aquí filtramos datos.
        // NO devuelvas su email, ni su saldo, ni su password.
        return response()->json([
            'username' => $user->username,
            'avatar'   => $user->profile->avatar ?? null, // Usamos ?? por si no tiene perfil
            'bio'      => $user->profile->bio ?? '',
            'created_at' => $user->created_at,
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

    // Eliminar contraseña
    public function destroyAccount(Request $request){
        $user = auth()->user();

        // 1. SEGURIDAD: Validar que envía la contraseña
        $request->validate([
        'password' => 'required'
        ]);

        // 2. SEGURIDAD: Comprobar que la contraseña es real
        // Esto evita que si te dejas la sesión abierta, alguien te borre la cuenta.
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña es incorrecta. No se ha eliminado nada.'
            ], 403); // 403 Forbidden
        }

        // 3. LIMPIEZA: Revocar todos los tokens de acceso
        // Esto cierra la sesión en el móvil, en el PC y en cualquier sitio.
        $user->tokens()->delete();

        // 4. BORRADO FINAL
        // Aquí confiamos en que la Base de Datos borre en cascada el perfil, inventario, etc.
        $user->delete();

        return response()->json([
            'message' => 'Tu cuenta ha sido eliminada permanentemente. ¡Hasta pronto!'
        ]);
    }

    // Funciones de mazos
    // TODO
}
