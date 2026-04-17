<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MarketTransaction;
use App\Models\Card;
use App\Models\BoosterPack;
use App\Models\User;
use Carbon\Carbon;

class SalesHistorySeeder extends Seeder
{
    public function run()
    {
        $seller = User::first() ?: User::factory()->create();
        $buyer = User::factory()->create();

        // 1. Generar ventas para el primer sobre
        $pack = BoosterPack::first();
        if ($pack) {
            $basePrice = $pack->price;
            for ($i = 0; $i < 10; $i++) {
                $date = Carbon::now()->subDays(10 - $i);
                $price = $basePrice * (1 + (rand(-10, 15) / 100)); // Variación de precio

                MarketTransaction::create([
                    'seller_id' => $seller->id,
                    'buyer_id' => $buyer->id,
                    'sellable_id' => $pack->id,
                    'sellable_type' => BoosterPack::class,
                    'price_total' => $price,
                    'fee_platform' => $price * 0.1,
                    'amount_to_seller' => $price * 0.9,
                    'item_details' => ['name' => $pack->name],
                    'created_at' => $date,
                    'updated_at' => $date
                ]);
            }
        }

        // 2. Generar ventas para la primera carta
        $card = Card::first();
        if ($card) {
            $basePrice = $card->market_avg_price ?: 5.0;
            for ($i = 0; $i < 10; $i++) {
                $date = Carbon::now()->subDays(10 - $i);
                $price = $basePrice * (1 + (rand(-5, 20) / 100));

                MarketTransaction::create([
                    'seller_id' => $seller->id,
                    'buyer_id' => $buyer->id,
                    'sellable_id' => $card->id,
                    'sellable_type' => Card::class,
                    'price_total' => $price,
                    'fee_platform' => $price * 0.1,
                    'amount_to_seller' => $price * 0.9,
                    'item_details' => ['name' => $card->name],
                    'created_at' => $date,
                    'updated_at' => $date
                ]);
            }
        }
    }
}
