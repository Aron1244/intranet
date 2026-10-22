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
     * Attach a user to the department's group conversation.
     * Called from UserController when department_id changes.
     */
    public static function syncUserWithDepartmentConversation(User $user, ?int $departmentId): void
    {
        if ($departmentId === null) {
            return;
        }

        $conversation = Conversation::query()
            ->where('department_id', $departmentId)
            ->first();

        if ($conversation === null) {
            return;
        }

        $conversation->users()->syncWithoutDetaching([$user->id]);
    }
}
