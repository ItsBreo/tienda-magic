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
        // Configuración ESTÁNDAR para TODOS los packs - EXACTAMENTE 15 CARTAS
        $config = [
            'commons' => 10,
            'uncommons' => 3,
            'rare' => 1,
            'mythic' => 0, // 1/8 chance to replace rare
            'foil' => 1, // Siempre 1 foil
            'total_cards' => 15,
            'description' => 'Standard 15-card booster configuration'
        ];

        // Ajustar para sets especiales MANTENIENDO SIEMPRE 15 CARTAS
        $setName = strtolower($set->name);

        if (strpos($setName, 'master') !== false || strpos($setName, 'modern masters') !== false) {
            $config = [
                'commons' => 7,
                'uncommons' => 3,
                'rare' => 2,
                'mythic' => 1,
                'foil' => 2,
                'total_cards' => 15,
                'description' => 'Masters Edition - 15 premium cards'
            ];
        } elseif (strpos($setName, 'collector') !== false) {
            $config = [
                'commons' => 4,
                'uncommons' => 3,
                'rare' => 4,
                'mythic' => 2,
                'foil' => 2,
                'total_cards' => 15,
                'description' => 'Collector Booster - 15 premium cards'
            ];
        } elseif (strpos($setName, 'jumpstart') !== false) {
            $config = [
                'commons' => 8,
                'uncommons' => 3,
                'rare' => 2,
                'special' => 1,
                'foil' => 1,
                'total_cards' => 15,
                'description' => 'Jumpstart Booster - 15 theme-based cards'
            ];
        }

        return $config;
    }

    /**
     * Calcula el precio del pack basado en múltiples factores
     */
    public function calculatePackPrice(CardSet $set, array $config, int $cardCount): float
    {
        // Precio base según tipo de pack
        $basePrice = 3.99; // Standard draft booster

        $setName = strtolower($set->name);

        if (strpos($setName, 'master') !== false) {
            $basePrice = 12.99;
        } elseif (strpos($setName, 'collector') !== false) {
            $basePrice = 19.99;
        } elseif (strpos($setName, 'jumpstart') !== false) {
            $basePrice = 9.99;
        } elseif (strpos($setName, 'expedition') !== false || strpos($setName, 'box') !== false) {
            $basePrice = 24.99;
        }

        // Ajustar según antigüedad
        if ($set->released_at) {
            $releaseYear = date('Y', strtotime($set->released_at));
            $currentYear = date('Y');
            $yearsOld = $currentYear - $releaseYear;

            if ($yearsOld > 15) {
                $basePrice *= 1.8; // 80% más caro si tiene más de 15 años
            } elseif ($yearsOld > 10) {
                $basePrice *= 1.5; // 50% más caro si tiene más de 10 años
            } elseif ($yearsOld > 5) {
                $basePrice *= 1.2; // 20% más caro si tiene más de 5 años
            }
        }

        // Ajustar según tamaño del set
        if ($cardCount < 100) {
            $basePrice *= 0.8; // 20% más barato para sets pequeños
        } elseif ($cardCount > 300) {
            $basePrice *= 1.1; // 10% más caro para sets muy grandes
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
