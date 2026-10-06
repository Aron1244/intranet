<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Department::query()
                ->select(['id', 'name', 'description'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:departments',
                'description' => 'nullable|string',
                'initial_user_ids' => 'sometimes|array',
                'initial_user_ids.*' => 'integer|exists:users,id',
            ]);

            $department = Department::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
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
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json([
            'data' => $department,
        ]);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255|unique:departments,name,'.$department->id,
                'description' => 'nullable|string',
            ]);

            $department->update($validated);

            $conversation = $department->conversation()->first();
            if ($conversation && $department->wasChanged('name')) {
                $conversation->name = $department->name;
                $conversation->save();
            }

            return response()->json([
                'message' => 'Departamento actualizado exitosamente.',
                'data' => $department,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación.',
                'errors' => $e->errors(),
            ], 422);
        }
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
