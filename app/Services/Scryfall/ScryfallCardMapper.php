<?php

namespace App\Services\Scryfall;

/**
 * ScryfallCardMapper - Transforma datos de Scryfall al modelo Card
 * 
 * Este mapper convierte el JSON de Scryfall al formato de nuestra DB.
 * Referencia de campos: https://scryfall.com/docs/api/cards
 * 
 * TODO: Implementar los siguientes métodos:
 * 
 * 1. mapToCard(array $scryfallData): array
 *    - Convierte JSON de Scryfall → array para crear/actualizar Card
 *    - Mapeo de campos:
 *      * scryfall_id  ← $data['id']
 *      * name         ← $data['name']
 *      * set_code     ← $data['set']
 *      * rarity       ← $data['rarity'] (common, uncommon, rare, mythic)
 *      * image_url    ← $data['image_uris']['normal'] ?? $data['card_faces'][0]['image_uris']['normal']
 *      * market_avg_price ← $data['prices']['eur'] ?? $data['prices']['usd'] ?? 0
 *      * data         ← $data (JSON completo para referencia)
 * 
 * 2. mapToCardSet(array $scryfallSetData): array
 *    - Convierte JSON de Set de Scryfall → array para CardSet
 *    - Mapeo:
 *      * code         ← $data['code']
 *      * name         ← $data['name']
 *      * released_at  ← $data['released_at']
 *      * card_count   ← $data['card_count']
 *      * icon_svg_uri ← $data['icon_svg_uri']
 * 
 * 3. extractHotFields(array $scryfallData): array
 *    - Extrae solo los campos "calientes" para búsquedas SQL rápidas
 *    - Campos: name, mana_cost, type_line, oracle_text, power, toughness
 * 
 * 4. handleDoubleFacedCard(array $scryfallData): array
 *    - Manejo especial para cartas de doble cara (DFC)
 *    - Estas tienen 'card_faces' en lugar de campos directos
 * 
 * NOTAS:
 * - Algunas cartas no tienen precios (tokens, promos especiales)
 * - Las cartas DFC tienen imágenes en card_faces[0] y card_faces[1]
 * - El campo 'data' guarda el JSON completo para acceso flexible
 */
class ScryfallCardMapper
{
    // TODO: Implementar
}
