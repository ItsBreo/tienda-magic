<?php

namespace App\Events;

use App\Models\TradeSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TradeSessionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $session;

    /**
     * Create a new event instance.
     */
    public function __construct(TradeSession $session)
    {
        $this->session = $session;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('trade.' . $this->session->id),
        ];
    }

    /**
     * El nombre del evento tal como se recibirá en el frontend.
     */
    public function broadcastAs(): string
    {
        return 'trade.updated';
    }
}
