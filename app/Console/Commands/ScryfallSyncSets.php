<?php

namespace App\Console\Commands;

use App\Models\CardSet;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ScryfallSyncSets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scryfall:sync-sets';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincronizar todos los sets de Magic desde la API de Scryfall';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando sincronización de sets desde Scryfall...');

        try {
            // Obtener datos de la API
            $response = Http::withHeaders([
                'User-Agent' => 'TiendaMagicApp/1.0',
                'Accept' => 'application/json'
            ])->timeout(30)->get('https://api.scryfall.com/sets');

            if (!$response->successful()) {
                $this->error('Error al obtener datos de Scryfall: ' . $response->status());
                return 1;
            }

            $sets = $response->json('data');
            $totalSets = count($sets);

            $this->info("Procesando {$totalSets} sets...");

            // Crear barra de progreso
            $progressBar = $this->output->createProgressBar($totalSets);
            $progressBar->start();

            $syncedCount = 0;

            foreach ($sets as $setData) {
                // Mapear campos de Scryfall a nuestro modelo
                $setMapping = [
                    'code' => $setData['code'],
                    'name' => $setData['name'],
                    'released_at' => $setData['released_at'] ?? null,
                    'icon_svg_uri' => $setData['icon_svg_uri'] ?? null,
                ];

                // Usar updateOrCreate para evitar duplicados
                CardSet::updateOrCreate(['code' => $setData['code']], $setMapping);

                $syncedCount++;
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine();

            $this->info("✅ Sincronización completada: {$syncedCount}/{$totalSets} sets procesados");

            Log::info("Scryfall sets sync completed", [
                'total_sets' => $totalSets,
                'synced_count' => $syncedCount
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Error durante la sincronización: ' . $e->getMessage());
            Log::error('Scryfall sets sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}
