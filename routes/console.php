<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\ShopGeneratePacks;
use App\Console\Commands\ShopSetupDemo;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Register custom commands
Artisan::command('shop:generate-packs', function () {
    $this->call(ShopGeneratePacks::class);
})->purpose('Generate booster packs from imported sets');

Artisan::command('shop:setup-demo', function () {
    $this->call(ShopSetupDemo::class);
})->purpose('Automatizar la inicialización completa del catálogo para demo');
