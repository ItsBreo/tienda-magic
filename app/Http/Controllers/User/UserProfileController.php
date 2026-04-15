<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class UserProfileController extends Controller
{
    /**
     * Sube una imagen al disco público y devuelve la URL pública.
     * Si ya existía una imagen anterior la borra para no acumular archivos huérfanos.
     */
    private function uploadImage($file, ?string $oldPath, string $folder): string
    {
        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        $path = $file->store($folder, 'public');

        return Storage::disk('public')->url($path);
    }

    /**
     * Extrae la ruta relativa a partir de una URL pública almacenada en BD.
     * Ej: config('app.url') . "/storage/avatars/abc.jpg" -> "avatars/abc.jpg"
     */
    private function getStoragePath(?string $url): ?string
    {
        if (!$url) return null;

        $marker = '/storage/';
        $pos = strpos($url, $marker);

        return $pos !== false ? substr($url, $pos + strlen($marker)) : null;
    }

    /**
     * Obtener el perfil del usuario autenticado
     */
    #[OA\Get(
        path: "/api/profile",
        summary: "Ver perfil propio",
        description: "Obtiene el perfil del usuario autenticado.",
        tags: ["Profile"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Datos del perfil")]
    public function showProfile()
    {
        $user = auth()->user();

        return response()->json([
            'message' => 'Datos obtenidos correctamente',
            'user'    => $user->load('profile')
        ]);
    }

    /**
     * Obtener el perfil de un usuario específico (público)
     */
    #[OA\Get(
        path: "/api/profile/{userId}",
        summary: "Ver perfil público de usuario",
        description: "Obtiene el perfil público de un usuario especificado por ID.",
        tags: ["Profile"]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Perfil del usuario devuelto")]
    #[OA\Response(response: 404, description: "Usuario no encontrado")]
    public function show($userId)
    {
        $user = User::with('profile')->find($userId);

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        return response()->json([
            'message' => 'Perfil obtenido correctamente',
            'user'    => $user
        ]);
    }

    /**
     * Crear el perfil para el usuario autenticado.
     * Acepta archivos (multipart/form-data) o URLs de texto.
     */
    #[OA\Post(
        path: "/api/profile",
        summary: "Crear perfil",
        description: "Crea el perfil para el usuario autenticado.",
        tags: ["Profile"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 201, description: "Perfil creado")]
    #[OA\Response(response: 400, description: "El usuario ya tiene un perfil")]
    public function store(Request $request)
    {
        $user = auth()->user();

        if ($user->profile) {
            return response()->json(['error' => 'El usuario ya tiene un perfil'], 400);
        }

        $validated = $request->validate([
            'display_name' => 'required|string|max:255',
            'avatar'       => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:2048',
            'avatar_url'   => 'nullable|url|max:2048',
            'banner'       => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
            'banner_url'   => 'nullable|url|max:2048',
            'bio'          => 'nullable|string|max:500',
            'country'      => 'nullable|string|max:100',
            'trade_terms'  => 'nullable|string|max:500',
        ]);

        $data = [
            'display_name'     => $validated['display_name'],
            'bio'              => $validated['bio'] ?? null,
            'country'          => $validated['country'] ?? null,
            'trade_terms'      => $validated['trade_terms'] ?? null,
            'reputation_score' => 0,
        ];

        // Avatar: prioridad al archivo subido; si no, URL de texto
        if ($request->hasFile('avatar')) {
            $data['avatar_url'] = $this->uploadImage($request->file('avatar'), null, 'avatars');
        } else {
            $data['avatar_url'] = $validated['avatar_url'] ?? null;
        }

        // Banner: igual
        if ($request->hasFile('banner')) {
            $data['banner_url'] = $this->uploadImage($request->file('banner'), null, 'banners');
        } else {
            $data['banner_url'] = $validated['banner_url'] ?? null;
        }

        $user->profile()->create($data);

        return response()->json([
            'message' => 'Perfil creado correctamente',
            'user'    => $user->load('profile')
        ], 201);
    }

    /**
     * Actualizar el perfil del usuario autenticado.
     * Acepta archivos (multipart/form-data) o URLs de texto.
     */
    #[OA\Patch(
        path: "/api/profile",
        summary: "Actualizar perfil",
        description: "Actualiza el perfil del usuario autenticado.",
        tags: ["Profile"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Perfil actualizado correctamente")]
    #[OA\Response(response: 404, description: "Perfil no encontrado")]
    public function update(Request $request)
    {
        $user    = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json(['error' => 'Perfil no encontrado'], 404);
        }

        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:255',
            'avatar'       => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:2048',
            'avatar_url'   => 'nullable|url|max:2048',
            'banner'       => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
            'banner_url'   => 'nullable|url|max:2048',
            'bio'          => 'sometimes|nullable|string|max:500',
            'country'      => 'sometimes|nullable|string|max:100',
            'trade_terms'  => 'sometimes|nullable|string|max:500',
        ]);

        // Campos de texto simples
        $data = collect($validated)
            ->except(['avatar', 'avatar_url', 'banner', 'banner_url'])
            ->toArray();

        // Avatar
        if ($request->hasFile('avatar')) {
            $oldPath = $this->getStoragePath($profile->avatar_url);
            $data['avatar_url'] = $this->uploadImage($request->file('avatar'), $oldPath, 'avatars');
        } elseif ($request->has('avatar_url')) {
            $data['avatar_url'] = $request->avatar_url ?: null;
        }

        // Banner
        if ($request->hasFile('banner')) {
            $oldPath = $this->getStoragePath($profile->banner_url);
            $data['banner_url'] = $this->uploadImage($request->file('banner'), $oldPath, 'banners');
        } elseif ($request->has('banner_url')) {
            $data['banner_url'] = $request->banner_url ?: null;
        }

        $profile->update($data);

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user'    => $user->load('profile')
        ]);
    }

    #[OA\Patch(
        path: "/api/profile/public-info",
        summary: "Actualizar información pública",
        description: "Actualiza información pública (stub).",
        tags: ["Profile"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Información actualizada (stub)")]
    public function updatePublicInfo(Request $request)
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    /**
     * Actualizar reputación del usuario (solo administrador)
     */
    #[OA\Patch(
        path: "/api/admin/users/{userId}/reputation",
        summary: "Actualizar reputación (Admin)",
        description: "Actualiza la puntuación de reputación de un usuario.",
        tags: ["Admin", "Profile"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Reputación actualizada")]
    public function updateReputation(Request $request, $userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $profile = $user->profile;

        if (!$profile) {
            return response()->json(['error' => 'Perfil no encontrado'], 404);
        }

        $validated = $request->validate([
            'reputation_score' => 'required|integer'
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Reputación actualizada correctamente',
            'profile' => $profile
        ]);
    }

    /**
     * Eliminar el perfil del usuario autenticado (y sus imágenes del disco)
     */
    #[OA\Delete(
        path: "/api/profile",
        summary: "Eliminar perfil",
        description: "Elimina el perfil del usuario autenticado.",
        tags: ["Profile"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Perfil eliminado correctamente")]
    public function destroy()
    {
        $user    = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json(['error' => 'Perfil no encontrado'], 404);
        }

        // Limpiar archivos del disco antes de borrar el registro
        if ($avatarPath = $this->getStoragePath($profile->avatar_url)) {
            Storage::disk('public')->delete($avatarPath);
        }
        if ($bannerPath = $this->getStoragePath($profile->banner_url)) {
            Storage::disk('public')->delete($bannerPath);
        }

        $profile->delete();

        return response()->json(['message' => 'Perfil eliminado correctamente']);
    }
}
