<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncUserRolesRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserRoleController extends Controller
{
    public function index(User $user): JsonResponse
    {
        $user->load('roles:id,name');

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'roles' => $user->roles,
            ],
        ]);
    }

    public function update(SyncUserRolesRequest $request, User $user): JsonResponse
    {
        $user->roles()->sync($request->validated('role_ids'));
        $user->load('roles:id,name');

        return response()->json([
            'message' => 'User roles updated successfully.',
            'data' => [
                'user_id' => $user->id,
                'roles' => $user->roles,
            ],
        ]);
    }
}
