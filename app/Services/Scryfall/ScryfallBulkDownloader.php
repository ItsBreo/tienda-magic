<?php

namespace App\Services\Scryfall;

use Illuminate\Support\Facades\Http;

class ScryfallBulkDownloader
{
    public function download(string $type = 'default_cards'): string
    {
        $url = 'https://api.scryfall.com/bulk-data';

        // DEFINIMOS LAS CABECERAS EXACTAS QUE PIDE SCRYFALL
        // User-Agent: Quiénes somos (Nos disfrazamos de Chrome)
        // Accept: Qué formato queremos (JSON)
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept'     => 'application/json',
        ];

        // 1. PETICIÓN DE LISTADO
        // Usamos withoutVerifying() para el insti y withHeaders() para Scryfall
        $response = Http::withoutVerifying()
            ->withHeaders($headers)
            ->get($url);

        if ($response->failed()){
            throw new \Exception(
                'Scryfall Error. Status: ' . $response->status() .
                ' | Body: ' . substr($response->body(), 0, 500)
            );
        }

        $downloadUrl = collect($response->json('data'))
            ->firstWhere('type', $type)['download_uri'];

        $path = storage_path("app/scryfall_{$type}.json");

        // 2. DESCARGA DEL ARCHIVO GIGANTE
        // Aquí también necesitamos las cabeceras o nos cortará la descarga
        Http::withoutVerifying()
            ->withHeaders($headers)
            ->timeout(600)
            ->sink($path)
            ->get($downloadUrl);

        return $path;
    }
}
