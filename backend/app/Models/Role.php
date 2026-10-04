<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'can_post_announcements', 'department_id'])]
class Role extends Model
{
    /**
     * Canonical role names for Coherev.
     * Centralized here so all permission/UI code uses the same source of truth.
     */
    public const ROLE_ADMINISTRADOR = 'Administrador';

    public const ROLE_LIDER = 'Líder';

    public const ROLE_COLABORADOR = 'Colaborador';

    public const ROLE_NUEVO_INGRESO = 'Nuevo Ingreso';

    /**
     * Roles authorized to publish announcements (centros administrativos).
     * `admin` is kept as a legacy synonym of Administrador for backward
     * compatibility with seeds and tests that pre-date the canonical naming.
     */
    public const ROLES_QUE_PUEDEN_PUBLICAR = [
        self::ROLE_ADMINISTRADOR,
        self::ROLE_LIDER,
        'admin', // legacy alias
    ];

    protected function casts(): array
    {
        return [
            'can_post_announcements' => 'boolean',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles');
    }
}
