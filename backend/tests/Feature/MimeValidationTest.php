<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MimeValidationTest extends TestCase
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

    public function test_document_upload_with_valid_pdf_passes(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');

        $this->actingAs($user, 'sanctum')
            ->post('/api/documents', [
                'title' => 'Valid PDF',
                'file' => UploadedFile::fake()->create('doc.pdf', 5, 'application/pdf'),
            ])
            ->assertCreated();
    }

    public function test_document_upload_with_wrong_mime_for_pdf_returns_415(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');

        $this->actingAs($user, 'sanctum')
            ->post('/api/documents', [
                'title' => 'Fake PDF',
                'file' => UploadedFile::fake()->create('malware.pdf', 5, 'application/x-msdownload'),
            ])
            ->assertStatus(415)
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_document_upload_with_executable_returns_415(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');

        $this->actingAs($user, 'sanctum')
            ->post('/api/documents', [
                'file' => UploadedFile::fake()->create('script.exe', 5, 'application/x-msdownload'),
            ])
            ->assertStatus(415);
    }

    public function test_document_upload_with_valid_jpeg_passes(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');

        $this->actingAs($user, 'sanctum')
            ->post('/api/documents', [
                'file' => UploadedFile::fake()->image('photo.jpg'),
            ])
            ->assertCreated();
    }

    public function test_announcement_attachment_with_wrong_mime_returns_415(): void
    {
        Storage::fake('public');
        $department = Department::query()->create(['name' => 'IT']);
        $user = $this->makeUserWithRole('admin');

        $this->actingAs($user, 'sanctum')
            ->post('/api/announcements', [
                'title' => 'News',
                'content' => 'Body',
                'department_id' => $department->id,
                'is_visible' => true,
                'attachments' => [
                    UploadedFile::fake()->create('doc.pdf', 5, 'application/x-msdownload'),
                ],
            ])
            ->assertStatus(415);
    }

    public function test_announcement_attachment_with_valid_pdf_passes(): void
    {
        Storage::fake('public');
        $department = Department::query()->create(['name' => 'IT']);
        $user = $this->makeUserWithRole('admin');

        $this->actingAs($user, 'sanctum')
            ->post('/api/announcements', [
                'title' => 'News',
                'content' => 'Body',
                'department_id' => $department->id,
                'is_visible' => true,
                'attachments' => [
                    UploadedFile::fake()->create('doc.pdf', 5, 'application/pdf'),
                ],
            ])
            ->assertCreated();
    }

    public function test_message_attachment_with_wrong_mime_returns_415(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');
        $otherUser = $this->makeUserWithRole('Peer');

        $conversation = Conversation::create(['type' => 'private']);
        $conversation->users()->attach([$user->id, $otherUser->id]);

        $this->actingAs($user, 'sanctum')
            ->post('/api/messages', [
                'conversation_id' => $conversation->id,
                'content' => 'Hi',
                'attachment' => UploadedFile::fake()->create('doc.pdf', 5, 'application/x-msdownload'),
            ])
            ->assertStatus(415);
    }

    public function test_message_attachment_with_valid_pdf_passes(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');
        $otherUser = $this->makeUserWithRole('Peer');

        $conversation = Conversation::create(['type' => 'private']);
        $conversation->users()->attach([$user->id, $otherUser->id]);

        $this->actingAs($user, 'sanctum')
            ->post('/api/messages', [
                'conversation_id' => $conversation->id,
                'content' => 'Hi',
                'attachment' => UploadedFile::fake()->create('doc.pdf', 5, 'application/pdf'),
            ])
            ->assertOk();
    }

    public function test_message_without_attachment_skips_mime_validation(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');
        $otherUser = $this->makeUserWithRole('Peer');

        $conversation = Conversation::create(['type' => 'private']);
        $conversation->users()->attach([$user->id, $otherUser->id]);

        $this->actingAs($user, 'sanctum')
            ->post('/api/messages', [
                'conversation_id' => $conversation->id,
                'content' => 'Just text',
            ])
            ->assertOk();
    }
}
