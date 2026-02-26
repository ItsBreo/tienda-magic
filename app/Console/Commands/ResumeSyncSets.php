<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class ResumeSyncSets extends Command
{
    protected $signature = 'scryfall:resume-sync {--limit=30 : Number of cards per set} {--start= : Start from specific set code}';
    protected $description = 'Resume card import from where it failed';

    public function handle()
    {
        $limit = $this->option('limit');
        $startFrom = $this->option('start');
        
        $this->info('=== REANUDANDO IMPORTACIÓN DE SETS ===');
        
        // Obtener todos los sets de booster packs
        $packSets = DB::table('booster_pack')
            ->select('card_set_id')
            ->distinct()
            ->orderBy('card_set_id')
            ->pluck('card_set_id');

        if ($startFrom) {
            $startIndex = $packSets->search($startFrom);
            if ($startIndex === false) {
                $this->error("Set '{$startFrom}' no encontrado");
                return 1;
            }
            $packSets = $packSets->slice($startIndex);
            $this->info("Reanudando desde set: {$startFrom}");
        }

        $this->info("Sets pendientes: " . $packSets->count());
        $this->newLine();

        $totalImported = 0;
        $failedSets = [];

        foreach ($packSets as $index => $setCode) {
            $this->info("Importando set: {$setCode}");
            
            try {
                // Usar límite más bajo para evitar problemas de memoria
                $exitCode = Artisan::call('scryfall:sync-cards', [
                    '--set' => $setCode,
                    '--limit' => $limit
                ]);

                if ($exitCode === 0) {
                    $this->info("✅ Set {$setCode} importado");
                    $totalImported += $limit;
                } else {
                    $this->error("❌ Error en set {$setCode}");
                    $failedSets[] = $setCode;
                }
            } catch (\Exception $e) {
                $this->error("❌ Error crítico en set {$setCode}: " . $e->getMessage());
                $failedSets[] = $setCode;
                
                // Si hay error de memoria, mostrar cómo continuar
                if (strpos($e->getMessage(), 'memory') !== false) {
                    $this->warn("Error de memoria detectado. Para continuar:");
                    $this->warn("php artisan scryfall:resume-sync --start={$setCode}");
                    break;
                }
            }
            
            // Pausa más larga y limpieza de memoria
            gc_collect_cycles();
            sleep(3);
            
            $this->newLine();
        }

        $this->info('=== RESUMEN ===');
        $this->info("Sets importados: " . ($packSets->count() - count($failedSets)));
        $this->info("Sets fallidos: " . count($failedSets));
        
        return count($failedSets) === 0 ? 0 : 1;
    }
}
