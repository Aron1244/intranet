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
        return UserResource::collection(User::query()->latest()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): UserResource
    {
        $user = User::create($request->validated());

        return new UserResource($user);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user->update($request->validated());

        return new UserResource($user->refresh());
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
     * Non-admin: only users in the same department.
     */
    public function chatPartners(Request $request): AnonymousResourceCollection
    {
        $currentUser = $request->user();
        $isAdmin = $currentUser->roles()->where('name', 'admin')->exists();

        $query = User::query()->where('id', '!=', $currentUser->id);

        if (! $isAdmin) {
            $query->where('department_id', $currentUser->department_id);
        }

        return UserResource::collection(
            $query->orderBy('name')->get()
        );
    }
}
