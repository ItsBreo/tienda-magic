<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB as DB;
use App\Models\CardSet;
use App\Models\BoosterPack;
use App\Models\Card;
use App\Services\PackService;

class ShopGeneratePacks extends Command
{
    protected $signature = 'shop:generate-packs {set? : Generate pack for specific set code} {--force : Override existing packs}';
    protected $description = 'Generate booster packs from imported card sets with proper pricing and configuration';

    public function handle(PackService $packService)
    {
        $this->info('=== Magic Shop - Booster Pack Generator ===');
        $this->newLine();

        $specificSet = $this->argument('set');
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

            // Generar configuración del pack usando el servicio
            $config = $packService->generatePackConfig($set);

            // Calcular precio usando el servicio
            $price = $packService->calculatePackPrice($set, $config, $cardCount);

            // Obtener imagen de portada usando el servicio
            $imageUri = $packService->getPackImage($set);

            // Determinar tipo de pack usando el servicio
            $packType = $packService->determinePackType($set);

            $packData = [
                'name' => $set->name . ' Draft Booster',
                'card_set_id' => $set->code,
                'type' => $packType,
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
}
