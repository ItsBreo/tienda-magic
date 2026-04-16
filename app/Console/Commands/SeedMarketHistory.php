<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Card;
use App\Models\BoosterPack;
use App\Models\CardPriceHistory;
use Carbon\Carbon;

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
        $days = $this->option('days');
        $this->info("🌱 Sembrando historial de precios para los últimos {$days} días...");

        $count = 0;

        // Limpiar historial previo si se desea (opcional, para pruebas limpias)
        if ($this->confirm('¿Quieres borrar el historial de precios existente antes de sembrar?')) {
            CardPriceHistory::truncate();
            $this->warn('Historial borrado.');
        }

        // Sembrar para cartas
        Card::chunk(100, function ($cards) use ($days, &$count) {
            foreach ($cards as $card) {
                $basePrice = $card->market_avg_price > 0 ? $card->market_avg_price : rand(50, 500) / 100;
                $this->seedForItem($card->id, Card::class, $basePrice, $days, $count);
            }
        });

        // Sembrar para sobres
        BoosterPack::chunk(50, function ($packs) use ($days, &$count) {
            foreach ($packs as $pack) {
                $basePrice = $pack->price > 0 ? $pack->price : rand(300, 1000) / 100;
                $this->seedForItem($pack->id, BoosterPack::class, $basePrice, $days, $count);
            }
        });

        $this->info("✅ Se han generado {$count} puntos de datos históricos.");
    }

    private function seedForItem($id, $type, $basePrice, $days, &$count)
    {
        $currentPrice = $basePrice;
        
        for ($i = $days; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            // Variación aleatoria entre -5% y +5%
            $variation = 1 + (rand(-50, 50) / 1000);
            $currentPrice = round($currentPrice * $variation, 2);

            CardPriceHistory::create([
                'priceable_id' => $id,
                'priceable_type' => $type,
                'price' => $currentPrice,
                'recorded_at' => $date
            ]);
            
            $count++;
        }
    }
}
