<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CanManageAnnouncementsCentralizedTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRoleName(string $roleName): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user = User::query()->create([
            'name' => $roleName.' User',
            'email' => strtolower(str_replace(' ', '.', $roleName)).uniqid().'@example.com',
            'password' => 'password',
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_administrador_can_post(): void
    {
        $this->assertTrue($this->userWithRoleName(Role::ROLE_ADMINISTRADOR)->canManageAnnouncements());
    }

    public function test_lider_can_post(): void
    {
        $this->assertTrue($this->userWithRoleName(Role::ROLE_LIDER)->canManageAnnouncements());
    }

    public function test_colaborador_cannot_post(): void
    {
        $this->assertFalse($this->userWithRoleName(Role::ROLE_COLABORADOR)->canManageAnnouncements());
    }

    public function test_nuevo_ingreso_cannot_post(): void
    {
        $this->assertFalse($this->userWithRoleName(Role::ROLE_NUEVO_INGRESO)->canManageAnnouncements());
    }

    public function test_user_without_roles_cannot_post(): void
    {
        $user = User::query()->create([
            'name' => 'Role-less',
            'email' => 'roleless.'.uniqid().'@example.com',
            'password' => 'password',
        ]);
        $this->assertFalse($user->canManageAnnouncements());
    }

    public function test_user_with_multiple_roles_inherits_highest_permission(): void
    {
        $colab = Role::query()->firstOrCreate(['name' => Role::ROLE_COLABORADOR]);
        $lider = Role::query()->firstOrCreate(['name' => Role::ROLE_LIDER]);

        $user = User::query()->create([
            'name' => 'Multi Role',
            'email' => 'multi.'.uniqid().'@example.com',
            'password' => 'password',
        ]);
        $user->roles()->attach([$colab->id, $lider->id]);

        $this->assertTrue($user->fresh()->canManageAnnouncements());
    }

    public function test_legacy_admin_role_still_works_as_synonym(): void
    {
        $this->assertTrue($this->userWithRoleName('admin')->canManageAnnouncements());
    }

    public function test_centralezed_constant_lists_only_the_four_canonical_plus_admin(): void
    {
        $this->assertContains(Role::ROLE_ADMINISTRADOR, Role::ROLES_QUE_PUEDEN_PUBLICAR);
        $this->assertContains(Role::ROLE_LIDER, Role::ROLES_QUE_PUEDEN_PUBLICAR);
        $this->assertContains('admin', Role::ROLES_QUE_PUEDEN_PUBLICAR);
        $this->assertNotContains(Role::ROLE_COLABORADOR, Role::ROLES_QUE_PUEDEN_PUBLICAR);
        $this->assertNotContains(Role::ROLE_NUEVO_INGRESO, Role::ROLES_QUE_PUEDEN_PUBLICAR);
    }
}
