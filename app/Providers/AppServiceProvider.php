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
use App\Models\Thread;
use App\Models\Comment;
use App\Models\Vote;
use App\Observers\MessageObserver;
use App\Observers\ThreadObserver;
use App\Observers\CommentObserver;
use App\Observers\VoteObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use App\Models\Tournament;
use App\Policies\TournamentPolicy;
use App\Policies\ThreadPolicy;
use App\Policies\CommentPolicy;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        \Illuminate\Support\Facades\Log::info('AppServiceProvider booting: Registrando listeners de logros...');
        Event::listen(UserRegistered::class,       [AchievementListener::class, 'handleUserRegistered']);
        Event::listen(PackPurchased::class,        [AchievementListener::class, 'handlePackPurchased']);
        Event::listen(CardPurchased::class,        [AchievementListener::class, 'handleCardPurchased']);
        Event::listen(CardListed::class,           [AchievementListener::class, 'handleCardListed']);
        Event::listen(TransactionCompleted::class, [AchievementListener::class, 'handleTransactionCompleted']);

        Message::observe(MessageObserver::class);
        Thread::observe(ThreadObserver::class);
        Comment::observe(CommentObserver::class);
        Vote::observe(VoteObserver::class);

        // Policies del foro
        Gate::policy(Tournament::class, TournamentPolicy::class);
        Gate::policy(Thread::class,     ThreadPolicy::class);
        Gate::policy(Comment::class,    CommentPolicy::class);
    }
}
