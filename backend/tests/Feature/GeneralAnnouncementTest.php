<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeneralAnnouncementTest extends TestCase
{
    use RefreshDatabase;

    private function administrator(string $email = 'admin@example.com'): User
    {
        $user = User::query()->create([
            'name' => 'Admin User',
            'email' => $email,
            'password' => 'password',
        ]);

        $user->roles()->attach(Role::query()->firstOrCreate(['name' => Role::ROLE_ADMINISTRADOR])->id);

        return $user;
    }

    private function collaborator(string $email, ?Department $department): User
    {
        $user = User::query()->create([
            'name' => 'Collaborator User',
            'email' => $email,
            'password' => 'password',
            'department_id' => $department?->id,
        ]);

        $user->roles()->attach(Role::query()->firstOrCreate(['name' => Role::ROLE_COLABORADOR])->id);

        return $user;
    }

    public function test_publish_all_creates_a_single_general_announcement(): void
    {
        Department::query()->create(['name' => 'IT']);
        Department::query()->create(['name' => 'Sales']);
        Department::query()->create(['name' => 'RH']);

        $response = $this->actingAs($this->administrator(), 'sanctum')
            ->postJson('/api/announcements', [
                'title' => 'General Notice',
                'content' => 'For everyone',
                'publish_all' => true,
                'is_visible' => true,
            ]);

        $response->assertCreated();

        // Una sola publicacion, no una por departamento.
        $this->assertSame(1, Announcement::query()->count());

        $this->assertDatabaseHas('announcements', [
            'title' => 'General Notice',
            'department_id' => null,
        ]);
    }

    public function test_general_announcement_is_listed_for_users_of_every_department(): void
    {
        $it = Department::query()->create(['name' => 'IT']);
        $sales = Department::query()->create(['name' => 'Sales']);

        $announcement = Announcement::query()->create([
            'title' => 'General Notice',
            'content' => 'For everyone',
            'department_id' => null,
            'created_by' => $this->administrator('author@example.com')->id,
            'is_visible' => true,
        ]);

        $itUser = $this->collaborator('it@example.com', $it);
        $salesUser = $this->collaborator('sales@example.com', $sales);

        foreach ([$itUser, $salesUser] as $user) {
            $titles = collect(
                $this->actingAs($user, 'sanctum')
                    ->getJson('/api/announcements')
                    ->assertOk()
                    ->json()
            )->pluck('title')
                ->all();

            $this->assertContains('General Notice', $titles);
        }

        $this->assertSame('General Notice', $announcement->title);
    }

    public function test_user_from_another_department_can_comment_on_a_general_announcement(): void
    {
        $sales = Department::query()->create(['name' => 'Sales']);

        $announcement = Announcement::query()->create([
            'title' => 'General Notice',
            'content' => 'For everyone',
            'department_id' => null,
            'created_by' => $this->administrator('author@example.com')->id,
            'is_visible' => true,
        ]);

        $commenter = $this->collaborator('sales@example.com', $sales);

        $this->actingAs($commenter, 'sanctum')
            ->postJson('/api/announcements/'.$announcement->id.'/comments', [
                'content' => 'Thanks for the heads up',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('comments', [
            'content' => 'Thanks for the heads up',
            'user_id' => $commenter->id,
            'announcement_id' => $announcement->id,
        ]);
    }

    public function test_draft_general_announcement_is_hidden_from_regular_users(): void
    {
        $it = Department::query()->create(['name' => 'IT']);

        Announcement::query()->create([
            'title' => 'Draft General',
            'content' => 'Not yet',
            'department_id' => null,
            'created_by' => $this->administrator('author@example.com')->id,
            'is_visible' => false,
        ]);

        $titles = collect(
            $this->actingAs($this->collaborator('it@example.com', $it), 'sanctum')
                ->getJson('/api/announcements')
                ->assertOk()
                ->json()
        )->pluck('title')
            ->all();

        $this->assertNotContains('Draft General', $titles);
    }

    public function test_updating_with_publish_all_keeps_the_announcement_general(): void
    {
        $it = Department::query()->create(['name' => 'IT']);

        $announcement = Announcement::query()->create([
            'title' => 'IT Notice',
            'content' => 'Scheduled maintenance',
            'department_id' => $it->id,
            'created_by' => $this->administrator()->id,
            'is_visible' => true,
        ]);

        $this->actingAs($this->administrator('admin2@example.com'), 'sanctum')
            ->patchJson('/api/announcements/'.$announcement->id, [
                'title' => 'Now General',
                'publish_all' => true,
            ])
            ->assertOk();

        $this->assertDatabaseHas('announcements', [
            'id' => $announcement->id,
            'title' => 'Now General',
            'department_id' => null,
        ]);
    }

    public function test_non_admin_publication_keeps_its_own_department(): void
    {
        $it = Department::query()->create(['name' => 'IT']);

        $leader = User::query()->create([
            'name' => 'Leader User',
            'email' => 'leader@example.com',
            'password' => 'password',
            'department_id' => $it->id,
        ]);
        $leader->roles()->attach(Role::query()->firstOrCreate(['name' => Role::ROLE_LIDER])->id);

        $this->actingAs($leader, 'sanctum')
            ->postJson('/api/announcements', [
                'title' => 'IT Notice',
                'content' => 'Scheduled maintenance',
                'publish_all' => true,
                'is_visible' => true,
            ])
            ->assertCreated();

        // Un lider no puede convertir su publicacion en general.
        $this->assertDatabaseHas('announcements', [
            'title' => 'IT Notice',
            'department_id' => $it->id,
        ]);
    }
}
