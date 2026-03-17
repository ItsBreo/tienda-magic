<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Achievement;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            [
                'slug'        => 'first_register',
                'name'        => 'Bienvenido Planeswalker',
                'description' => 'Creaste tu cuenta en la Tienda Magic.',
                'badge_icon'  => '🧙',
                'xp_points'   => 10,
            ],
            [
                'slug'        => 'email_verified',
                'name'        => 'Identidad Confirmada',
                'description' => 'Verificaste tu correo electrónico.',
                'badge_icon'  => '✅',
                'xp_points'   => 20,
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
                'description' => 'Completaste 10 transacciones.',
                'badge_icon'  => '💰',
                'xp_points'   => 50,
            ],
            [
                'slug'        => 'transactions_50',
                'name'        => 'Mercader Experto',
                'description' => 'Completaste 50 transacciones.',
                'badge_icon'  => '💎',
                'xp_points'   => 150,
            ],
            [
                'slug'        => 'verified_trader',
                'name'        => 'Verificado',
                'description' => 'Trader de confianza de la comunidad.',
                'badge_icon'  => '🔵', // badge estilo Twitter
                'xp_points'   => 100,
            ],
        ];

        foreach ($achievements as $achievement) {
            Achievement::firstOrCreate(
                ['slug' => $achievement['slug']],
                $achievement
            );
        }
    }
}
