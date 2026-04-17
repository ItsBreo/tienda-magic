<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Registro diario de precios del mercado
Schedule::command('market:track-prices')->dailyAt('04:00');

// Sincronización maestra con Scryfall (semanal para actualizar precios base)
Schedule::command('scryfall:sync-master')->weeklyOn(0, '02:00');
