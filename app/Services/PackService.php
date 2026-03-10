<?php

namespace App\Services;

use App\Models\CardSet;
use App\Models\Card;

class PackService
{
    /**
     * Genera configuración del pack basada en el tipo de set
     */
    public function generatePackConfig(CardSet $set): array
    {
        $setName = strtolower($set->name);

        // MASTER PACKS - Premium con muchas cartas raras
        if (strpos($setName, 'master') !== false || strpos($setName, 'modern masters') !== false) {
            return [
                'commons' => 5,
                'uncommons' => 3,
                'rare' => 4,
                'mythic' => 2,
                'foil' => 3,
                'total_cards' => 15,
                'description' => 'Masters Edition - Ultra premium with guaranteed foils'
            ];
        }

        // COLLECTOR BOOSTERS - El más exclusivo
        if (strpos($setName, 'collector') !== false) {
            return [
                'commons' => 2,
                'uncommons' => 2,
                'rare' => 6,
                'mythic' => 3,
                'foil' => 4,
                'total_cards' => 15,
                'description' => 'Collector Booster - Maximum rarity guaranteed'
            ];
        }

        // JUMPSTART - Para juego rápido
        if (strpos($setName, 'jumpstart') !== false) {
            return [
                'commons' => 8,
                'uncommons' => 4,
                'rare' => 2,
                'mythic' => 1,
                'foil' => 1,
                'total_cards' => 15,
                'description' => 'Jumpstart - Ready-to-play deck starter'
            ];
        }

        // SPECIAL EDITIONS - Sets temáticos
        if (strpos($setName, 'expedition') !== false || strpos($setName, 'box') !== false) {
            return [
                'commons' => 3,
                'uncommons' => 3,
                'rare' => 5,
                'mythic' => 3,
                'foil' => 4,
                'total_cards' => 15,
                'description' => 'Special Edition - Exclusive themed cards'
            ];
        }

        // COMMANDER - Optimizado para Commander
        if (strpos($setName, 'commander') !== false) {
            return [
                'commons' => 6,
                'uncommons' => 4,
                'rare' => 3,
                'mythic' => 1,
                'foil' => 2,
                'total_cards' => 15,
                'description' => 'Commander Optimized - Perfect for EDH decks'
            ];
        }

        // DRAFT BOOSTER - Estándar
        return [
            'commons' => 10,
            'uncommons' => 3,
            'rare' => 1,
            'mythic' => 0, // 1/8 chance to replace rare
            'foil' => 1, // Siempre 1 foil
            'total_cards' => 15,
            'description' => 'Draft Booster - Standard 15-card pack'
        ];
    }

    /**
     * Calcula el precio del pack basado en múltiples factores
     */
    public function calculatePackPrice(CardSet $set, array $config, int $cardCount): float
    {
        $setName = strtolower($set->name);

        // PRECIOS BASE SEGÚN TIPO DE PACK - Mayor diferencia de precios
        if (strpos($setName, 'master') !== false) {
            $basePrice = 16.99; // Masters - Premium
        } elseif (strpos($setName, 'collector') !== false) {
            $basePrice = 24.99; // Collector - El más caro
        } elseif (strpos($setName, 'jumpstart') !== false) {
            $basePrice = 11.99; // Jumpstart - Mid-range
        } elseif (strpos($setName, 'expedition') !== false || strpos($setName, 'box') !== false) {
            $basePrice = 29.99; // Special Edition - Ultra premium
        } elseif (strpos($setName, 'commander') !== false) {
            $basePrice = 14.99; // Commander - Para jugadores serios
        } else {
            $basePrice = 4.99; // Draft Booster - Precio estándar
        }

        // AJUSTE POR ANTIGÜEDAD - Sets vintage más caros
        if ($set->released_at) {
            $releaseYear = date('Y', strtotime($set->released_at));
            $currentYear = date('Y');
            $yearsOld = $currentYear - $releaseYear;

            if ($yearsOld > 20) {
                $basePrice *= 2.5; // 150% más caro si tiene más de 20 años
            } elseif ($yearsOld > 15) {
                $basePrice *= 2.0; // 100% más caro si tiene más de 15 años
            } elseif ($yearsOld > 10) {
                $basePrice *= 1.6; // 60% más caro si tiene más de 10 años
            } elseif ($yearsOld > 5) {
                $basePrice *= 1.3; // 30% más caro si tiene más de 5 años
            }
        }

        // AJUSTE POR TAMAÑO Y RAREZA DEL SET
        if ($cardCount < 50) {
            $basePrice *= 1.2; // 20% más caro para sets muy pequeños
        } elseif ($cardCount > 400) {
            $basePrice *= 1.15; // 15% más caro para sets muy grandes
        }

        // AJUSTE POR POPULARIDAD (basado en nombre)
        if (strpos($setName, 'avatar') !== false || strpos($setName, 'marvel') !== false || strpos($setName, 'turtle') !== false) {
            $basePrice *= 1.25; // 25% más caro para sets temáticos populares
        }

        return round($basePrice, 2);
    }

    /**
     * Determina el tipo de pack basado en el nombre del set
     */
    public function determinePackType(CardSet $set): string
    {
        $setName = strtolower($set->name);

        if (strpos($setName, 'master') !== false) {
            return 'master';
        } elseif (strpos($setName, 'collector') !== false) {
            return 'collector';
        } elseif (strpos($setName, 'jumpstart') !== false) {
            return 'jumpstart';
        } elseif (strpos($setName, 'expedition') !== false) {
            return 'expedition';
        } elseif (strpos($setName, 'core') !== false) {
            return 'core';
        } else {
            return 'expansion';
        }
    }

    /**
     * Obtiene la imagen de portada para un pack
     */
    public function getPackImage(CardSet $set): ?string
    {
        // Buscar carta mítica del set para usar como portada
        $mythicCard = Card::where('card_set_id', $set->id)
            ->where('rarity', 'mythic')
            ->whereNotNull('image_uri')
            ->orderBy('name')
            ->first();

        if ($mythicCard) {
            return $mythicCard->image_uri;
        }

        // Si no hay míticas, buscar una rara
        $rareCard = Card::where('card_set_id', $set->id)
            ->where('rarity', 'rare')
            ->whereNotNull('image_uri')
            ->orderBy('name')
            ->first();

        if ($rareCard) {
            return $rareCard->image_uri;
        }

        // Si no hay raras, usar cualquier carta con imagen
        $anyCard = Card::where('card_set_id', $set->id)
            ->whereNotNull('image_uri')
            ->orderBy('name')
            ->first();

        return $anyCard?->image_uri;
    }
}
