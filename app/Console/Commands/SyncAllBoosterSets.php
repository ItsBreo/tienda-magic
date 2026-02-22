<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class SyncAllBoosterSets extends Command
{
    protected $signature = 'scryfall:sync-all-sets {--limit=50 : Number of cards per set (reduced for memory)}';
    protected $description = 'Import cards for all sets present in booster packs';

    public function handle()
    {
        $limit = $this->option('limit');

        $this->info('=== IMPORTANDO TODOS LOS SETS DE BOOSTER PACKS ===');

        // Buscar sets de booster packs
        $packSets = DB::table('booster_pack')
            ->select('card_set_id')
            ->distinct()
            ->orderBy('card_set_id')
            ->pluck('card_set_id');

        $this->info("Sets encontrados: " . $packSets->count());
        $this->newLine();

        $totalImported = 0;
        $failedSets = [];

        foreach ($packSets as $index => $setCode) {
            $this->info("[" . ($index + 1) . "/" . $packSets->count() . "] Importando set: {$setCode}");

            try {
                // Usar límite bajo para evitar errores de memoria
                $exitCode = Artisan::call('scryfall:sync-cards', [
                    '--set' => $setCode,
                    '--limit' => $limit
                ]);

                if ($exitCode === 0) {
                    $this->info("✅ Set {$setCode} importado correctamente");
                    $totalImported += $limit;
                } else {
                    $this->error("❌ Error al importar set {$setCode}");
                    $failedSets[] = $setCode;
                }
            } catch (\Exception $e) {
                $this->error("❌ Excepción en set {$setCode}: " . $e->getMessage());
                $failedSets[] = $setCode;
            }

            $this->newLine();

            // Pausar y limpiar memoria entre sets
            gc_collect_cycles();
            sleep(2); // 2 segundos en lugar de 0.5
        }

        $this->info('=== RESUMEN DE IMPORTACIÓN ===');
        $this->info("✅ Sets importados: " . ($packSets->count() - count($failedSets)));
        $this->info("❌ Sets fallidos: " . count($failedSets));
        $this->info("📊 Total cartas importadas: ~" . $totalImported);

        if (!empty($failedSets)) {
            $this->newLine();
            $this->warn('Sets que fallaron:');
            foreach ($failedSets as $set) {
                $this->line("  - {$set}");
            }
        }

        $this->newLine();
        $this->info('🎉 Importación completada!');

        return count($failedSets) === 0 ? 0 : 1;
    }
}
