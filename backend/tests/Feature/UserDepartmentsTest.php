<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Conversation;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDepartmentsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::query()->create([
            'name' => 'Admin User',
            'email' => 'admin.departments@example.com',
            'password' => 'password',
        ]);

        $admin->roles()->attach(Role::query()->firstOrCreate(['name' => 'admin'])->id);

        return $admin;
    }

    public function test_admin_can_create_user_in_several_departments(): void
    {
        $it = Department::query()->create(['name' => 'IT']);
        $sales = Department::query()->create(['name' => 'Sales']);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Multi Department User',
                'email' => 'multi.departments@example.com',
                'password' => 'password123',
                'department_ids' => [$it->id, $sales->id],
            ]);

        $response->assertCreated();

        $userId = $response->json('data.id');

        $this->assertDatabaseHas('department_user', [
            'user_id' => $userId,
            'department_id' => $it->id,
        ]);
        $this->assertDatabaseHas('department_user', [
            'user_id' => $userId,
            'department_id' => $sales->id,
        ]);

        $this->assertEqualsCanonicalizing(
            [$it->id, $sales->id],
            $response->json('data.department_ids')
        );

        // El primer departamento es el principal.
        $this->assertSame($it->id, $response->json('data.department_id'));
    }

    public function test_creating_a_user_with_an_unknown_department_is_rejected(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Invalid Departments',
                'email' => 'invalid.departments@example.com',
                'password' => 'password123',
                'department_ids' => [9999],
            ])
            ->assertJsonValidationErrors('department_ids.0');
    }

    public function test_updating_departments_replaces_the_previous_ones(): void
    {
        $it = Department::query()->create(['name' => 'IT']);
        $sales = Department::query()->create(['name' => 'Sales']);
        $rh = Department::query()->create(['name' => 'RH']);

        $user = User::query()->create([
            'name' => 'Movable User',
            'email' => 'movable.departments@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/users/{$user->id}", [
                'department_ids' => [$sales->id, $rh->id],
            ])
            ->assertOk();

        $this->assertDatabaseMissing('department_user', [
            'user_id' => $user->id,
            'department_id' => $it->id,
        ]);
        $this->assertDatabaseHas('department_user', [
            'user_id' => $user->id,
            'department_id' => $sales->id,
        ]);
        $this->assertDatabaseHas('department_user', [
            'user_id' => $user->id,
            'department_id' => $rh->id,
        ]);
    }

    public function test_user_sees_announcements_of_every_department_they_belong_to(): void
    {
        $it = Department::query()->create(['name' => 'IT']);
        $sales = Department::query()->create(['name' => 'Sales']);
        $rh = Department::query()->create(['name' => 'RH']);

        $user = User::query()->create([
            'name' => 'Collaborator User',
            'email' => 'collaborator.departments@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $user->roles()->attach(Role::query()->firstOrCreate(['name' => Role::ROLE_COLABORADOR])->id);
        $user->departments()->sync([$it->id, $sales->id]);

        Announcement::query()->create([
            'title' => 'IT Notice',
            'content' => 'For IT',
            'department_id' => $it->id,
            'created_by' => $user->id,
            'is_visible' => true,
        ]);
        Announcement::query()->create([
            'title' => 'Sales Notice',
            'content' => 'For Sales',
            'department_id' => $sales->id,
            'created_by' => $user->id,
            'is_visible' => true,
        ]);
        Announcement::query()->create([
            'title' => 'RH Notice',
            'content' => 'For RH',
            'department_id' => $rh->id,
            'created_by' => $user->id,
            'is_visible' => true,
        ]);

        $titles = collect(
            $this->actingAs($user, 'sanctum')
                ->getJson('/api/announcements')
                ->assertOk()
                ->json()
        )->pluck('title')
            ->all();

        $this->assertContains('IT Notice', $titles);
        $this->assertContains('Sales Notice', $titles);
        $this->assertNotContains('RH Notice', $titles);
    }

    public function test_chat_partners_include_users_of_any_shared_department(): void
    {
        $it = Department::query()->create(['name' => 'IT']);
        $sales = Department::query()->create(['name' => 'Sales']);

        $editor = User::query()->create([
            'name' => 'Editor User',
            'email' => 'editor.departments@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $editor->roles()->attach(Role::query()->firstOrCreate(['name' => Role::ROLE_COLABORADOR])->id);
        $editor->departments()->sync([$it->id, $sales->id]);

        $itPeer = User::query()->create([
            'name' => 'IT Peer',
            'email' => 'it.peer.departments@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $salesPeer = User::query()->create([
            'name' => 'Sales Peer',
            'email' => 'sales.peer.departments@example.com',
            'password' => 'password',
            'department_id' => $sales->id,
        ]);
        $rhPeer = User::query()->create([
            'name' => 'RH Peer',
            'email' => 'rh.peer.departments@example.com',
            'password' => 'password',
        ]);

        $emails = collect(
            $this->actingAs($editor, 'sanctum')
                ->getJson('/api/chat-partners')
                ->assertOk()
                ->json('data')
        )->pluck('email')
            ->all();

        $this->assertContains('it.peer.departments@example.com', $emails);
        $this->assertContains('sales.peer.departments@example.com', $emails);
        $this->assertNotContains('rh.peer.departments@example.com', $emails);
    }

    public function test_user_is_attached_to_the_group_conversation_of_every_department(): void
    {
        $it = Department::query()->create(['name' => 'IT']);
        $sales = Department::query()->create(['name' => 'Sales']);

        foreach ([$it, $sales] as $department) {
            Conversation::query()->create([
                'name' => $department->name,
                'type' => 'group',
                'department_id' => $department->id,
            ]);
        }

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Group User',
                'email' => 'group.departments@example.com',
                'password' => 'password123',
                'department_ids' => [$it->id, $sales->id],
            ])
            ->assertCreated();

        $userId = $response->json('data.id');

        $this->assertTrue(
            Conversation::query()
                ->where('department_id', $it->id)
                ->first()
                ->users()
                ->whereKey($userId)
                ->exists()
        );

        $this->assertTrue(
            Conversation::query()
                ->where('department_id', $sales->id)
                ->first()
                ->users()
                ->whereKey($userId)
                ->exists()
        );
    }
}
