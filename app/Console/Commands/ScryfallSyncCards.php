<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\Scryfall\ScryfallService;
use App\Models\Card;
use App\Models\CardSet;

class ScryfallSyncCards extends Command
{
    protected $signature = 'scryfall:sync-cards {--set= : Set code to sync specific set} {--limit=100 : Number of cards to import}';
    protected $description = 'Import cards from Scryfall with image URIs';

    public function handle(ScryfallService $scryfallService)
    {
        $setCode = $this->option('set');
        $limit = $this->option('limit');

        if ($setCode) {
            $this->syncSet($scryfallService, $setCode, $limit);
        } else {
            // Sync all sets (limited)
            $sets = CardSet::where('card_count', '>', 0)
                ->orderBy('released_at', 'desc')
                ->take(5) // Limit to 5 most recent sets
                ->get();

            foreach ($sets as $set) {
                $this->syncSet($scryfallService, $set->code, min(50, $limit)); // 50 cards per set max
            }
        }

        $this->info('Card sync completed!');
        return 0;
    }

    private function syncSet(ScryfallService $scryfallService, string $setCode, int $limit)
    {
        $this->info("Syncing cards for set: {$setCode}");

        $page = 1;
        $imported = 0;

        do {
            $this->info("Fetching page {$page}...");

            $data = $scryfallService->getCardsBySet($setCode, $page);

            if (!$data) {
                $this->error("Failed to fetch page {$page}");
                break;
            }

            $cards = $data['data'] ?? [];

            if (empty($cards)) {
                break;
            }

            $bar = $this->output->createProgressBar(count($cards));
            $bar->start();

            foreach ($cards as $card) {
                if ($imported >= $limit) {
                    $this->info("\nLimit reached for set {$setCode}");
                    break 2;
                }

                // Skip tokens and non-game pieces
                if ($scryfallService->shouldSkipCard($card)) {
                    $bar->advance();
                    continue;
                }

                // Extract image URI
                $imageUri = $scryfallService->getCardImageUri($card);

                // Buscar el set para obtener su ID (case-insensitive)
                $cardSet = CardSet::whereRaw('LOWER(code) = ?', [strtolower($setCode)])->first();
                $cardSetId = $cardSet ? $cardSet->id : null;

                // VALIDACIÓN CRÍTICA: Si el set no existe, loggear error y saltar
                if (!$cardSetId) {
                    $this->error("Set '{$setCode}' not found in database. Skipping card: {$card['name']}");
                    $bar->advance();
                    continue;
                }

                try {
                    Card::updateOrCreate(
                        ['scryfall_id' => $card['id']],
                        [
                            'name' => $card['name'],
                            'set_code' => $setCode,
                            'collector_number' => $card['collector_number'] ?? '',
                            'rarity' => $card['rarity'] ?? 'common',
                            'image_uri' => $imageUri,
                            'mana_value' => $card['cmc'] ?? 0,
                            'card_set_id' => $cardSetId, // ID del set para la relación
                            'data' => $card, // Guardar datos completos de Scryfall
                        ]
                    );
                } catch (\Exception $e) {
                    $this->error("Failed to save card '{$card['name']}': " . $e->getMessage());
                    $bar->advance();
                    continue;
                }

                $imported++;
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Imported {$imported} cards so far...");

            $page++;

            // Pausa para no sobrecargar la API de Scryfall
            usleep(100000); // 100ms entre peticiones

        } while (isset($data['has_more']) && $data['has_more'] && $imported < $limit);

        $this->info("Completed syncing set {$setCode}. Total imported: {$imported}");
    }
}
