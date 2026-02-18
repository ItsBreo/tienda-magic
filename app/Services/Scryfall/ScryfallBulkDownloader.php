<?php

namespace App\Services\Scryfall;

use Illuminate\Support\Facades\Http;
// use Illuminate\Support\Facades\Log;

class ScryfallBulkDownloader
{
    public function download(string $type = 'default_cards'): string
    {
        // Request the bulk data from Scryfall
        $response = Http::get('https://api.scryfall.com/bulk-data');

        if ($response->failed()){
            throw new \Exception('Connection to Scryfall failed');
        }

        $downloadUrl = collect($response->json('data'))
            ->firstWhere('type', $type)['download_uri']
        ;

        // Download the bulk data
        $path = storage_path("app/scryfall_{$type}.json");

        // Save the file to disk with a timeout bc it can take a while
        Http::timeout(600)->sink($path)->get($downloadUrl);

        return $path;
    }
}

?>
