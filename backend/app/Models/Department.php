<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['name', 'description', 'color'])]
class Department extends Model
{
    /**
     * Usuarios que pertenecen al departamento.
     *
     * La relacion es N:M: un usuario puede estar en varios departamentos.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'department_user');
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function folders(): HasMany
    {
        return $this->hasMany(DepartmentFolder::class);
    }

    /**
     * Group conversation shared by every member of the department.
     * Created automatically when the department is created.
     */
    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }
}
