<?php

namespace App\Providers;

use App\Events\DeckCreated;
use App\Listeners\CheckFirstDeckAchievement;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Registrar los listeners de eventos
        \Illuminate\Support\Facades\Event::listen(
            DeckCreated::class,
            CheckFirstDeckAchievement::class
        );
    }
}
