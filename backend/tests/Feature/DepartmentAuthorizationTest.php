<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentAuthorizationTest extends TestCase
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

    public function test_admin_can_list_departments(): void
    {
        Department::query()->create(['name' => 'IT']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/departments')
            ->assertOk();
    }

    public function test_admin_can_view_department(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/departments/{$department->id}")
            ->assertOk();
    }

    public function test_admin_can_create_department(): void
    {
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/departments', ['name' => 'Sales'])
            ->assertCreated();
    }

    public function test_admin_can_update_department(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/departments/{$department->id}", ['name' => 'Engineering'])
            ->assertOk();
    }

    public function test_admin_can_delete_department(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/departments/{$department->id}")
            ->assertNoContent();
    }

    public function test_leader_can_list_departments(): void
    {
        Department::query()->create(['name' => 'IT']);
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->getJson('/api/departments')
            ->assertOk();
    }

    public function test_leader_can_view_department(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->getJson("/api/departments/{$department->id}")
            ->assertOk();
    }

    public function test_leader_cannot_create_department(): void
    {
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->postJson('/api/departments', ['name' => 'Sales'])
            ->assertForbidden();
    }

    public function test_leader_cannot_update_department(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->patchJson("/api/departments/{$department->id}", ['name' => 'Engineering'])
            ->assertForbidden();
    }

    public function test_leader_cannot_delete_department(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $leader = $this->makeUserWithRole('Líder');

        $this->actingAs($leader, 'sanctum')
            ->deleteJson("/api/departments/{$department->id}")
            ->assertForbidden();
    }

    public function test_collaborator_can_list_departments(): void
    {
        Department::query()->create(['name' => 'IT']);
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->getJson('/api/departments')
            ->assertOk();
    }

    public function test_collaborator_cannot_create_department(): void
    {
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->postJson('/api/departments', ['name' => 'Sales'])
            ->assertForbidden();
    }

    public function test_collaborator_cannot_delete_department(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $collab = $this->makeUserWithRole('Colaborador');

        $this->actingAs($collab, 'sanctum')
            ->deleteJson("/api/departments/{$department->id}")
            ->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_departments(): void
    {
        $this->getJson('/api/departments')->assertUnauthorized();
        $this->postJson('/api/departments', ['name' => 'X'])->assertUnauthorized();
    }
}
