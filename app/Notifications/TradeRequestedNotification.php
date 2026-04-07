<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\ExchangeRequest;

class TradeRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $exchangeRequest;

    public function __construct(ExchangeRequest $exchangeRequest)
    {
        $this->exchangeRequest = $exchangeRequest;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $requesterName = $this->exchangeRequest->user->name;
        $offeredCard = $this->exchangeRequest->offeredCard->card->name ?? 'una carta';

        return (new MailMessage)
                    ->subject('Nueva solicitud de intercambio en Tienda Magic')
                    ->greeting('¡Hola ' . $notifiable->name . '!')
                    ->line("El usuario {$requesterName} te ha ofrecido {$offeredCard} para un intercambio.")
                    ->action('Ver peticiones de intercambio', url('/exchanges/manage'))
                    ->line('¡Gracias por usar Tienda Magic!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'trade_requested',
            'exchange_request_id' => $this->exchangeRequest->id,
            'requester_name' => $this->exchangeRequest->user->name,
            'message' => 'Tienes una nueva solicitud de intercambio.'
        ];
    }
}
