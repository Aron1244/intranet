<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TrashController extends Controller
{
    /**
     * List soft-deleted messages and documents awaiting admin review.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->isAdministrator(), 403, 'Solo administradores pueden revisar la papelera.');

        $messages = Message::onlyTrashed()
            ->with(['sender:id,name', 'conversation:id,name,department_id', 'deletedByUser:id,name'])
            ->latest('deleted_at')
            ->limit(200)
            ->get()
            ->map(function (Message $message): array {
                return [
                    'id' => $message->id,
                    'type' => 'message',
                    'conversation_id' => $message->conversation_id,
                    'conversation_name' => $message->conversation?->name,
                    'department_id' => $message->conversation?->department_id,
                    'content' => $message->content,
                    'sender' => $message->sender?->only(['id', 'name']),
                    'deleted_by' => $message->deletedByUser?->only(['id', 'name']),
                    'deleted_at' => optional($message->deleted_at)->toIso8601String(),
                    'created_at' => optional($message->created_at)->toIso8601String(),
                ];
            });

        $documents = Document::onlyTrashed()
            ->with(['user:id,name', 'deletedByUser:id,name', 'folder:id,name,department_id'])
            ->latest('deleted_at')
            ->limit(200)
            ->get()
            ->map(function (Document $document): array {
                return [
                    'id' => $document->id,
                    'type' => 'document',
                    'title' => $document->title,
                    'original_name' => $document->original_name,
                    'mime_type' => $document->mime_type,
                    'size_bytes' => $document->size_bytes,
                    'file_path' => $document->file_path,
                    'owner' => $document->user?->only(['id', 'name']),
                    'folder' => $document->folder?->only(['id', 'name', 'department_id']),
                    'department_id' => $document->folder?->department_id,
                    'deleted_by' => $document->deletedByUser?->only(['id', 'name']),
                    'deleted_at' => optional($document->deleted_at)->toIso8601String(),
                    'created_at' => optional($document->created_at)->toIso8601String(),
                ];
            });

        return response()->json([
            'data' => [
                'messages' => $messages,
                'documents' => $documents,
            ],
        ]);
    }

    /**
     * Permanently remove a soft-deleted message.
     */
    public function destroyMessage(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->isAdministrator(), 403, 'Solo administradores pueden borrar definitivamente.');

        $message = Message::onlyTrashed()->findOrFail($id);
        $message->forceDelete();

        return response()->json(['message' => 'Mensaje eliminado definitivamente.']);
    }

    /**
     * Restore a soft-deleted message.
     */
    public function restoreMessage(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->isAdministrator(), 403, 'Solo administradores pueden restaurar.');

        $message = Message::onlyTrashed()->findOrFail($id);
        $message->restore();
        $message->deleted_by = null;
        $message->save();

        return response()->json(['message' => 'Mensaje restaurado.']);
    }

    /**
     * Permanently remove a soft-deleted document and its file blob.
     */
    public function destroyDocument(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->isAdministrator(), 403, 'Solo administradores pueden borrar definitivamente.');

        $document = Document::onlyTrashed()->findOrFail($id);

        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->forceDelete();

        return response()->json(['message' => 'Documento eliminado definitivamente.']);
    }

    /**
     * Restore a soft-deleted document.
     */
    public function restoreDocument(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->isAdministrator(), 403, 'Solo administradores pueden restaurar.');

        $document = Document::onlyTrashed()->findOrFail($id);
        $document->restore();
        $document->deleted_by = null;
        $document->save();

        return response()->json(['message' => 'Documento restaurado.']);
    }
}
