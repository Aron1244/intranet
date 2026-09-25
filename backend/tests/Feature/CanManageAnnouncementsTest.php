<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CanManageAnnouncementsTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $roleName): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user = User::query()->create([
            'name' => "{$roleName} User",
            'email' => strtolower(str_replace(' ', '.', $roleName)).'@example.com',
            'password' => 'password',
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_administrador_can_manage_announcements(): void
    {
        $this->assertTrue($this->makeUser('Administrador')->canManageAnnouncements());
    }

    public function test_lider_can_manage_announcements(): void
    {
        $this->assertTrue($this->makeUser('Líder')->canManageAnnouncements());
    }

    public function test_colaborador_cannot_manage_announcements(): void
    {
        $this->assertFalse($this->makeUser('Colaborador')->canManageAnnouncements());
    }

    public function test_nuevo_ingreso_cannot_manage_announcements(): void
    {
        $this->assertFalse($this->makeUser('Nuevo Ingreso')->canManageAnnouncements());
    }
}
