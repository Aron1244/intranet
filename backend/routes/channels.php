<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel(
    'conversation.{conversationId}',
    function ($user, $conversationId) {

        return $user->isAdministrator()
            || $user
                ->conversations()
                ->where('conversation_id', $conversationId)
                ->exists();
    }
);
