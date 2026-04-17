<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Card;
use App\Models\BoosterPack;
use App\Models\CardPriceHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SeedMarketHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'market:seed-history {--days=30 : Number of days to seed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Genera datos aleatorios de historial de precios para pruebas visuales';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $this->info("🌱 Sembrando historial de precios para los últimos {$days} días (Modo Optimizado)...");

        $count = 0;

        // Sembrar para cartas
        Card::chunk(200, function ($cards) use ($days, &$count) {
            $dataToInsert = [];
            foreach ($cards as $card) {
                $basePrice = $card->market_avg_price > 0 ? $card->market_avg_price : rand(50, 500) / 100;
                $currentPrice = $basePrice;
                
                for ($i = $days; $i >= 0; $i--) {
                    $date = Carbon::now()->subDays($i);
                    $variation = 1 + (rand(-50, 50) / 1000);
                    $currentPrice = round($currentPrice * $variation, 2);

                    $dataToInsert[] = [
                        'priceable_id' => $card->id,
                        'priceable_type' => Card::class,
                        'price' => $currentPrice,
                        'recorded_at' => $date
                    ];
                }
            }
            
            if (!empty($dataToInsert)) {
                \DB::table('card_price_history')->insert($dataToInsert);
                $count += count($dataToInsert);
                $this->line("   - Procesadas " . count($cards) . " cartas. Total puntos: {$count}");
            }
        });

        // Sembrar para sobres
        BoosterPack::chunk(100, function ($packs) use ($days, &$count) {
            $dataToInsert = [];
            foreach ($packs as $pack) {
                $basePrice = $pack->price > 0 ? $pack->price : rand(300, 1000) / 100;
                $currentPrice = $basePrice;

                for ($i = $days; $i >= 0; $i--) {
                    $date = Carbon::now()->subDays($i);
                    $variation = 1 + (rand(-50, 50) / 1000);
                    $currentPrice = round($currentPrice * $variation, 2);

                    $dataToInsert[] = [
                        'priceable_id' => $pack->id,
                        'priceable_type' => BoosterPack::class,
                        'price' => $currentPrice,
                        'recorded_at' => $date
                    ];
                }
            }

            if (!empty($dataToInsert)) {
                \DB::table('card_price_history')->insert($dataToInsert);
                $count += count($dataToInsert);
                $this->line("   - Procesados " . count($packs) . " sobres. Total puntos: {$count}");
            }
        });

        $this->info("✅ Se han generado {$count} puntos de datos históricos exitosamente.");
    }
}
