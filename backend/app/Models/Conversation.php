<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'department_id',
    ];

    /**
     * Users in conversation
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class
        )->withTimestamps();
    }

    /**
     * Messages
     */
    public function messages(): HasMany
    {
        return $this->hasMany(
            Message::class
        );
    }

    /**
     * Department that owns this conversation (null for ad-hoc chats).
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
