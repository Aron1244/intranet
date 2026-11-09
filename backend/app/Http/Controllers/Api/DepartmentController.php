<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\Conversation;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Department::query()
                ->select(['id', 'name', 'description', 'color'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $department = Department::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? null,
        ]);

        $conversation = Conversation::create([
            'name' => $department->name,
            'type' => 'group',
            'department_id' => $department->id,
        ]);

        $userIds = $validated['initial_user_ids'] ?? [];
        if (! empty($userIds)) {
            $conversation->users()->syncWithoutDetaching($userIds);
        }

        return response()->json([
            'message' => 'Departamento creado exitosamente.',
            'data' => $department->fresh(),
            'conversation_id' => $conversation->id,
        ], 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json([
            'data' => $department,
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $department->update($request->validated());

        $conversation = $department->conversation()->first();
        if ($conversation && $department->wasChanged('name')) {
            $conversation->name = $department->name;
            $conversation->save();
        }

        return response()->json([
            'message' => 'Departamento actualizado exitosamente.',
            'data' => $department,
        ]);
    }

    public function destroy(Department $department): Response
    {
        $department->delete();

        return response('', 204);
    }

    /**
     * Attach a user to the group conversation of every department they belong to.
     * Called from UserController when their departments change.
     */
    public static function syncUserWithDepartmentConversations(User $user): void
    {
        $departmentIds = $user->departmentIds();

        if ($departmentIds === []) {
            return;
        }

        $conversations = Conversation::query()
            ->whereIn('department_id', $departmentIds)
            ->get();

        foreach ($conversations as $conversation) {
            $conversation->users()->syncWithoutDetaching([$user->id]);
        }
    }
}
