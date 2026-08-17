<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Announcement;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommentController extends Controller
{
    public function indexByAnnouncement(int $announcementId): AnonymousResourceCollection
    {
        $comments = Comment::query()
            ->where('announcement_id', $announcementId)
            ->with('user')
            ->latest()
            ->get();

        return CommentResource::collection($comments);
    }

    public function store(Announcement $announcement, StoreCommentRequest $request): CommentResource
    {
        $comment = Comment::create([
            'user_id' => auth()->id(),
            'announcement_id' => $announcement->id,
            'content' => $request->validated('content'),
        ]);

        return new CommentResource($comment->load('user'));
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);
        $comment->delete();

        return response()->json(null, 204);
    }
}
