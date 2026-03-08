<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\Scryfall\ScryfallService;
use App\Models\CardSet;

class ScryfallSyncSets extends Command
{
    protected $signature = 'scryfall:sync-sets';
    protected $description = 'Import sets from Scryfall';

    public function handle(ScryfallService $scryfallService)
    {
        $this->info('--- Downloading sets list from Scryfall ---');

        $sets = $scryfallService->getSets();

        if (!$sets) {
            $this->error('Failed to retrieve sets from Scryfall');
            return 1;
        }

        $this->info('Sets encontrados: ' . count($sets));

        $bar = $this->output->createProgressBar(count($sets));

        foreach ($sets as $set) {
            // Skip meme/invalid sets
            if (!in_array($set['set_type'], ['expansion', 'core', 'masters', 'commander', 'draft_innovation'])) {
                $bar->advance(); // Avanzamos la barra aunque no guardemos
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

            // Pequeña pausa entre sets
            usleep(50000); // 50ms
        }

        $bar->finish();
        $this->newLine();
        $this->info('Expansions updated successfully!');

        return 0;
    }
}
