<?php

namespace App\Providers;

use App\Events\DeckCreated;
use App\Listeners\CheckFirstDeckAchievement;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Tournament;
use App\Policies\TournamentPolicy;

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

        Gate::policy(Tournament::class, TournamentPolicy::class);
    }
}
