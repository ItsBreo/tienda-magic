<?php

namespace App\Services\Scryfall; // Asegúrate de que tu SetController importe esto exactamente

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ScryfallService
{
    /**
     * Obtiene el nombre del último set lanzado o en spoilers.
     */
    public function getLatestSet(): string
    {
        return Cache::remember('scryfall_latest_set', 60 * 60 * 24, function () {
            try {
                $response = Http::withoutVerifying()
                                ->withHeaders([
                                    'Accept' => 'application/json',
                                    'User-Agent' => 'TiendaMagic/1.0' // ¡El pase VIP para Scryfall!
                                ])
                                ->timeout(10) // Le damos 10 segundos para curarnos en salud
                                ->get('https://api.scryfall.com/sets');

                if ($response->successful()) {
                    return $response->json('data.0.name');
                }

                // Si Scryfall responde pero con error (ej. 403 o 500 de su lado)
                Log::warning('Scryfall respondió con error: ' . $response->status());
                return 'Desconocido';

            } catch (\Exception $e) {
                // Si la petición ni siquiera llega a salir de tu Docker
                Log::error('Error conectando a Scryfall: ' . $e->getMessage());
                return 'Desconocido';
            }
        });
    }
}
