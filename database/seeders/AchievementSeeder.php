<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Achievement;
use Illuminate\Support\Facades\DB;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Limpieza de logros eliminados para evitar basura en la UI
        $toRemove = ['email_verified', 'first_deck_created', 'first_deck'];
        Achievement::whereIn('slug', $toRemove)->delete();
        DB::table('user_achievement')->whereIn('achievement_id', function($query) use ($toRemove) {
            $query->select('id')->from('achievements')->whereIn('slug', $toRemove);
        })->delete();

        $achievements = [
            [
                'slug'        => 'first_register',
                'name'        => 'Bienvenido Planeswalker',
                'description' => 'Creaste tu cuenta en la Tienda Magic.',
                'badge_icon'  => '🧙',
                'xp_points'   => 10,
            ],
            [
                'slug'        => 'first_pack_purchase',
                'name'        => 'Primer Sobre',
                'description' => 'Abriste tu primer sobre.',
                'badge_icon'  => '📦',
                'xp_points'   => 30,
            ],
            [
                'slug'        => 'first_card_purchase',
                'name'        => 'Primera Carta',
                'description' => 'Compraste tu primera carta en el mercado.',
                'badge_icon'  => '🃏',
                'xp_points'   => 30,
            ],
            [
                'slug'        => 'first_card_listed',
                'name'        => 'Primer Vendedor',
                'description' => 'Pusiste una carta a la venta por primera vez.',
                'badge_icon'  => '🏪',
                'xp_points'   => 25,
            ],
            [
                'slug'        => 'transactions_10',
                'name'        => 'Comerciante',
                'description' => 'Completaste 10 transacciones en total.',
                'badge_icon'  => '💰',
                'xp_points'   => 50,
            ],
            [
                'slug'        => 'transactions_50',
                'name'        => 'Mercader Experto',
                'description' => 'Completaste 50 transacciones en total.',
                'badge_icon'  => '💎',
                'xp_points'   => 150,
            ],
            [
                'slug'        => 'verified_trader',
                'name'        => 'Verificado',
                'description' => 'Alcanzaste 1000 de reputación en la comunidad.',
                'badge_icon'  => '🔵', 
                'xp_points'   => 100,
            ],
            [
                'slug'        => 'first_trade',
                'name'        => 'Primer Intercambio',
                'description' => 'Completaste tu primer intercambio con otro Planeswalker.',
                'badge_icon'  => '🧙',
                'xp_points'   => 50,
            ],
            [
                'slug'        => 'trades_10',
                'name'        => 'Coleccionista Activo',
                'description' => 'Has completado 10 intercambios exitosos.',
                'badge_icon'  => '🔄',
                'xp_points'   => 100,
            ],
            [
                'slug'        => 'trades_100', // Changed to trades_50 in plan but user requested 50, let's stick to what I planned or what user said. User said 10 and 50.
                'slug'        => 'trades_50',
                'name'        => 'Maestro del Trueque',
                'description' => 'Eres un experto comerciante con 50 intercambios completados.',
                'badge_icon'  => '👑',
                'xp_points'   => 250,
            ],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['slug' => $achievement['slug']],
                $achievement
            );
        }
    }
}
