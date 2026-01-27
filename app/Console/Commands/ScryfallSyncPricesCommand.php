<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * ScryfallSyncPricesCommand - Sincroniza precios de cartas
 * 
 * Uso: php artisan scryfall:sync-prices {--set=} {--all}
 * 
 * Los precios en Scryfall se actualizan diariamente.
 * Este comando debería ejecutarse via CRON cada día.
 * 
 * TODO: Implementar:
 * 
 * 1. Propiedades del comando:
 *    protected $signature = 'scryfall:sync-prices 
 *        {--set= : Sincronizar solo un set específico}
 *        {--all : Sincronizar todos los precios}
 *        {--record-history : Guardar en card_price_history}';
 *    
 *    protected $description = 'Sincroniza precios de cartas desde Scryfall';
 * 
 * 2. handle(): int
 *    - Descargar bulk data (tiene precios actualizados)
 *    - Actualizar solo campo market_avg_price
 *    - Si --record-history: insertar en card_price_history
 * 
 * 3. updatePrices(array $cards): void
 *    - Batch update de precios
 *    - Solo actualizar si el precio cambió
 * 
 * 4. recordPriceHistory(Card $card, float $oldPrice, float $newPrice): void
 *    - Guardar en card_price_history para tracking
 *    - Útil para gráficos de evolución de precios
 * 
 * CONFIGURACIÓN CRON (en app/Console/Kernel.php):
 *   $schedule->command('scryfall:sync-prices --all --record-history')
 *            ->dailyAt('10:00')  // Después de que Scryfall actualice
 *            ->withoutOverlapping();
 * 
 * NOTAS:
 * - Scryfall actualiza precios ~9:00 UTC
 * - Programar este comando para después de esa hora
 * - Los precios vienen en USD y EUR
 */
class ScryfallSyncPricesCommand extends Command
{
    protected $signature = 'scryfall:sync-prices';
    protected $description = 'Sincroniza precios desde Scryfall';

    public function handle(): int
    {
        $this->info('TODO: Implementar sincronización de precios');

        return Command::SUCCESS;
    }
}
