<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TrackMarketPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'market:track-prices';
    protected $description = 'Registra el precio actual de todas las cartas y sobres para el historial de gráficas';

    public function handle()
    {
        $this->info('📊 Iniciando seguimiento de precios de mercado...');

        $now = now();
        $count = 0;

        // 1. Registrar precios de Cartas (usando el precio de mercado sincronizado de Scryfall)
        \App\Models\Card::chunk(200, function ($cards) use ($now, &$count) {
            foreach ($cards as $card) {
                if ($card->market_avg_price > 0) {
                    \App\Models\CardPriceHistory::create([
                        'priceable_id' => $card->id,
                        'priceable_type' => \App\Models\Card::class,
                        'price' => $card->market_avg_price,
                        'recorded_at' => $now
                    ]);
                    $count++;
                }
            }
        });

        // 2. Registrar precios de Sobres (usando el precio oficial de la tienda)
        \App\Models\BoosterPack::chunk(100, function ($packs) use ($now, &$count) {
            foreach ($packs as $pack) {
                if ($pack->price > 0) {
                    \App\Models\CardPriceHistory::create([
                        'priceable_id' => $pack->id,
                        'priceable_type' => \App\Models\BoosterPack::class,
                        'price' => $pack->price,
                        'recorded_at' => $now
                    ]);
                    $count++;
                }
            }
        });

        $this->info("✅ Registro completado. Se añadieron {$count} entradas de precio.");
    }
}
