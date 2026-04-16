<?php

namespace App\Listeners;

use App\Services\AchievementService;
use Illuminate\Support\Facades\Log;

class AchievementListener
{
    public function __construct(protected AchievementService $service) {}

    public function handleUserRegistered($event): void
    {
        Log::debug("AchievementListener: Procesando Registro para el usuario {$event->user->id}");
        $this->service->unlock($event->user, 'first_register');
    }

    public function handlePackPurchased($event): void
    {
        Log::debug("AchievementListener: Procesando Pack Comprado/Abierto para el usuario {$event->user->id}");
        $this->service->unlock($event->user, 'first_pack_purchase');
    }

    public function handleCardPurchased($event): void
    {
        Log::debug("AchievementListener: Procesando Carta Comprada para el usuario {$event->user->id}");
        $this->service->unlock($event->user, 'first_card_purchase');
        $this->service->checkTransactionMilestones($event->user);
    }

    public function handleCardListed($event): void
    {
        Log::debug("AchievementListener: Procesando Carta Listada para el usuario {$event->user->id}");
        $this->service->unlock($event->user, 'first_card_listed');
    }

    public function handleTransactionCompleted($event): void
    {
        Log::debug("AchievementListener: Procesando Transacción Completada para el usuario {$event->user->id}");
        $this->service->checkTransactionMilestones($event->user);
    }
}
