<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class ShopSetupDemo extends Command
{
    protected $signature = 'shop:setup-demo';
    protected $description = 'Automatizar la inicialización completa del catálogo para demo (truncar, sincronizar sets, descargar cartas, generar packs)';

    public function handle()
    {
        $this->info('=== Magic Shop - Inicialización Automatizada de Demo ===');
        $this->newLine();

        // Paso 1: Limpiar base de datos
        $this->info('🧹 Paso 1/4: Limpiando base de datos...');
        $bar = $this->output->createProgressBar(1);
        $bar->start();
        DB::statement('TRUNCATE TABLE booster_pack, cards CASCADE');
        $bar->finish();
        $this->newLine();
        $this->info('✅ Base de datos limpiada (booster_pack, cards)');
        $this->newLine();

        // Paso 2: Sincronizar sets desde Scryfall
        $this->info('📚 Paso 2/4: Sincronizando sets desde Scryfall...');
        $bar = $this->output->createProgressBar(1);
        $bar->start();
        Artisan::call('scryfall:sync-sets');
        $bar->finish();
        $this->newLine();
        $this->info('✅ Sets sincronizados desde Scryfall');
        $this->newLine();

        // Paso 3: Descargar cartas de sets God-Tier
        $this->info('🃏 Paso 3/4: Descargando cartas de sets premium...');

        $godTierSets = ['MH1', 'MH2', 'MH3', 'UMA', '2XM', 'CMM', 'NEO', 'ONE', 'BRO', 'WAR', 'MOM', 'LCI'];
        $totalSets = count($godTierSets);

        $bar = $this->createSetProgressBar($totalSets);
        $bar->start();

        foreach ($godTierSets as $index => $set) {
            $progress = $index + 1;
            $bar->setMessage("Descargando {$set} ({$progress}/{$totalSets})");
            $bar->advance();

            Artisan::call('scryfall:sync-cards', ['--set' => $set, '--limit' => 100]);

            // Pequeña pausa entre sets para no sobrecargar API
            usleep(200000); // 200ms
        }

        $bar->finish();
        $this->newLine();
        $this->info("✅ Descargadas 100 cartas de {$totalSets} sets premium");
        $this->newLine();

        // Paso 4: Generar packs para todos los sets
        $this->info('🎯 Paso 4/4: Generando booster packs...');
        $bar = $this->output->createProgressBar(1);
        $bar->start();
        Artisan::call('shop:generate-packs');
        $bar->finish();
        $this->newLine();
        $this->info('✅ Booster packs generados para todos los sets');
        $this->newLine();

        // Resumen final
        $this->info('=== Resumen de Inicialización ===');
        $this->info('📊 Sets procesados: ' . $totalSets);
        $this->info('🃏 Cartas descargadas: ' . ($totalSets * 100));
        $this->info('🎁 Packs generados: Verificar con shop:generate-packs');
        $this->newLine();

        $this->info('🚀 Sistema listo para la demo!');
        $this->info('💡 Ejecuta "php artisan serve" para iniciar el servidor');
        $this->info('🌐 Visita http://localhost:8000/shop para ver el catálogo');

        return 0;
    }

    /**
     * Crear barra de progreso personalizada para el bucle de sets
     */
    private function createSetProgressBar($totalSets)
    {
        return $this->output->createProgressBar($totalSets);
    }
}
