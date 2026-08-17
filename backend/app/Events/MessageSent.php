<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable,
        InteractsWithSockets,
        SerializesModels;

    public Message $message;

    /**
     * Create event
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    /**
     * Channel to broadcast
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(
                'conversation.' .
                $this->message->conversation_id
            ),
        ];
    }

    /**
     * Event name (optional but good)
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Broadcast payload consumed by frontend clients.
     */
    public function broadcastWith(): array
    {
        $message = $this->message->loadMissing([
            'sender:id,name',
            'document:id,title,file_path,original_name,mime_type,size_bytes,visibility,department_folder_id,user_id',
        ]);

        return [
            'message' => $message,
        ];
    }
}