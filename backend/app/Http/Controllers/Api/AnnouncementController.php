<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnnouncementController extends Controller
{
    /**
     * Display all announcements
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Announcement::query()
            ->with(['creator', 'department', 'attachments'])
            ->latest();

        if (! $user->canManageAnnouncements()) {
            $query->where('is_visible', true)
                ->where(function ($subQuery) use ($user): void {
                    $subQuery->whereNull('department_id')
                        ->orWhereIn('department_id', $user->departmentIds());
                });
        } elseif (! $user->isAdministrator()) {
            $query->where(function ($subQuery) use ($user): void {
                $subQuery->whereNull('department_id')
                    ->orWhereIn('department_id', $user->departmentIds());
            });
        }

        return response()->json($query->get());
    }

    /**
     * Store new announcement
     */
    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $isAdmin = $user->isAdministrator();

        $publishAll = (bool) ($validated['publish_all'] ?? false);
        unset($validated['publish_all']);

        if (! $isAdmin) {
            $validated['department_id'] = $user->department_id;
        } elseif ($publishAll) {
            // Publicación general: sin departamento, la ven todos. Antes se
            // creaba una copia por departamento, lo que multiplicaba la
            // publicación y duplicaba sus adjuntos.
            $validated['department_id'] = null;
        }

        $announcement = Announcement::query()->create([
            ...$validated,
            'is_visible' => (bool) ($validated['is_visible'] ?? false),
            'created_by' => $user->id,
        ]);

        $this->storeAttachments($request, $announcement);

        return response()->json($announcement->load(['creator', 'department', 'attachments']), 201);
    }

    /**
     * Show single announcement
     */
    public function show(Announcement $announcement): JsonResponse
    {
        $this->authorize('view', $announcement);

        return response()->json($announcement->load(['creator', 'department', 'comments.user', 'attachments']));
    }

    /**
     * Update announcement
     */
    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $publishAll = (bool) ($validated['publish_all'] ?? false);
        unset($validated['publish_all']);

        if (! $user->isAdministrator()) {
            unset($validated['department_id']);
        } elseif ($publishAll) {
            // Vuelve a ser una publicación general.
            $validated['department_id'] = null;
        }

        if (! empty($validated['remove_attachment_ids'])) {
            $announcement->attachments()
                ->whereIn('id', $validated['remove_attachment_ids'])
                ->get()
                ->each(function (AnnouncementAttachment $attachment): void {
                    Storage::disk('public')->delete($attachment->file_path);
                    $attachment->delete();
                });
        }

        unset($validated['attachments'], $validated['remove_attachment_ids']);

        $announcement->update($validated);
        $this->storeAttachments($request, $announcement);

        return response()->json($announcement->refresh()->load(['creator', 'department', 'attachments']), 200);
    }

    /**
     * Delete announcement
     */
    public function destroy(Announcement $announcement): JsonResponse
    {
        $this->authorize('delete', $announcement);

        $announcement->delete();

        return response()->json(null, 204);
    }

    public function downloadAttachment(Announcement $announcement, AnnouncementAttachment $attachment): StreamedResponse
    {
        $this->authorize('view', $announcement);
        abort_unless((int) $attachment->announcement_id === (int) $announcement->id, 404);

        return Storage::disk('public')->download(
            $attachment->file_path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type ?: 'application/octet-stream',
            ],
        );
    }

    private function storeAttachments(Request $request, Announcement $announcement): void
    {
        if (! $request->hasFile('attachments')) {
            return;
        }

        foreach ($request->file('attachments') as $file) {
            $storedPath = $file->store("announcements/{$announcement->id}", 'public');

            $announcement->attachments()->create([
                'user_id' => (int) $request->user()->id,
                'file_path' => $storedPath,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize(),
            ]);
        }
    }
}
