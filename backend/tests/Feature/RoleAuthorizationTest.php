<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function makeUserWithRole(string $roleName): User
    {
        $department = Department::query()->firstOrCreate(['name' => 'IT']);
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user = User::query()->create([
            'name' => "{$roleName} User",
            'email' => strtolower(str_replace(' ', '.', $roleName)).'@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_admin_can_list_roles(): void
    {
        Role::query()->create(['name' => 'Editor']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/roles')
            ->assertOk();
    }

    public function test_admin_can_view_role(): void
    {
        $role = Role::query()->create(['name' => 'Editor']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/roles/{$role->id}")
            ->assertOk();
    }

    public function test_admin_can_create_role(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'department_id' => $department->id,
            ])
            ->assertCreated();
    }

    public function test_admin_can_update_role(): void
    {
        $role = Role::query()->create(['name' => 'Editor']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/roles/{$role->id}", ['name' => 'EditorRenamed'])
            ->assertOk();
    }

    public function test_admin_can_delete_role(): void
    {
        $role = Role::query()->create(['name' => 'Editor']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/roles/{$role->id}")
            ->assertNoContent();
    }

    public function test_non_admin_can_list_roles(): void
    {
        Role::query()->create(['name' => 'Editor']);
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->getJson('/api/roles')
            ->assertOk();
    }

    public function test_non_admin_can_view_role(): void
    {
        $role = Role::query()->create(['name' => 'Editor']);
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->getJson("/api/roles/{$role->id}")
            ->assertOk();
    }

    public function test_non_admin_can_view_department_roles(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        Role::query()->create(['name' => 'Editor', 'department_id' => $department->id]);
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->getJson("/api/departments/{$department->id}/roles")
            ->assertOk();
    }

    public function test_leader_cannot_create_role(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'department_id' => $department->id,
            ])
            ->assertForbidden();
    }

    public function test_leader_cannot_update_role(): void
    {
        $role = Role::query()->create(['name' => 'Editor']);
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->patchJson("/api/roles/{$role->id}", ['name' => 'Renamed'])
            ->assertForbidden();
    }

    public function test_leader_cannot_delete_role(): void
    {
        $role = Role::query()->create(['name' => 'Editor']);
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->deleteJson("/api/roles/{$role->id}")
            ->assertForbidden();
    }

    public function test_collaborator_cannot_create_role(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'department_id' => $department->id,
            ])
            ->assertForbidden();
    }

    public function test_collaborator_cannot_delete_role(): void
    {
        $role = Role::query()->create(['name' => 'Editor']);
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->deleteJson("/api/roles/{$role->id}")
            ->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_roles(): void
    {
        $this->getJson('/api/roles')->assertUnauthorized();
        $this->postJson('/api/roles', ['name' => 'X'])->assertUnauthorized();
    }
}
