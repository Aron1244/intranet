<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentFolder;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentFolderController extends Controller
{
    public function index(Department $department): JsonResponse
    {
        $this->ensureDepartmentAccess($department->id);

        $folders = DepartmentFolder::query()
            ->where('department_id', $department->id)
            ->with('children:id,parent_id,name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $folders,
        ]);
    }

    public function store(Request $request, Department $department): JsonResponse
    {
        $this->ensureDepartmentAccess($department->id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'parent_id' => ['nullable', 'integer', 'exists:department_folders,id'],
        ]);

        if (!empty($validated['parent_id'])) {
            $parentFolder = DepartmentFolder::query()->findOrFail($validated['parent_id']);
            abort_unless($parentFolder->department_id === $department->id, 422, 'parent_id no pertenece al departamento.');
        }

        $folder = DepartmentFolder::query()->create([
            'department_id' => $department->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'created_by' => (int) auth()->id(),
            'name' => $validated['name'],
        ]);

        return response()->json([
            'data' => $folder,
        ], 201);
    }

    public function uploadDocument(Request $request, Department $department, DepartmentFolder $folder): JsonResponse
    {
        $this->ensureDepartmentAccess($department->id);
        abort_unless($folder->department_id === $department->id, 404);

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:20480'],
            'title' => ['nullable', 'string', 'max:255'],
            'visibility' => ['nullable', 'in:public,department,private'],
        ]);

        $uploadedFile = $request->file('file');
        $path = $uploadedFile->store("documents/department/{$department->id}/{$folder->id}", 'public');

        $document = Document::query()->create([
            'title' => $validated['title'] ?? pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME),
            'file_path' => $path,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'mime_type' => $uploadedFile->getClientMimeType(),
            'size_bytes' => $uploadedFile->getSize(),
            'user_id' => (int) auth()->id(),
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

        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        if ($isAdmin) {
            return;
        }

        abort_unless((int) $user->department_id === $departmentId, 403);
    }
}
