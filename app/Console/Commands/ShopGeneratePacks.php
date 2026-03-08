<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB as DB;
use App\Models\CardSet;
use App\Models\BoosterPack;
use App\Models\Card;

class ShopGeneratePacks extends Command
{
    protected $signature = 'shop:generate-packs {--set= : Generate pack for specific set code} {--force : Override existing packs}';
    protected $description = 'Generate booster packs from imported card sets with proper pricing and configuration';

    public function handle()
    {
        $this->info('=== Magic Shop - Booster Pack Generator ===');
        $this->newLine();

        $specificSet = $this->option('set');
        $force = $this->option('force');

        // Obtener sets que tienen cartas importadas
        $query = CardSet::whereExists(function ($query) {
            $query->select(DB::raw(1))
                  ->from('cards')
                  ->whereColumn('cards.card_set_id', 'card_sets.id');
        });

        if ($specificSet) {
            $query->where('code', strtoupper($specificSet));
            $this->info("Generating pack for set: {$specificSet}");
        } else {
            $this->info('Finding sets with imported cards...');
        }

        $cardSets = $query->orderBy('released_at', 'desc')->get();

        if ($cardSets->isEmpty()) {
            $this->error('No sets found with imported cards. Please run scryfall:sync-cards first.');
            return 1;
        }

        $this->info("Found {$cardSets->count()} sets with cards:");
        foreach ($cardSets as $set) {
            $cardCount = Card::where('card_set_id', $set->id)->count();
            $this->line("  - {$set->code}: {$set->name} ({$cardCount} cards)");
        }
        $this->newLine();

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;

        foreach ($cardSets as $set) {
            $cardCount = Card::where('card_set_id', $set->id)->count();

            // Verificar si ya existe un booster pack
            $existingPack = BoosterPack::where('card_set_id', $set->code)->first();

            if ($existingPack && !$force) {
                $this->line("✓ Pack already exists: {$set->code} - {$set->name} (use --force to override)");
                $skippedCount++;
                continue;
            }

            // Generar configuración del pack
            $config = $this->generatePackConfig($set, $cardCount);

            // Calcular precio
            $price = $this->calculatePackPrice($set, $config, $cardCount);

            // Obtener imagen de portada
            $imageUri = $this->getPackImage($set);

            $packData = [
                'name' => $set->name . ' Draft Booster',
                'card_set_id' => $set->code,
                'type' => $this->determinePackType($set),
                'price' => $price,
                'config' => json_encode($config),
                'image_uri' => $imageUri, // Mantiener compatibilidad con BD
            ];

            if ($existingPack && $force) {
                $existingPack->update($packData);
                $this->info("↻ Updated pack: {$set->name} - €{$price}");
                $updatedCount++;
            } else {
                BoosterPack::create($packData);
                $this->info("+ Created pack: {$set->name} - €{$price}");
                $createdCount++;
            }
        }

        $this->newLine();
        $this->info('=== Generation Summary ===');
        $this->info("Created: {$createdCount} packs");
        $this->info("Updated: {$updatedCount} packs");
        $this->info("Skipped: {$skippedCount} packs");
        $this->info("Total: {$cardSets->count()} sets processed");

        return 0;
    }

    private function generatePackConfig($set, $cardCount)
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

        // ELIMINADO: La lógica de "Reduced for small set"
        // Todos los packs tienen exactamente 15 cartas, sin importar el tamaño del set

        return $config;
    }

    private function calculatePackPrice($set, $config, $cardCount)
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

    private function determinePackType($set)
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

    private function getPackImage($set)
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

        return $anyCard ? $anyCard->image_uri : null;
    }
}
