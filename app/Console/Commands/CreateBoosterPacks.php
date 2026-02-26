<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CardSet;
use App\Models\BoosterPack;

class CreateBoosterPacks extends Command
{
    protected $signature = 'create:booster-packs';
    protected $description = 'Create booster packs from imported card sets';

    public function handle()
    {
        $this->info('Creating booster packs from card sets...');

        // Obtener todos los sets importados
        $cardSets = CardSet::where('card_count', '>', 0)->get();
        
        $createdCount = 0;

        foreach ($cardSets as $set) {
            // Verificar si ya existe un booster pack para este set
            $existingPack = BoosterPack::where('card_set_id', $set->code)->first();
            
            if ($existingPack) {
                $this->line("Pack already exists for set: {$set->code} - {$set->name}");
                continue;
            }

            // Crear configuración del sobre basada en el tipo de set
            $config = $this->generatePackConfig($set);
            
            // Calcular precio basado en el tipo y rareza del set
            $price = $this->calculatePackPrice($set, $config);

            // Crear el booster pack
            BoosterPack::create([
                'name' => $set->name . ' Booster Pack',
                'card_set_id' => $set->code,
                'type' => $this->determinePackType($set),
                'price' => $price,
                'config' => json_encode($config)
            ]);

            $this->info("Created pack: {$set->name} - €{$price}");
            $createdCount++;
        }

        $this->info("Successfully created {$createdCount} booster packs!");
        return 0;
    }

    private function generatePackConfig($set)
    {
        // Configuración típica basada en el tipo de set
        $config = [
            'common' => 10,
            'uncommon' => 3,
            'rare' => 1,
            'mythic' => 0, // Se determina aleatoriamente
            'total_cards' => 14
        ];

        // Ajustar según el tipo de set
        if (strpos(strtolower($set->type), 'master') !== false) {
            $config = [
                'common' => 0,
                'uncommon' => 0,
                'rare' => 1,
                'mythic' => 1,
                'foil' => 1,
                'total_cards' => 3
            ];
        } elseif (strpos(strtolower($set->type), 'collector') !== false) {
            $config = [
                'common' => 0,
                'uncommon' => 0,
                'rare' => 2,
                'mythic' => 2,
                'foil' => 2,
                'special' => 1,
                'total_cards' => 7
            ];
        }

        return $config;
    }

    private function calculatePackPrice($set, $config)
    {
        // Precio base según el tipo de set
        $basePrice = 3.99; // Precio estándar
        
        if (strpos(strtolower($set->type), 'master') !== false) {
            $basePrice = 12.99;
        } elseif (strpos(strtolower($set->type), 'collector') !== false) {
            $basePrice = 19.99;
        } elseif (strpos(strtolower($set->type), 'expedition') !== false) {
            $basePrice = 8.99;
        }

        // Ajustar según el año (más antiguos más caros)
        if (isset($set->released_at)) {
            $releaseYear = date('Y', strtotime($set->released_at));
            $currentYear = date('Y');
            $yearsOld = $currentYear - $releaseYear;
            
            if ($yearsOld > 10) {
                $basePrice *= 1.5; // 50% más caro si tiene más de 10 años
            } elseif ($yearsOld > 5) {
                $basePrice *= 1.2; // 20% más caro si tiene más de 5 años
            }
        }

        return round($basePrice, 2);
    }

    private function determinePackType($set)
    {
        $setType = strtolower($set->type);
        
        if (strpos($setType, 'master') !== false) {
            return 'master';
        } elseif (strpos($setType, 'collector') !== false) {
            return 'collector';
        } elseif (strpos($setType, 'expedition') !== false) {
            return 'expedition';
        } elseif (strpos($setType, 'core') !== false) {
            return 'core';
        } else {
            return 'expansion';
        }
    }
}
