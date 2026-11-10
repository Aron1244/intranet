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
use Illuminate\Support\Facades\Schema;
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

    /**
     * Departamento principal del usuario.
     *
     * Es el primero de la lista de pertenencias y se mantiene en
     * users.department_id por compatibilidad con los listados y las vistas que
     * muestran un unico departamento. Para saber a todos los departamentos a
     * los que pertenece hay que usar departments() o departmentIds().
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Todos los departamentos a los que pertenece el usuario.
     */
    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_user');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Ids de todos los departamentos a los que pertenece el usuario.
     *
     * El departamento principal va primero para que department_ids[0] sea
     * siempre el mismo que department_id.
     *
     * @return list<int>
     */
    public function departmentIds(): array
    {
        $ids = $this->relationLoaded('departments')
            ? $this->departments->pluck('id')->all()
            : $this->departments()->pluck('departments.id')->all();

        $ids = array_values(array_map('intval', $ids));

        if ($this->department_id === null) {
            return $ids;
        }

        $primary = (int) $this->department_id;

        return array_values(array_unique(array_merge([$primary], $ids)));
    }

    /**
     * True si el usuario pertenece al departamento dado.
     */
    public function belongsToDepartment(?int $departmentId): bool
    {
        if ($departmentId === null) {
            return false;
        }

        return in_array((int) $departmentId, $this->departmentIds(), true);
    }

    /**
     * Reemplaza la lista de departamentos del usuario.
     *
     * El primero queda como departamento principal (users.department_id).
     *
     * @param  list<int>  $departmentIds
     */
    public function syncDepartments(array $departmentIds): void
    {
        $ids = array_values(array_unique(array_map('intval', $departmentIds)));

        $this->department_id = $ids[0] ?? null;
        $this->save();

        $this->departments()->sync($ids);
        $this->unsetRelation('departments');
    }

    /**
     * Mantiene el pivote en linea con el departamento principal.
     *
     * Cualquier escritura directa sobre users.department_id (seeders, factories,
     * asignaciones puntuales) debe seguir contando como pertenencia al
     * departamento, asi que se refleja en el pivote al guardar.
     */
    protected static function booted(): void
    {
        static::created(function (self $user): void {
            self::mirrorPrimaryDepartment($user);
        });

        static::updated(function (self $user): void {
            if ($user->wasChanged('department_id')) {
                self::mirrorPrimaryDepartment($user);
            }
        });
    }

    /**
     * Refleja el departamento principal en el pivote de pertenencias.
     *
     * Se comprueba la existencia de la tabla porque hay migraciones que crean
     * usuarios antes de que el pivote exista; a esos usuarios los cubre el
     * backfill de la migracion que crea la tabla.
     */
    private static function mirrorPrimaryDepartment(self $user): void
    {
        if ($user->department_id === null || ! Schema::hasTable('department_user')) {
            return;
        }

        $user->departments()->syncWithoutDetaching([$user->department_id]);
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

    public function isAdministrator(): bool
    {
        return $this->roles()
            ->whereIn('name', Role::ROLES_QUE_PUEDEN_ADMINISTRAR)
            ->exists();
    }

    /**
     * True if the user holds any role flagged with can_manage_department
     * (i.e. is a leader of some department).
     */
    public function isDepartmentLeader(): bool
    {
        return $this->roles()
            ->where('can_manage_department', true)
            ->exists();
    }

    /**
     * True if the user can moderate messages/documents of the given
     * department's group conversation. Admins and department leaders
     * (of any department) are allowed.
     */
    public function canModerateDepartment(?int $departmentId = null): bool
    {
        if ($this->isAdministrator()) {
            return true;
        }

        return $this->isDepartmentLeader();
    }
}
