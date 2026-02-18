<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Card;
use App\Services\Scryfall\ScryfallBulkDownloader;
use Cerbero\JsonParser\JsonParser;

class ScryfallSyncPrices extends Command
{
    protected $signature = 'scryfall:sync-prices';
    protected $description = 'Uptdate prices from Scryfall';

    public function handle(ScryfallBulkDownloader $downloader)
    {
        $this->info('--- Downloading cards list from Scryfall ---');

        try {
            // Download the bulk data
            $file = $downloader->download('default_cards');

            $this->info('Download completed, updating prices...');
            $bar = $this->output->createProgressBar();

            // Parse JSON
            $cards = new JsonParser($file);

            foreach ($cards as $data) {
                // Skip invalid data
                if (!isset($data['id']) || !isset($data['prices'])) continue;

                // Update or create the cards
                Card::updateOrCreate(
                    ['scryfall_id' => $data['id']],
                    [
                        'name' => $data['name'],
                        'set_code' => $data['set'],
                        'collector_number' => $data['collector_number'],
                        'rarity' => $data['rarity'],
                        'price_eur' => $data['prices']['eur'] ?? null,
                        'price_usd' => $data['prices']['usd'] ?? null,
                        'image_uri' => $data['image_uris']['normal']
                            ?? $data['card_faces'][0]['image_uris']['normal']
                            ?? null
                        ,
                        'updated_at' => now(),
                    ]
                );
                $bar->advance();
            }

            $bar->finish();
            $this->info("\n Prices updated successfully!");

        } catch (\Exception $e) {
            $this->error($e->getMessage());
        }
    }
}

?>
