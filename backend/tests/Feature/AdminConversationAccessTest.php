<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Document;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminConversationAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makeUserWithRole(string $roleName): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user = User::query()->create([
            'name' => "{$roleName} User",
            'email' => strtolower(str_replace(' ', '.', $roleName)).'.'.User::query()->count().'@example.com',
            'password' => 'password',
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }

    private function makeConversation(User ...$users): Conversation
    {
        $conversation = Conversation::create(['type' => count($users) > 2 ? 'group' : 'private']);
        $conversation->users()->attach(array_map(fn (User $user) => $user->id, $users));

        return $conversation;
    }

    private function makeDocument(User $owner): Document
    {
        Storage::fake('public');

        return Document::query()->create([
            'title' => 'Contrato',
            'file_path' => 'documents/chat/1/contrato.pdf',
            'original_name' => 'contrato.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 1024,
            'user_id' => $owner->id,
            'department_folder_id' => null,
            'visibility' => 'private',
        ]);
    }

    public function test_admin_sees_conversations_they_do_not_participate_in(): void
    {
        $admin = $this->makeUserWithRole(Role::ROLE_ADMINISTRADOR);
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $conversation = $this->makeConversation($alice, $bob);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/conversations')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($conversation->id, $ids);
    }

    public function test_collaborator_only_sees_own_conversations(): void
    {
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $eve = $this->makeUserWithRole('Nuevo Ingreso');
        $conversation = $this->makeConversation($alice, $bob);

        $response = $this->actingAs($eve, 'sanctum')
            ->getJson('/api/conversations')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertNotContains($conversation->id, $ids);
    }

    public function test_admin_can_read_messages_from_any_conversation(): void
    {
        $admin = $this->makeUserWithRole(Role::ROLE_ADMINISTRADOR);
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $conversation = $this->makeConversation($alice, $bob);
        $document = $this->makeDocument($bob);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $alice->id,
            'content' => 'Te paso el contrato',
            'document_id' => $document->id,
            'type' => 'file',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/conversations/{$conversation->id}/messages")
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($document->id, $response->json('data.0.document.id'));
    }

    public function test_collaborator_cannot_read_messages_from_other_conversation(): void
    {
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $eve = $this->makeUserWithRole('Nuevo Ingreso');
        $conversation = $this->makeConversation($alice, $bob);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $alice->id,
            'content' => 'Privado',
        ]);

        $this->actingAs($eve, 'sanctum')
            ->getJson("/api/conversations/{$conversation->id}/messages")
            ->assertForbidden();
    }

    public function test_admin_unread_count_is_zero_for_conversations_they_do_not_participate_in(): void
    {
        $admin = $this->makeUserWithRole(Role::ROLE_ADMINISTRADOR);
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $foreignConversation = $this->makeConversation($alice, $bob);
        $ownConversation = $this->makeConversation($admin, $bob);

        Message::create([
            'conversation_id' => $foreignConversation->id,
            'sender_id' => $alice->id,
            'content' => 'Mensaje ajeno',
        ]);
        Message::create([
            'conversation_id' => $ownConversation->id,
            'sender_id' => $bob->id,
            'content' => 'Mensaje propio',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/conversations')
            ->assertOk();

        $byId = collect($response->json('data'))->keyBy('id');

        $this->assertSame(0, $byId[$foreignConversation->id]['unread_count']);
        $this->assertSame(1, $byId[$ownConversation->id]['unread_count']);
    }

    public function test_admin_can_send_message_to_any_conversation(): void
    {
        $admin = $this->makeUserWithRole(Role::ROLE_ADMINISTRADOR);
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $conversation = $this->makeConversation($alice, $bob);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/messages', [
                'conversation_id' => $conversation->id,
                'content' => 'Aviso del administrador',
            ])
            ->assertOk()
            ->assertJsonPath('sender_id', $admin->id)
            ->assertJsonPath('conversation_id', $conversation->id);
    }

    public function test_admin_can_delete_message_in_any_conversation(): void
    {
        $admin = $this->makeUserWithRole(Role::ROLE_ADMINISTRADOR);
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $conversation = $this->makeConversation($alice, $bob);
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $alice->id,
            'content' => 'Mensaje a moderar',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/messages/{$message->id}")
            ->assertOk();

        $this->assertSoftDeleted('messages', ['id' => $message->id]);
    }

    public function test_admin_can_rename_any_conversation(): void
    {
        $admin = $this->makeUserWithRole(Role::ROLE_ADMINISTRADOR);
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $conversation = $this->makeConversation($alice, $bob);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/conversations/{$conversation->id}", ['name' => 'Proyecto X'])
            ->assertOk()
            ->assertJsonPath('name', 'Proyecto X');
    }

    public function test_admin_can_mark_any_conversation_as_read(): void
    {
        $admin = $this->makeUserWithRole(Role::ROLE_ADMINISTRADOR);
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $conversation = $this->makeConversation($alice, $bob);
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $alice->id,
            'content' => 'Mensaje ajeno',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/conversations/{$conversation->id}/read")
            ->assertOk()
            ->assertJsonPath('marked_count', 1);
    }

    public function test_non_participant_cannot_write_to_a_conversation(): void
    {
        $alice = $this->makeUserWithRole('Colaborador');
        $bob = $this->makeUserWithRole('Líder');
        $conversation = $this->makeConversation($alice, $bob);
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $alice->id,
            'content' => 'Mensaje ajeno',
        ]);

        foreach (['Nuevo Ingreso', 'Líder'] as $roleName) {
            $outsider = $this->makeUserWithRole($roleName);

            $this->actingAs($outsider, 'sanctum')
                ->postJson('/api/messages', [
                    'conversation_id' => $conversation->id,
                    'content' => 'Intruso',
                ])
                ->assertForbidden();

            $this->actingAs($outsider, 'sanctum')
                ->deleteJson("/api/messages/{$message->id}")
                ->assertForbidden();

            $this->actingAs($outsider, 'sanctum')
                ->patchJson("/api/conversations/{$conversation->id}", ['name' => 'Intruso'])
                ->assertForbidden();

            $this->actingAs($outsider, 'sanctum')
                ->postJson("/api/conversations/{$conversation->id}/read")
                ->assertForbidden();
        }

        $this->assertNotSoftDeleted('messages', ['id' => $message->id]);
    }
}
