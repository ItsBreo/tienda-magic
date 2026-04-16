<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AchievementService
{
    public function unlock(User $user, string $slug): bool
    {
        Log::debug("🏆 [Logros] Intento de desbloqueo: {$slug} para el usuario: {$user->id}");
        
        $achievement = Achievement::where('slug', $slug)->first();

        if (!$achievement) {
            Log::warning("⚠️ [Logros] Logro no encontrado en BD: {$slug}");
            return false;
        }

        // Evita duplicados — si ya lo tiene, no hace nada
        $alreadyHas = $user->achievements()->where('achievement_id', $achievement->id)->exists();
        
        if ($alreadyHas) {
            Log::debug("ℹ️ [Logros] El usuario {$user->id} ya posee el logro: {$slug}. Omitiendo.");
            return false;
        }

        $user->achievements()->attach($achievement->id, [
            'obtained_at' => now(),
        ]);

        Log::info("✅ [Logros] Logro DESBLOQUEADO con éxito: {$slug} para el usuario {$user->id}");

        event(new \App\Events\AchievementUnlocked($user, $achievement));

        return true; 
    }

    public function checkTransactionMilestones(User $user): void
    {
        // Órdenes (compras en tienda/mercado) + Transacciones como vendedor
        $total = $user->orders()->count() + $user->sales()->count();

        Log::debug("📊 [Logros] Chequeo de transacciones para usuario {$user->id}. Total: {$total}");

        if ($total >= 10) $this->unlock($user, 'transactions_10');
        if ($total >= 50) $this->unlock($user, 'transactions_50');
    }

    public function checkReputationMilestones(User $user): void
    {
        // El accesor reputation calcula el total dinámicamente incluyendo días activos
        $reputation = $user->reputation;

        Log::debug("📈 [Logros] Chequeo de reputación para usuario {$user->id}. Reputación actual: {$reputation}");

        if ($reputation >= 1000) {
            $this->unlock($user, 'verified_trader');
        }
    }
}
