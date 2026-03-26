<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(ChatMessage $message)
    {
        $this->message = $message;
    }

    // 1. El canal en Reverb. Debe coincidir con echo.private(`trade.${sessionId}`)
    public function broadcastOn()
    {
        return new PrivateChannel('trade.' . $this->message->trade_session_id);
    }

    // 2. El nombre del evento. Debe coincidir con .listen('.message.sent')
    public function broadcastAs()
    {
        return 'message.sent';
    }

    // 3. Los datos que recibirá React en el evento (e)
    public function broadcastWith()
    {
        return [
            'id'               => $this->message->id,
            'trade_session_id' => $this->message->trade_session_id,
            'user_id'          => $this->message->user_id,
            'message'          => $this->message->message,
            'created_at'       => $this->message->created_at,
            // Tu controlador ya hace $message->load('user:id,username'), así que esto existirá
            'user'             => $this->message->user,
        ];
    }
}
