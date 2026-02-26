<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\CardSet;

class ScryfallSyncSets extends Command
{
    protected $signature = 'scryfall:sync-sets';
    protected $description = 'Import sets from Scryfall';

    public function handle()
    {
        $this->info('--- Downloading sets list from Scryfall ---');

        // 👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE
        $response = Http::withoutVerifying()
            ->withHeaders([
                // El disfraz de navegador
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // ⚠️ ESTO FALTABA: Decirle que queremos JSON
                'Accept'     => 'application/json',
            ])
            ->get('https://api.scryfall.com/sets');

        // Debug de errores mejorado
        if ($response->failed()) {
            $this->error('Connection to Scryfall failed.');
            $this->error('Status: ' . $response->status());
            $this->error('Error: ' . substr($response->body(), 0, 200));
            return;
        }

        $sets = $response->json('data');
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
        }

        $bar->finish();
        $this->newLine();
        $this->info('Expansions updated successfully!');
    }
}
