<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CardSet;
use App\Models\BoosterPack;
use App\Models\Card;
use App\Services\PackService;

class GenerateSpecificPack extends Command
{
    protected $signature = 'app:generate-specific-pack {setCode : Generate pack for specific set code}';
    protected $description = 'Generate booster pack for a specific set';

    public function handle(PackService $packService)
    {
        $setCode = $this->argument('setCode');

        $this->info("=== Generating pack for set: {$setCode} ===");

        // Buscar el set (case-insensitive)
        $set = CardSet::whereRaw('LOWER(code) = ?', [strtolower($setCode)])->first();

        if (!$set) {
            $this->error("Set '{$setCode}' not found in database.");
            return 1;
        }

        // Verificar si tiene cartas
        $cardCount = Card::where('card_set_id', $set->id)->count();

        if ($cardCount === 0) {
            $this->error("Set '{$setCode}' has no cards imported. Run scryfall:sync-cards first.");
            return 1;
        }

        $this->info("Found {$cardCount} cards for set: {$set->name}");

        // Eliminar pack existente si hay
        BoosterPack::where('card_set_id', $set->code)->delete();

        // Generar configuración
        $config = $packService->generatePackConfig($set);
        $price = $packService->calculatePackPrice($set, $config, $cardCount);
        $imageUri = $packService->getPackImage($set);
        $packType = $packService->determinePackType($set);

        // Crear pack
        BoosterPack::create([
            'name' => $set->name . ' Draft Booster',
            'card_set_id' => $set->code,
            'type' => $packType,
            'price' => $price,
            'config' => json_encode($config),
            'image_uri' => $imageUri,
        ]);

        $this->info("✅ Pack created: {$set->name} - €{$price}");
        $this->info("📦 Configuration: " . $config['description']);

        return 0;
    }
}
