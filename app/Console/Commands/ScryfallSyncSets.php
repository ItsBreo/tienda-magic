<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\CardSet; // TODO: PASS ALL MODELS TO PascalCase AND THEN PULL CHANGES ON MAIN

class ScryfallSyncSets extends Command
{
    protected $signature = 'scryfall:sync-sets';
    protected $description = 'Import sets from Scryfall';

    public function handle()
    {
        $this->info('--- Downloading sets list from Scryfall ---');

        $response = Http::get('https://api.scryfall.com/sets');

        if ($response->failed()) {
            $this->error('Connection to Scryfall failed.');
            return;
        }

        $sets = $response->json('data');
        $bar = $this->output->createProgressBar(count($sets));

        foreach ($sets as $set) {

            // Skip meme/invalid sets
            if (!in_array($set['set_type'], ['expansion', 'core', 'masters', 'commander', 'draft_innovation'])) {
                continue;
            }

            CardSet::updateOrCreate(
                ['code' => $set['code']],
                [
                    'name' => $set['name'],
                    'released_at' => $set['released_at'] ?? null,
                    'card_count' => $set['card_count'],
                    'icon_svg_uri' => $set['icon_svg_uri'],
                ]
            );
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Expansions updated successfully!');
    }
}
?>
