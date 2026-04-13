<?php

namespace App\Listeners;

use App\Services\AchievementService;

class AchievementListener
{
    public function __construct(protected AchievementService $service) {}

    public function handleUserRegistered($event): void
    {
        $this->service->unlock($event->user, 'first_register');
    }

    public function handleEmailVerified($event): void
    {
        $this->service->unlock($event->user, 'email_verified');
    }

    public function handlePackPurchased($event): void
    {
        $this->service->unlock($event->user, 'first_pack_purchase');
    }

    public function handleCardPurchased($event): void
    {
        $this->service->unlock($event->user, 'first_card_purchase');
        $this->service->checkTransactionMilestones($event->user);
    }

    public function handleCardListed($event): void
    {
        $this->service->unlock($event->user, 'first_card_listed');
    }

    public function handleTransactionCompleted($event): void
    {
        $this->service->checkTransactionMilestones($event->user);
    }
}
