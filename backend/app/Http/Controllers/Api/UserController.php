<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(
            User::query()->with('departments:id,name,color')->latest()->get()
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): UserResource
    {
        $validated = $request->validated();
        $departmentIds = $validated['department_ids'] ?? [];
        unset($validated['department_ids']);

        $user = User::create($validated);
        $user->syncDepartments($departmentIds);

        DepartmentController::syncUserWithDepartmentConversations($user);

        return new UserResource($user->refresh()->load('departments:id,name,color'));
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): UserResource
    {
        return new UserResource($user->load('departments:id,name,color'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $validated = $request->validated();
        $departmentIds = $validated['department_ids'] ?? null;
        unset($validated['department_ids']);

        $user->update($validated);

        if ($departmentIds !== null) {
            $user->syncDepartments($departmentIds);

            DepartmentController::syncUserWithDepartmentConversations($user);
        }

        return new UserResource($user->refresh()->load('departments:id,name,color'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(null, 204);
    }

    /**
     * List users eligible to start a conversation with the authenticated user.
     *
     * Admin: every user except themselves.
     * Non-admin: only users sharing at least one of their departments.
     */
    public function chatPartners(Request $request): AnonymousResourceCollection
    {
        $currentUser = $request->user();
        $isAdmin = $currentUser->isAdministrator();

        $query = User::query()
            ->with('departments:id,name,color')
            ->where('id', '!=', $currentUser->id);

        if (! $isAdmin) {
            $departmentIds = $currentUser->departmentIds();

            $query->where(function ($subQuery) use ($departmentIds): void {
                if ($departmentIds === []) {
                    $subQuery->whereNull('department_id');

                    return;
                }

                $subQuery->whereHas('departments', function ($departmentQuery) use ($departmentIds): void {
                    $departmentQuery->whereIn('departments.id', $departmentIds);
                });
            });
        }

        return UserResource::collection(
            $query->orderBy('name')->get()
        );
    }
}
