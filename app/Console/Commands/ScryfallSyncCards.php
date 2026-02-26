<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Card;
use App\Models\CardSet;

class ScryfallSyncCards extends Command
{
    protected $signature = 'scryfall:sync-cards {--set= : Set code to sync specific set} {--limit=100 : Number of cards to import}';
    protected $description = 'Import cards from Scryfall with image URIs';

    public function handle()
    {
        $setCode = $this->option('set');
        $limit = $this->option('limit');

        if ($setCode) {
            $this->syncSet($setCode, $limit);
        } else {
            // Sync all sets (limited)
            $sets = CardSet::where('card_count', '>', 0)
                ->orderBy('released_at', 'desc')
                ->take(5) // Limit to 5 most recent sets
                ->get();

            foreach ($sets as $set) {
                $this->syncSet($set->code, min(50, $limit)); // 50 cards per set max
            }
        }

        $this->info('Card sync completed!');
    }

    private function syncSet($setCode, $limit)
    {
        $this->info("Syncing cards for set: {$setCode}");

        $page = 1;
        $imported = 0;

        do {
            $this->info("Fetching page {$page}...");

            $response = Http::withoutVerifying()
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'application/json',
                ])
                ->get("https://api.scryfall.com/cards/search", [
                    'q' => "set:{$setCode}",
                    'page' => $page,
                    'order' => 'name',
                ]);

            if ($response->failed()) {
                $this->error("Failed to fetch page {$page}: " . $response->status());
                break;
            }

            $data = $response->json();
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
                if (in_array($card['layout'] ?? '', ['token', 'double_faced_token', 'emblem', 'planar'])) {
                    $bar->advance();
                    continue;
                }

                // Extract image URI
                $imageUri = null;
                if (isset($card['image_uris']['normal'])) {
                    $imageUri = $card['image_uris']['normal'];
                } elseif (isset($card['card_faces'][0]['image_uris']['normal'])) {
                    $imageUri = $card['card_faces'][0]['image_uris']['normal'];
                }

                Card::updateOrCreate(
                    ['scryfall_id' => $card['id']],
                    [
                        'name' => $card['name'],
                        'set_code' => $setCode,
                        'collector_number' => $card['collector_number'] ?? '',
                        'rarity' => $card['rarity'] ?? 'common',
                        'image_uri' => $imageUri,
                        'price_eur' => $card['prices']['eur'] ?? null,
                        'price_usd' => $card['prices']['usd'] ?? null,
                        'mana_value' => $card['cmc'] ?? 0,
                        'card_set_id' => strtolower($setCode), // Usar el código del set directamente
                        'data' => $card, // Store full Scryfall data
                    ]
                );

                $imported++;
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Imported {$imported} cards so far...");

            $page++;

        } while (isset($data['has_more']) && $data['has_more'] && $imported < $limit);

        $this->info("Completed syncing set {$setCode}. Total imported: {$imported}");
    }
}
