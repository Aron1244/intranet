<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Document;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Conversation $conversation): JsonResponse
    {
        abort_unless(
            $conversation->users()->whereKey(auth()->id())->exists(),
            403
        );

        $messages = $conversation
            ->messages()
            ->with([
                'sender:id,name',
                'document:id,title,file_path,original_name,mime_type,size_bytes,visibility,department_folder_id,user_id',
            ])
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => $messages,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'content' => 'nullable|string',
            'attachment' => 'nullable|file|max:20480',
            'document_id' => 'nullable|exists:documents,id',
        ]);

        $conversation = Conversation::query()->findOrFail($request->integer('conversation_id'));
        abort_unless(
            $conversation->users()->whereKey(auth()->id())->exists(),
            403
        );

        $document = null;

        if ($request->hasFile('attachment')) {
            $attachment = $request->file('attachment');
            $path = $attachment->store("documents/chat/{$conversation->id}", 'public');

            $document = Document::query()->create([
                'title' => pathinfo($attachment->getClientOriginalName(), PATHINFO_FILENAME),
                'file_path' => $path,
                'original_name' => $attachment->getClientOriginalName(),
                'mime_type' => $attachment->getClientMimeType(),
                'size_bytes' => $attachment->getSize(),
                'user_id' => (int) auth()->id(),
                'department_folder_id' => null,
                'visibility' => 'private',
            ]);
        }

        if (!$document && $request->filled('document_id')) {
            $document = Document::query()->findOrFail($request->integer('document_id'));
            $this->ensureDocumentAccess($document);
        }

        $content = trim((string) $request->input('content', ''));

        abort_if(
            $content === '' && !$document,
            422,
            'Debes enviar contenido o un archivo.'
        );

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(),
            'content' => $content !== ''
                ? $content
                : ($document?->original_name ?? $document?->title ?? ''),
            'document_id' => $document?->id,
            'type' => $document ? 'file' : 'text',
        ]);

        $message->load([
            'sender:id,name',
            'document:id,title,file_path,original_name,mime_type,size_bytes,visibility,department_folder_id,user_id',
        ]);

        // Broadcast message to other participants.
        broadcast(
            new MessageSent($message)
        )->toOthers();

        return response()->json($message);
    }

    public function destroy(Message $message): JsonResponse
    {
        $this->ensureAdmin();

        $message->delete();

        return response()->json(null, 204);
    }

    private function ensureAdmin(): void
    {
        abort_unless(
            auth()->user()?->roles()->where('name', 'admin')->exists(),
            403
        );
    }

    private function ensureDocumentAccess(Document $document): void
    {
        $user = auth()->user();
        abort_unless($user, 401);

        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        if ($isAdmin) {
            return;
        }

        if ((int) $document->user_id === (int) $user->id) {
            return;
        }

        if ($document->visibility === 'public') {
            return;
        }

        if (
            $document->visibility === 'department' &&
            $document->folder &&
            (int) $user->department_id === (int) $document->folder->department_id
        ) {
            return;
        }

        abort(403);
    }
}
