<?php

namespace App\Observers;

use App\Models\Message;
use App\Services\ContentFilterService;

class MessageObserver
{
    public function __construct(
        private ContentFilterService $contentFilter
    ) {}

    public function creating(Message $message): void
    {
        if (!$message->is_system_message && $message->content) {
            $message->content = $this->contentFilter->filter($message->content);
        }
    }

    public function updating(Message $message): void
    {
        if (!$message->is_system_message && $message->isDirty('content')) {
            $message->content = $this->contentFilter->filter($message->content);
        }
    }

    public function created(Message $message): void
    {
        $message->conversation->updateLastMessageAt();
    }
}
