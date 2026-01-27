<?php

namespace App\Services\Scryfall;

/**
 * ScryfallBulkDownloader - Descarga masiva de datos de Scryfall
 * 
 * Scryfall ofrece archivos JSON con TODAS las cartas (~250MB).
 * Esta es la forma RECOMENDADA para importaciones iniciales.
 * Documentación: https://scryfall.com/docs/api/bulk-data
 * 
 * Tipos de Bulk Data disponibles:
 * - oracle_cards: Una entrada por carta (sin duplicados por set)
 * - all_cards: Todas las impresiones de cada carta (~90k+ cartas)
 * - default_cards: Similar a all_cards pero sin variantes raras
 * - rulings: Reglas oficiales de cada carta
 * 
 * TODO: Implementar los siguientes métodos:
 * 
 * 1. __construct(ScryfallService $service)
 *    - Inyectar ScryfallService para obtener URLs de bulk data
 *    - Configurar directorio temporal para descargas
 * 
 * 2. getBulkDataUrl(string $type = 'default_cards'): string
 *    - Obtener URL de descarga del tipo especificado
 *    - La URL cambia cada día, siempre consultar primero
 * 
 * 3. download(string $type = 'default_cards'): string
 *    - Descargar archivo JSON a storage/app/scryfall/
 *    - Retornar path del archivo descargado
 *    - Mostrar progreso si es posible (para CLI)
 * 
 * 4. streamCards(string $filePath): \Generator
 *    - Usar streaming para procesar sin cargar todo en memoria
 *    - Usar librería como cerbero/json-parser (ya instalada)
 *    - yield cada carta individualmente
 * 
 * 5. getLastDownloadDate(): ?Carbon
 *    - Verificar cuándo fue la última descarga
 *    - Útil para evitar descargas innecesarias
 * 
 * 6. cleanup(): void
 *    - Eliminar archivos temporales antiguos
 * 
 * NOTAS IMPORTANTES:
 * - Los archivos se actualizan diariamente a las ~9:00 UTC
 * - El archivo 'all_cards' puede ser muy grande (~300MB+)
 * - Usar streaming JSON para no quedarse sin memoria
 * - Considerar descargar en un Job en background
 */
class ScryfallBulkDownloader
{
    // TODO: Implementar
}
