<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cto_role_can_create_department_announcement(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $role = Role::query()->create(['name' => 'CTO']);
        $user = User::query()->create([
            'name' => 'CTO User',
            'email' => 'cto@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);
        $user->roles()->attach($role->id);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/announcements', [
            'title' => 'IT Notice',
            'content' => 'Scheduled maintenance',
            'department_id' => $department->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('announcements', [
            'title' => 'IT Notice',
            'department_id' => $department->id,
            'created_by' => $user->id,
        ]);
    }

    public function test_regular_role_cannot_create_department_announcement(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $role = Role::query()->create(['name' => 'Employee']);
        $user = User::query()->create([
            'name' => 'Employee User',
            'email' => 'employee@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);
        $user->roles()->attach($role->id);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/announcements', [
            'title' => 'IT Notice',
            'content' => 'Scheduled maintenance',
            'department_id' => $department->id,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('announcements', [
            'title' => 'IT Notice',
            'created_by' => $user->id,
        ]);
    }

    public function test_user_in_same_department_can_comment_on_announcement(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $announcementAuthor = User::query()->create([
            'name' => 'CTO User',
            'email' => 'cto@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);
        $announcement = Announcement::query()->create([
            'title' => 'IT Notice',
            'content' => 'Scheduled maintenance',
            'department_id' => $department->id,
            'created_by' => $announcementAuthor->id,
        ]);

        $commenter = User::query()->create([
            'name' => 'IT Member',
            'email' => 'it-member@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);

        $response = $this->actingAs($commenter, 'sanctum')->postJson(
            '/api/announcements/'.$announcement->id.'/comments',
            ['content' => 'Thanks for the heads up']
        );

        $response->assertCreated();
        $this->assertDatabaseHas('comments', [
            'content' => 'Thanks for the heads up',
            'user_id' => $commenter->id,
            'commentable_type' => Announcement::class,
            'commentable_id' => $announcement->id,
        ]);
    }

    public function test_user_from_other_department_cannot_comment_on_announcement(): void
    {
        $itDepartment = Department::query()->create(['name' => 'IT']);
        $salesDepartment = Department::query()->create(['name' => 'Sales']);
        $announcementAuthor = User::query()->create([
            'name' => 'CTO User',
            'email' => 'cto@example.com',
            'password' => 'password',
            'department_id' => $itDepartment->id,
        ]);
        $announcement = Announcement::query()->create([
            'title' => 'IT Notice',
            'content' => 'Scheduled maintenance',
            'department_id' => $itDepartment->id,
            'created_by' => $announcementAuthor->id,
        ]);

        $commenter = User::query()->create([
            'name' => 'Sales Member',
            'email' => 'sales-member@example.com',
            'password' => 'password',
            'department_id' => $salesDepartment->id,
        ]);

        $response = $this->actingAs($commenter, 'sanctum')->postJson(
            '/api/announcements/'.$announcement->id.'/comments',
            ['content' => 'I should not be able to post this']
        );

        $response->assertForbidden();
        $this->assertDatabaseMissing('comments', [
            'content' => 'I should not be able to post this',
            'user_id' => $commenter->id,
        ]);
    }
}
