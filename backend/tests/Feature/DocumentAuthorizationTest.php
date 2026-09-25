<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function makeUserWithRole(string $roleName, ?Department $department = null): User
    {
        $department ??= Department::query()->firstOrCreate(['name' => 'IT']);
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

    private function makeDocument(User $owner, string $visibility = 'private'): Document
    {
        Storage::fake('public');
        $path = UploadedFile::fake()->create('test.pdf', 10)->store('documents/general/'.$owner->id, 'public');

        return Document::query()->create([
            'title' => 'Test Doc',
            'file_path' => $path,
            'original_name' => 'test.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 1024,
            'user_id' => $owner->id,
            'department_folder_id' => null,
            'visibility' => $visibility,
        ]);
    }

    public function test_owner_can_delete_own_document(): void
    {
        $owner = $this->makeUserWithRole('Colaborador');
        $document = $this->makeDocument($owner);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/documents/{$document->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
    }

    public function test_admin_can_delete_any_document(): void
    {
        $owner = $this->makeUserWithRole('Colaborador');
        $admin = $this->makeUserWithRole('admin');
        $document = $this->makeDocument($owner);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/documents/{$document->id}")
            ->assertNoContent();
    }

    public function test_non_owner_non_admin_cannot_delete_document(): void
    {
        $owner = $this->makeUserWithRole('Alice');
        $other = $this->makeUserWithRole('Bob');
        $document = $this->makeDocument($owner);

        $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/documents/{$document->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('documents', ['id' => $document->id]);
    }

    public function test_owner_can_update_own_document(): void
    {
        $owner = $this->makeUserWithRole('Colaborador');
        $document = $this->makeDocument($owner);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/documents/{$document->id}", [
                'title' => 'Updated Title',
            ])
            ->assertOk();

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_admin_can_update_any_document(): void
    {
        $owner = $this->makeUserWithRole('Colaborador');
        $admin = $this->makeUserWithRole('admin');
        $document = $this->makeDocument($owner);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/documents/{$document->id}", [
                'title' => 'Admin Update',
            ])
            ->assertOk();

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'title' => 'Admin Update',
        ]);
    }

    public function test_non_owner_non_admin_cannot_update_document(): void
    {
        $owner = $this->makeUserWithRole('Alice');
        $other = $this->makeUserWithRole('Bob');
        $document = $this->makeDocument($owner);

        $this->actingAs($other, 'sanctum')
            ->patchJson("/api/documents/{$document->id}", [
                'title' => 'Hijacked',
            ])
            ->assertForbidden();
    }

    public function test_authenticated_user_can_upload_document(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');

        $this->actingAs($user, 'sanctum')
            ->post('/api/documents', [
                'title' => 'My Upload',
                'file' => UploadedFile::fake()->create('upload.pdf', 5),
            ])
            ->assertCreated();
    }

    public function test_uploaded_document_belongs_to_uploader(): void
    {
        Storage::fake('public');
        $user = $this->makeUserWithRole('Colaborador');

        $response = $this->actingAs($user, 'sanctum')
            ->post('/api/documents', [
                'title' => 'My Upload',
                'file' => UploadedFile::fake()->create('upload.pdf', 5),
            ])
            ->assertCreated();

        $documentId = $response->json('data.id');
        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'user_id' => $user->id,
        ]);
    }

    public function test_owner_can_view_own_document(): void
    {
        $owner = $this->makeUserWithRole('Colaborador');
        $document = $this->makeDocument($owner);

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/documents/{$document->id}")
            ->assertOk();
    }
}
