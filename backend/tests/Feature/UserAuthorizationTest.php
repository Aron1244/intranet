<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAuthorizationTest extends TestCase
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

    public function test_non_admin_user_cannot_list_users(): void
    {
        $user = $this->makeUserWithRole('Editor');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/users')
            ->assertForbidden();
    }

    public function test_non_admin_user_cannot_create_user(): void
    {
        $user = $this->makeUserWithRole('Editor');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'New User',
                'email' => 'new.user@example.com',
                'password' => 'password123',
            ])
            ->assertForbidden();
    }

    public function test_non_admin_user_cannot_view_user(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $other = $this->makeUserWithRole('Editor');

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/users/{$admin->id}")
            ->assertForbidden();
    }

    public function test_non_admin_user_cannot_update_user(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $editor = $this->makeUserWithRole('Editor');

        $this->actingAs($editor, 'sanctum')
            ->patchJson("/api/users/{$admin->id}", [
                'name' => 'Hacked',
            ])
            ->assertForbidden();
    }

    public function test_non_admin_user_cannot_delete_user(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $editor = $this->makeUserWithRole('Editor');

        $this->actingAs($editor, 'sanctum')
            ->deleteJson("/api/users/{$admin->id}")
            ->assertForbidden();
    }

    public function test_non_admin_user_cannot_view_user_roles(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $editor = $this->makeUserWithRole('Editor');

        $this->actingAs($editor, 'sanctum')
            ->getJson("/api/users/{$admin->id}/roles")
            ->assertForbidden();
    }

    public function test_non_admin_user_cannot_update_user_roles(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $editor = $this->makeUserWithRole('Editor');
        $newRole = Role::query()->firstOrCreate(['name' => 'Viewer']);

        $this->actingAs($editor, 'sanctum')
            ->putJson("/api/users/{$admin->id}/roles", [
                'role_ids' => [$newRole->id],
            ])
            ->assertForbidden();
    }

    public function test_admin_user_can_list_users(): void
    {
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/users')
            ->assertOk();
    }

    public function test_admin_user_can_create_user(): void
    {
        $admin = $this->makeUserWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Created By Admin',
                'email' => 'created@example.com',
                'password' => 'password123',
            ])
            ->assertCreated();
    }

    public function test_admin_user_can_update_user(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $target = $this->makeUserWithRole('Editor');

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/users/{$target->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_admin_user_can_delete_user(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $target = $this->makeUserWithRole('Editor');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/users/{$target->id}")
            ->assertNoContent();
    }

    public function test_admin_chat_partners_returns_all_other_users(): void
    {
        $it = Department::query()->firstOrCreate(['name' => 'IT']);
        $sales = Department::query()->firstOrCreate(['name' => 'Sales']);

        $admin = User::query()->create([
            'name' => 'Admin User',
            'email' => 'admin.chat@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $admin->roles()->attach(Role::query()->firstOrCreate(['name' => 'admin'])->id);

        $colleagueInIt = User::query()->create([
            'name' => 'IT Colleague',
            'email' => 'it.colleague@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $colleagueInSales = User::query()->create([
            'name' => 'Sales Colleague',
            'email' => 'sales.colleague@example.com',
            'password' => 'password',
            'department_id' => $sales->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/chat-partners')
            ->assertOk();

        $emails = collect($response->json('data'))->pluck('email')->all();

        $this->assertContains('it.colleague@example.com', $emails);
        $this->assertContains('sales.colleague@example.com', $emails);
        $this->assertNotContains('admin.chat@example.com', $emails);
    }

    public function test_non_admin_chat_partners_returns_only_same_department_users(): void
    {
        $it = Department::query()->firstOrCreate(['name' => 'IT']);
        $sales = Department::query()->firstOrCreate(['name' => 'Sales']);

        $editor = User::query()->create([
            'name' => 'Editor User',
            'email' => 'editor.chat@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $editor->roles()->attach(Role::query()->firstOrCreate(['name' => 'Editor'])->id);

        $itColleague = User::query()->create([
            'name' => 'IT Peer',
            'email' => 'it.peer@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $salesColleague = User::query()->create([
            'name' => 'Sales Peer',
            'email' => 'sales.peer@example.com',
            'password' => 'password',
            'department_id' => $sales->id,
        ]);

        $response = $this->actingAs($editor, 'sanctum')
            ->getJson('/api/chat-partners')
            ->assertOk();

        $emails = collect($response->json('data'))->pluck('email')->all();

        $this->assertContains('it.peer@example.com', $emails);
        $this->assertNotContains('sales.peer@example.com', $emails);
        $this->assertNotContains('editor.chat@example.com', $emails);
    }

    public function test_unauthenticated_user_cannot_access_chat_partners(): void
    {
        $this->getJson('/api/chat-partners')->assertUnauthorized();
    }
}
