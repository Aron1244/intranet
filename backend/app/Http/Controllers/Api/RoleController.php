<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Department;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Schema;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $query = Role::query()->orderBy('name');
        
        // Load department relation if the column exists
        if (Schema::hasColumn('roles', 'department_id')) {
            $query->with('department')->orderBy('department_id');
        }
        
        return RoleResource::collection($query->get());
    }

    /**
     * Get roles for a specific department
     */
    public function byDepartment(Department $department): AnonymousResourceCollection
    {
        // Check if department_id column exists
        if (!Schema::hasColumn('roles', 'department_id')) {
            // Return empty collection if migration hasn't run
            return RoleResource::collection(collect());
        }

        return RoleResource::collection(
            Role::query()
                ->where('department_id', $department->id)
                ->orderBy('name')
                ->get()
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRoleRequest $request): RoleResource
    {
        $role = Role::create($request->validated());

        if (Schema::hasColumn('roles', 'department_id')) {
            $role->load('department');
        }

        return new RoleResource($role);
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role): RoleResource
    {
        if (Schema::hasColumn('roles', 'department_id')) {
            $role->load('department');
        }

        return new RoleResource($role);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRoleRequest $request, Role $role): RoleResource
    {
        $role->update($request->validated());

        if (Schema::hasColumn('roles', 'department_id')) {
            $role->load('department')->refresh();
        }

        return new RoleResource($role->refresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role): JsonResponse
    {
        $role->delete();

        return response()->json(null, 204);
    }
}