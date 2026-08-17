<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_comment_on_announcement(): void
    {
        // Create department and user
        $department = Department::create(['name' => 'IT']);
        $role = Role::create(['name' => 'Editor', 'can_post_announcements' => true]);
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);
        $user->roles()->attach($role->id);

        // Create announcement
        $announcement = Announcement::create([
            'title' => 'Test Announcement',
            'content' => 'Test content for announcement',
            'department_id' => $department->id,
            'created_by' => $user->id,
        ]);

        // Try to comment
        $response = $this->actingAs($user, 'sanctum')->postJson(
            "/api/announcements/{$announcement->id}/comments",
            [
                'content' => 'This is a test comment',
            ]
        );

        $response->assertCreated();
        $this->assertDatabaseHas('comments', [
            'announcement_id' => $announcement->id,
            'user_id' => $user->id,
            'content' => 'This is a test comment',
        ]);
    }
}
