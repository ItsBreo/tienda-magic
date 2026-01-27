<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * ScryfallImportCommand - Comando para importar cartas de Scryfall
 * 
 * Uso: php artisan scryfall:import {set?} {--all} {--bulk}
 * 
 * Ejemplos:
 *   php artisan scryfall:import neo        # Importar solo set Kamigawa
 *   php artisan scryfall:import --bulk     # Importar TODO usando bulk data
 *   php artisan scryfall:import --all      # Importar todos los sets via API
 * 
 * TODO: Implementar:
 * 
 * 1. Propiedades del comando:
 *    protected $signature = 'scryfall:import 
 *        {set? : Código del set a importar (ej: neo, one, mkm)}
 *        {--all : Importar todos los sets disponibles}
 *        {--bulk : Usar bulk data en lugar de API (recomendado)}
 *        {--force : Sobrescribir cartas existentes}';
 *    
 *    protected $description = 'Importa cartas desde Scryfall a la base de datos';
 * 
 * 2. handle(): int
 *    - Validar opciones (set o --all o --bulk requerido)
 *    - Si --bulk: usar ScryfallBulkDownloader
 *    - Si set específico: usar ScryfallService->getCardsBySet()
 *    - Mostrar barra de progreso
 *    - Usar upsert para evitar duplicados (por scryfall_id)
 * 
 * 3. importFromBulk(): void
 *    - Descargar bulk data
 *    - Procesar con streaming
 *    - Insertar en batches de 100-500 cartas
 *    - Mostrar progreso cada X cartas
 * 
 * 4. importSet(string $setCode): void
 *    - Obtener cartas del set via API
 *    - Mapear con ScryfallCardMapper
 *    - Upsert a la DB
 * 
 * 5. syncSets(): void
 *    - Sincronizar tabla card_sets antes de importar cartas
 *    - Obtener sets de API y hacer upsert
 * 
 * NOTAS:
 * - Para import inicial, SIEMPRE usar --bulk (más rápido y eficiente)
 * - El bulk data tiene ~90k cartas, tarda varios minutos
 * - Considerar ejecutar como Job en background para producción
 * - Usar DB::transaction() para imports grandes
 */
class ScryfallImportCommand extends Command
{
    protected $signature = 'scryfall:import';
    protected $description = 'Importa cartas desde Scryfall';

    public function handle(): int
    {
        $this->info('TODO: Implementar importación de Scryfall');

        return Command::SUCCESS;
    }
}
