<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageRead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    /**
     * Get user conversations with unread count per conversation.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $conversations = $user->conversations()->with('users')->get();

        $unreadByConversation = Message::query()
            ->whereIn('conversation_id', $conversations->pluck('id'))
            ->where('sender_id', '!=', $user->id)
            ->whereNotIn('id', MessageRead::query()
                ->where('user_id', $user->id)
                ->select('message_id'))
            ->selectRaw('conversation_id, COUNT(*) as unread_count')
            ->groupBy('conversation_id')
            ->pluck('unread_count', 'conversation_id');

        $payload = $conversations->map(function (Conversation $conversation) use ($unreadByConversation) {
            return [
                ...$conversation->toArray(),
                'unread_count' => (int) ($unreadByConversation[$conversation->id] ?? 0),
            ];
        })->values();

        return response()->json([
            'data' => $payload,
        ]);
    }

    /**
     * Create new conversation
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
        ]);

        // Create conversation
        $conversation = Conversation::create([
            'type' => count($request->user_ids) > 1
                    ? 'group'
                    : 'private',
        ]);

        // Add users
        $conversation->users()->attach(
            array_merge(
                $request->user_ids,
                [auth()->id()]
            )
        );

        return response()->json(
            $conversation->load('users'),
            201
        );
    }

    /**
     * Mark all messages in a conversation as read for the current user.
     */
    public function markAsRead(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $conversation->users()->whereKey($user->id)->exists(),
            403
        );

        $messageIds = Message::query()
            ->where('conversation_id', $conversation->id)
            ->pluck('id');

        $existingReads = MessageRead::query()
            ->where('user_id', $user->id)
            ->whereIn('message_id', $messageIds)
            ->pluck('message_id')
            ->all();

        $missingIds = $messageIds->diff($existingReads);

        $now = now();
        foreach ($missingIds as $messageId) {
            MessageRead::query()->create([
                'message_id' => $messageId,
                'user_id' => $user->id,
                'read_at' => $now,
            ]);
        }

        return response()->json([
            'message' => 'Mensajes marcados como leídos.',
            'marked_count' => count($missingIds),
        ]);
    }

    public function destroy(Conversation $conversation): JsonResponse
    {
        $this->ensureAdmin();

        $conversation->delete();

        return response()->json(null, 204);
    }

    private function ensureAdmin(): void
    {
        abort_unless(
            auth()->user()?->roles()->where('name', 'admin')->exists(),
            403
        );
    }
}
