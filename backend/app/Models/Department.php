<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['name', 'description'])]
class Department extends Model
{
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
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
