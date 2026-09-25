<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageReadTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $roleName = 'Colaborador'): User
    {
        $user = User::query()->create([
            'name' => $roleName.' User',
            'email' => strtolower(str_replace(' ', '.', $roleName)).'@example.com',
            'password' => 'password',
        ]);

        return $user;
    }

    private function makeConversationWith(User $owner, User ...$others): Conversation
    {
        $conversation = Conversation::create(['type' => count($others) > 0 ? 'group' : 'private']);
        $conversation->users()->attach(array_merge([$owner->id], array_map(fn ($u) => $u->id, $others)));

        return $conversation;
    }

    public function test_conversation_list_includes_unread_count(): void
    {
        $alice = $this->makeUser('Alice');
        $bob = $this->makeUser('Bob');
        $conversation = $this->makeConversationWith($alice, $bob);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'Hi Alice',
        ]);
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'How are you?',
        ]);

        $response = $this->actingAs($alice, 'sanctum')
            ->getJson('/api/conversations')
            ->assertOk();

        $first = $response->json('data.0');
        $this->assertSame($conversation->id, $first['id']);
        $this->assertSame(2, $first['unread_count']);
    }

    public function test_mark_conversation_as_read_creates_message_reads(): void
    {
        $alice = $this->makeUser('Alice');
        $bob = $this->makeUser('Bob');
        $conversation = $this->makeConversationWith($alice, $bob);

        $m1 = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'First',
        ]);
        $m2 = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'Second',
        ]);

        $this->actingAs($alice, 'sanctum')
            ->postJson("/api/conversations/{$conversation->id}/read")
            ->assertOk()
            ->assertJsonStructure(['message', 'marked_count']);

        $this->assertDatabaseHas('message_reads', [
            'message_id' => $m1->id,
            'user_id' => $alice->id,
        ]);
        $this->assertDatabaseHas('message_reads', [
            'message_id' => $m2->id,
            'user_id' => $alice->id,
        ]);
    }

    public function test_marking_as_read_clears_unread_count(): void
    {
        $alice = $this->makeUser('Alice');
        $bob = $this->makeUser('Bob');
        $conversation = $this->makeConversationWith($alice, $bob);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'Hi',
        ]);

        $this->actingAs($alice, 'sanctum')->postJson("/api/conversations/{$conversation->id}/read");

        $response = $this->actingAs($alice, 'sanctum')
            ->getJson('/api/conversations')
            ->assertOk();

        $this->assertSame(0, $response->json('data.0.unread_count'));
    }

    public function test_unread_count_only_counts_other_users_messages_not_own(): void
    {
        $alice = $this->makeUser('Alice');
        $bob = $this->makeUser('Bob');
        $conversation = $this->makeConversationWith($alice, $bob);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $alice->id,
            'content' => 'My message',
        ]);
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'Their reply',
        ]);

        $response = $this->actingAs($alice, 'sanctum')
            ->getJson('/api/conversations')
            ->assertOk();

        $this->assertSame(1, $response->json('data.0.unread_count'));
    }

    public function test_mark_as_read_is_idempotent(): void
    {
        $alice = $this->makeUser('Alice');
        $bob = $this->makeUser('Bob');
        $conversation = $this->makeConversationWith($alice, $bob);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'Hi',
        ]);

        $this->actingAs($alice, 'sanctum')
            ->postJson("/api/conversations/{$conversation->id}/read")
            ->assertOk();

        $second = $this->actingAs($alice, 'sanctum')
            ->postJson("/api/conversations/{$conversation->id}/read")
            ->assertOk();

        $this->assertSame(0, $second->json('marked_count'));
    }

    public function test_user_cannot_mark_other_users_conversation_as_read(): void
    {
        $alice = $this->makeUser('Alice');
        $bob = $this->makeUser('Bob');
        $eve = $this->makeUser('Eve');

        $conversation = $this->makeConversationWith($alice, $bob);
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $bob->id,
            'content' => 'Private',
        ]);

        $this->actingAs($eve, 'sanctum')
            ->postJson("/api/conversations/{$conversation->id}/read")
            ->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_mark_read(): void
    {
        $alice = $this->makeUser('Alice');
        $bob = $this->makeUser('Bob');
        $conversation = $this->makeConversationWith($alice, $bob);

        $this->postJson("/api/conversations/{$conversation->id}/read")
            ->assertUnauthorized();
    }
}
