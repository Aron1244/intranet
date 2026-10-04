<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'department_id', 'es_lider', 'onboarding_pendiente'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $attributes = [
        'es_lider' => false,
        'onboarding_pendiente' => true,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'es_lider' => 'boolean',
            'onboarding_pendiente' => 'boolean',
        ];
    }

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(
            Conversation::class
        )->withTimestamps();
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function canPostAnnouncements(): bool
    {
        return $this->canManageAnnouncements();
    }

    public function canManageAnnouncements(): bool
    {
        return $this->roles()
            ->whereIn('name', Role::ROLES_QUE_PUEDEN_PUBLICAR)
            ->exists();
    }
}
