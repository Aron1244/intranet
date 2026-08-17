<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Models\Department;
use App\Models\DepartmentFolder;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user, 401);

        $query = Document::query()
            ->with([
                'folder:id,name,department_id',
                'user:id,name',
                'messages:id,document_id,conversation_id',
                'messages.conversation:id,name',
            ])
            ->latest();

        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        if (!$isAdmin) {
            $query->where(function ($subQuery) use ($user): void {
                $subQuery
                    ->where('user_id', $user->id)
                    ->orWhere('visibility', 'public')
                    ->orWhere(function ($departmentQuery) use ($user): void {
                        $departmentQuery
                            ->where('visibility', 'department')
                            ->whereHas('folder', function ($folderQuery) use ($user): void {
                                $folderQuery->where('department_id', $user->department_id);
                            });
                    })
                    ->orWhereHas('messages.conversation.users', function ($conversationUserQuery) use ($user): void {
                        $conversationUserQuery->whereKey($user->id);
                    });
            });
        }

        $documents = $query->get()->map(function (Document $document): array {
            $origin = [
                'type' => 'general',
                'label' => 'General',
            ];

            $chatMessage = $document->messages->first();
            if ($chatMessage && $chatMessage->conversation) {
                $conversation = $chatMessage->conversation;

                $origin = [
                    'type' => 'chat',
                    'label' => 'Chat: ' . ($conversation->name ?: ('Conversacion ' . $conversation->id)),
                    'conversation_id' => (int) $conversation->id,
                ];
            } elseif ($document->folder) {
                $origin = [
                    'type' => 'folder',
                    'label' => 'Carpeta: ' . $document->folder->name,
                    'folder_id' => (int) $document->folder->id,
                ];
            }

            return [
                ...$document->toArray(),
                'origin' => $origin,
            ];
        });

        return response()->json([
            'data' => $documents,
        ]);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user, 401);

        $validated = $request->validated();

        $folder = null;
        if (!empty($validated['department_folder_id'])) {
            $folder = DepartmentFolder::query()->findOrFail((int) $validated['department_folder_id']);
            $this->ensureDepartmentAccess((int) $folder->department_id);
        }

        $file = $request->file('file');
        $directory = $folder
            ? "documents/department/{$folder->department_id}/{$folder->id}"
            : "documents/general/{$user->id}";
        $storedPath = $file->store($directory, 'public');

        $document = Document::query()->create([
            'title' => $validated['title'] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'file_path' => $storedPath,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize(),
            'user_id' => (int) $user->id,
            'department_folder_id' => $folder?->id,
            'visibility' => $validated['visibility'] ?? ($folder ? 'department' : 'private'),
        ]);

        return response()->json([
            'data' => $document,
        ], 201);
    }

    public function show(Document $document): JsonResponse
    {
        $this->ensureDocumentAccess($document);

        return response()->json([
            'data' => $document,
        ]);
    }

    public function download(Document $document): StreamedResponse
    {
        $this->ensureDocumentAccess($document);

        $downloadName = $document->original_name ?: ($document->title ?: 'documento');
        $headers = [
            'Content-Type' => $document->mime_type ?: 'application/octet-stream',
        ];

        return Storage::disk('public')->download(
            $document->file_path,
            $downloadName,
            $headers,
        );
    }

    public function update(UpdateDocumentRequest $request, Document $document): JsonResponse
    {
        $this->ensureDocumentAccess($document, mustOwnOrAdmin: true);

        $validated = $request->validated();

        if (!empty($validated['department_folder_id'])) {
            $folder = DepartmentFolder::query()->findOrFail((int) $validated['department_folder_id']);
            $this->ensureDepartmentAccess((int) $folder->department_id);
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $directory = isset($folder)
                ? "documents/department/{$folder->department_id}/{$folder->id}"
                : "documents/general/" . auth()->id();

            $validated['file_path'] = $file->store($directory, 'public');
            $validated['original_name'] = $file->getClientOriginalName();
            $validated['mime_type'] = $file->getClientMimeType();
            $validated['size_bytes'] = $file->getSize();
        }

        $document->update($validated);

        return response()->json([
            'data' => $document->refresh(),
        ]);
    }

    public function destroy(Document $document): JsonResponse
    {
        $this->ensureDocumentAccess($document, mustOwnOrAdmin: true);

        $document->delete();

        return response()->json(null, 204);
    }

    public function storeDepartmentDocument(
        StoreDocumentRequest $request,
        Department $department,
        DepartmentFolder $folder
    ): JsonResponse {
        abort_unless((int) $folder->department_id === (int) $department->id, 404);
        $this->ensureDepartmentAccess((int) $department->id);

        $user = auth()->user();
        abort_unless($user, 401);

        $validated = $request->validated();
        $file = $request->file('file');
        $storedPath = $file->store(
            "documents/department/{$department->id}/{$folder->id}",
            'public'
        );

        $document = Document::query()->create([
            'title' => $validated['title'] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'file_path' => $storedPath,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize(),
            'user_id' => (int) $user->id,
            'department_folder_id' => $folder->id,
            'visibility' => $validated['visibility'] ?? 'department',
        ]);

        return response()->json([
            'data' => $document,
        ], 201);
    }

    private function ensureDepartmentAccess(int $departmentId): void
    {
        $user = auth()->user();
        abort_unless($user, 401);

        if ($user->roles()->where('name', 'admin')->exists()) {
            return;
        }

        abort_unless((int) $user->department_id === $departmentId, 403);
    }

    private function ensureDocumentAccess(Document $document, bool $mustOwnOrAdmin = false): void
    {
        $user = auth()->user();
        abort_unless($user, 401);

        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        if ($isAdmin) {
            return;
        }

        $isOwner = (int) $document->user_id === (int) $user->id;
        if ($mustOwnOrAdmin) {
            abort_unless($isOwner, 403);
            return;
        }

        if ($isOwner || $document->visibility === 'public') {
            return;
        }

        if (
            $document->visibility === 'department' &&
            $document->folder &&
            (int) $document->folder->department_id === (int) $user->department_id
        ) {
            return;
        }

        $isSharedInUserConversation = $document
            ->messages()
            ->whereHas('conversation.users', function ($conversationUserQuery) use ($user): void {
                $conversationUserQuery->whereKey($user->id);
            })
            ->exists();

        if ($isSharedInUserConversation) {
            return;
        }

        abort(403);
    }
}
