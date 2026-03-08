<?php

namespace Database\Seeders;

use App\Models\BoosterPack;
use App\Models\CardSet;
use Illuminate\Database\Seeder;

class BoosterPackSeeder extends Seeder
{
    public function run(): void
    {
        // Obtener los sets más populares que ya importamos
        $popularSets = [
            'MOM' => 'March of the Machine',
            'BRO' => 'The Brothers\' War',
            'ONE' => 'The Lord of the Rings: Tales of Middle-earth',
            'DMU' => 'Dominaria United',
            'WAR' => 'War of the Spark',
            'MID' => 'Midnight Hunt',
            'VOW' => 'Innistrad: Midnight Hunt',
            'STX' => 'Strixhaven: School of Mages',
            'KHM' => 'Kaldheim',
            'IKO' => 'Ikoria: Lair of Behemoths',
        ];

        foreach ($popularSets as $code => $name) {
            // Verificar que el set existe en la base de datos
            $cardSet = CardSet::where('code', $code)->first();
            
            if (!$cardSet) {
                $this->command->warn("Set {$code} no encontrado, saltando...");
                continue;
            }

            // Crear diferentes tipos de packs para cada set
            $packs = [
                [
                    'name' => "{$name} Draft Pack",
                    'price' => 4.99,
                    'card_set_id' => $code,
                    'type' => 'DRAFT',
                    'config' => [
                        'rares' => 1,
                        'foil' => true,
                    ],
                    'image_uri' => $this->getSetImage($code, 'draft'),
                ],
                [
                    'name' => "{$name} Set Pack",
                    'price' => 3.99,
                    'card_set_id' => $code,
                    'type' => 'SET',
                    'config' => [
                        'rares' => 1,
                        'foil' => false,
                    ],
                    'image_uri' => $this->getSetImage($code, 'set'),
                ],
                [
                    'name' => "{$name} Collector Pack",
                    'price' => 7.99,
                    'card_set_id' => $code,
                    'type' => 'COLLECTOR',
                    'config' => [
                        'rares' => 2,
                        'foil' => true,
                    ],
                    'image_uri' => $this->getSetImage($code, 'collector'),
                ],
            ];

            foreach ($packs as $pack) {
                BoosterPack::updateOrCreate(
                    [
                        'name' => $pack['name'],
                        'type' => $pack['type'],
                        'card_set_id' => $pack['card_set_id'],
                    ],
                    $pack
                );
            }

            $this->command->info("Packs creados para {$name} ({$code})");
        }
    }

    private function getSetImage(string $setCode, string $type): string
    {
        // URLs de ejemplo para packs (puedes reemplazar con imágenes reales)
        $images = [
            'MOM' => [
                'draft' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/9/8/987b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'set' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/1/2/123b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'collector' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/2/3/234b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
            ],
            'BRO' => [
                'draft' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/4/5/456b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'set' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/5/6/567b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'collector' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/6/7/678b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
            ],
            'ONE' => [
                'draft' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/7/8/789b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'set' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/8/9/890b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'collector' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/9/0/901b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
            ],
            'DMU' => [
                'draft' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/0/1/012b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'set' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/3/4/345b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
                'collector' => 'https://c1.scryfall.com/file/scryfall-cards/normal/front/4/5/456b4b9e-6c5f-4a7b-8b5c-9e3d4b5e6f7d.jpg',
            ],
        ];

        return $images[$setCode][$type] ?? "https://c1.scryfall.com/file/scryfall-cards/normal/front/default.jpg";
    }
}
