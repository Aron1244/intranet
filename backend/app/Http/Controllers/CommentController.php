<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;

class CommentController extends Controller
{
    public function indexByAnnouncement(int $announcementId)
    {
        $comments = Comment::query()
            ->where('announcement_id', $announcementId)
            ->with('user')
            ->latest()
            ->get();

        return CommentResource::collection($comments);
    }

    public function store(CommentRequest $request)
    {
        $comment = Comment::create([
            'user_id' => auth()->id(),
            'announcement_id' => $request->validated('announcement_id'),
            'content' => $request->validated('content'),
        ]);

        return new CommentResource($comment->load('user'));
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);
        $comment->delete();

        return response()->noContent();
    }
}
