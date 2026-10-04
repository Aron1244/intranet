<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * The four canonical roles of Coherev, mapped to the
     * can_post_announcements flag (used by User::canManageAnnouncements()).
     */
    private function roles(): array
    {
        return [
            ['name' => 'Administrador', 'can_post_announcements' => true],
            ['name' => 'Líder', 'can_post_announcements' => true],
            ['name' => 'Colaborador', 'can_post_announcements' => false],
            ['name' => 'Nuevo Ingreso', 'can_post_announcements' => false],
        ];
    }

    public function run(): void
    {
        foreach ($this->roles() as $role) {
            Role::query()->firstOrCreate(
                ['name' => $role['name']],
                ['can_post_announcements' => $role['can_post_announcements']],
            );
        }
    }
}
