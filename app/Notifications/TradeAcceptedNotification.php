<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\ExchangeRequest;

class TradeAcceptedNotification extends Notification implements ShouldQueue
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
        $posterName = $this->exchangeRequest->exchange->user->name;

        return (new MailMessage)
                    ->subject('¡Tu oferta de intercambio fue aceptada!')
                    ->greeting('¡Hola ' . $notifiable->name . '!')
                    ->line("El usuario {$posterName} ha aceptado tu propuesta de intercambio.")
                    ->action('Ir a la Sala de Intercambio', url('/trade/' . $this->exchangeRequest->id))
                    ->line('¡Entra en la sala y confirma el intercambio para completarlo!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'trade_accepted',
            'exchange_request_id' => $this->exchangeRequest->id,
            'poster_name' => $this->exchangeRequest->exchange->user->name,
            'message' => 'Tu solicitud de intercambio ha sido aceptada.'
        ];
    }
}
