<?php

namespace App\Http\Controllers\Api;

use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ConversationController extends Controller
{
    /**
     * Get user conversations
     */
    public function index()
    {
        return auth()
            ->user()
            ->conversations()
            ->with('users')
            ->get();
    }

    /**
     * Create new conversation
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array'
        ]);

        // Create conversation
        $conversation = Conversation::create([
            'type' =>
                count($request->user_ids) > 1
                    ? 'group'
                    : 'private'
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