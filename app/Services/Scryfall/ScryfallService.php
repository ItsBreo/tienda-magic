<?php

namespace App\Services\Scryfall;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ScryfallService
{
    private const BASE_URL = 'https://api.scryfall.com';
    private const DEFAULT_HEADERS = [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept' => 'application/json',
    ];

    /**
     * Obtiene el nombre del último set lanzado o en spoilers.
     */
    public function getLatestSet(): string
    {
        return Cache::remember('scryfall_latest_set', 60 * 60 * 24, function () {
            try {
                $response = $this->makeRequest('/sets');

                if ($response->successful()) {
                    return $response->json('data.0.name');
                }

                Log::warning('Scryfall respondió con error: ' . $response->status());
                return 'Desconocido';

            } catch (\Exception $e) {
                Log::error('Error conectando a Scryfall: ' . $e->getMessage());
                return 'Desconocido';
            }
        });
    }

    /**
     * Obtiene todos los sets desde Scryfall
     */
    public function getSets(): ?array
    {
        try {
            $response = $this->makeRequest('/sets');

            if ($response->successful()) {
                return $response->json('data');
            }

            Log::error('Error obteniendo sets: ' . $response->status());
            return null;

        } catch (\Exception $e) {
            Log::error('Excepción obteniendo sets: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Obtiene cartas de un set específico con paginación
     */
    public function getCardsBySet(string $setCode, int $page = 1): ?array
    {
        try {
            $response = $this->makeRequest('/cards/search', [
                'q' => "set:{$setCode}",
                'page' => $page,
                'order' => 'name',
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error("Error obteniendo cartas del set {$setCode}: " . $response->status());
            return null;

        } catch (\Exception $e) {
            Log::error("Excepción obteniendo cartas del set {$setCode}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Extrae la URI de imagen de una carta
     */
    public function getCardImageUri(array $card): ?string
    {
        // Prioridad: image_uris.normal -> card_faces[0].image_uris.normal
        if (isset($card['image_uris']['normal'])) {
            return $card['image_uris']['normal'];
        }

        if (isset($card['card_faces'][0]['image_uris']['normal'])) {
            return $card['card_faces'][0]['image_uris']['normal'];
        }

        return null;
    }

    /**
     * Verifica si una carta debe ser saltada (tokens, etc)
     */
    public function shouldSkipCard(array $card): bool
    {
        $skipLayouts = ['token', 'double_faced_token', 'emblem', 'planar'];
        return in_array($card['layout'] ?? '', $skipLayouts);
    }

    /**
     * Realiza una petición HTTP a la API de Scryfall
     */
    private function makeRequest(string $endpoint, array $params = []): \Illuminate\Http\Client\Response
    {
        return Http::withoutVerifying()
            ->withHeaders(self::DEFAULT_HEADERS)
            ->timeout(30)
            ->get(self::BASE_URL . $endpoint, $params);
    }
}
