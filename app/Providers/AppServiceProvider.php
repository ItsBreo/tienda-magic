<?php

namespace App\Providers;

use App\Events\DeckCreated;
use App\Events\UserRegistered;
use App\Events\EmailVerified;
use App\Events\PackPurchased;
use App\Events\CardPurchased;
use App\Events\CardListed;
use App\Events\TransactionCompleted;
use App\Listeners\AchievementListener;
use App\Models\Message;
use App\Observers\MessageObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Event::listen(DeckCreated::class,         [AchievementListener::class, 'handleDeckCreated']);
        Event::listen(UserRegistered::class,      [AchievementListener::class, 'handleUserRegistered']);
        Event::listen(EmailVerified::class,       [AchievementListener::class, 'handleEmailVerified']);
        Event::listen(PackPurchased::class,       [AchievementListener::class, 'handlePackPurchased']);
        Event::listen(CardPurchased::class,       [AchievementListener::class, 'handleCardPurchased']);
        Event::listen(CardListed::class,          [AchievementListener::class, 'handleCardListed']);
        Event::listen(TransactionCompleted::class,[AchievementListener::class, 'handleTransactionCompleted']);

        Message::observe(MessageObserver::class);
    }
}
