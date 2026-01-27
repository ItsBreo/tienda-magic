<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * ImportScryfallCardsJob - Job para importación en background
 * 
 * Usar Jobs para imports grandes evita timeouts en web requests.
 * Ideal para:
 * - Import inicial de bulk data
 * - Sincronización programada de precios
 * - Actualización de sets nuevos
 * 
 * TODO: Implementar:
 * 
 * 1. Propiedades:
 *    public $timeout = 3600;  // 1 hora máximo
 *    public $tries = 3;       // Reintentos si falla
 *    public $backoff = 60;    // Esperar 60s entre reintentos
 * 
 * 2. __construct(?string $setCode = null, bool $useBulk = true)
 *    - $setCode: null para import completo, o código de set específico
 *    - $useBulk: true para usar bulk data, false para API
 * 
 * 3. handle(ScryfallService $service, ScryfallBulkDownloader $downloader): void
 *    - Inyección de dependencias automática por Laravel
 *    - Ejecutar la importación
 *    - Emitir eventos de progreso si es necesario
 * 
 * 4. failed(\Throwable $exception): void
 *    - Manejar fallos (notificar admin, log, etc.)
 * 
 * USO:
 *   // Desde un Controller o Command:
 *   ImportScryfallCardsJob::dispatch('neo');  // Import set específico
 *   ImportScryfallCardsJob::dispatch(null, true);  // Import bulk completo
 * 
 * CONFIGURACIÓN DE QUEUE:
 * - Usar queue dedicada: QUEUE_CONNECTION=database
 * - Ejecutar worker: php artisan queue:work --queue=scryfall
 * 
 * NOTAS:
 * - Los Jobs permiten reintentos automáticos si falla
 * - Se pueden monitorear con Laravel Horizon
 * - Considerar usar batches para imports muy grandes
 */
class ImportScryfallCardsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        // TODO: Añadir parámetros necesarios
    }

    public function handle(): void
    {
        // TODO: Implementar lógica de importación
    }
}
