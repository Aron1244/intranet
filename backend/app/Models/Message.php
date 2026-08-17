<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
        'document_id',
        'type',
    ];

    /**
     * Message belongs to conversation
     */
    public function conversation()
    {
        return $this->belongsTo(
            Conversation::class
        );
    }

    /**
     * Message belongs to sender (user)
     */
    public function sender()
    {
        return $this->belongsTo(
            User::class,
            'sender_id'
        );
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}