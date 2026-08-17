<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type'
    ];

    /**
     * Users in conversation
     */
    public function users()
    {
        return $this->belongsToMany(
            User::class
        );
    }

    /**
     * Messages
     */
    public function messages()
    {
        return $this->hasMany(
            Message::class
        );
    }
}