<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncUserRolesRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserRoleController extends Controller
{
    public function index(User $user): JsonResponse
    {
        $user->load('roles:id,name,can_post_announcements,can_manage_department,department_id');

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'roles' => $user->roles,
            ],
        ]);
    }

    public function update(SyncUserRolesRequest $request, User $user): JsonResponse
    {
        $roleIds = $request->validated('role_ids') ?? [];

        $validatedRoleIds = Role::query()
            ->whereIn('id', $roleIds)
            ->pluck('id')
            ->all();

        $currentRoleIds = $user->roles()->pluck('roles.id')->all();

        $toAttach = array_values(array_diff($validatedRoleIds, $currentRoleIds));
        $toDetach = array_values(array_diff($currentRoleIds, $validatedRoleIds));

        if (! empty($toAttach)) {
            $user->roles()->attach($toAttach);
        }
        if (! empty($toDetach)) {
            $user->roles()->detach($toDetach);
        }

        $user->load('roles:id,name,can_post_announcements,can_manage_department,department_id');

        return response()->json([
            'message' => 'User roles updated successfully.',
            'data' => [
                'user_id' => $user->id,
                'roles' => $user->roles,
            ],
        ]);
    }
}
