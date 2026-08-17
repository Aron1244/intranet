<?php

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $adminRole = Role::query()->firstOrCreate([
            'name' => 'Admin',
        ]);

        $adminUser = User::query()->updateOrCreate(
            ['email' => 'postman.admin@test.local'],
            [
                'name' => 'Postman Admin',
                'password' => Hash::make('Admin123!'),
            ]
        );
        $adminUser->roles()->sync([$adminRole->id]);

        $employeeRole = Role::query()->firstOrCreate([
            'name' => 'Employee',
        ]);

        $employeeUser = User::query()->updateOrCreate(
            ['email' => 'postman.user@test.local'],
            [
                'name' => 'Postman User',
                'password' => Hash::make('User123!'),
            ]
        );
        $employeeUser->roles()->sync([$employeeRole->id]);

        $department = Department::query()->firstOrCreate(
            ['name' => 'IT'],
            ['description' => 'IT section']
        );

        $ctoRole = Role::query()->firstOrCreate([
            'name' => 'CTO',
        ]);

        $ctoUser = User::query()->updateOrCreate(
            ['email' => 'cto@test.local'],
            [
                'name' => 'CTO User',
                'password' => Hash::make('Admin123!'),
                'department_id' => $department->id,
            ]
        );
        $ctoUser->roles()->sync([$ctoRole->id]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $emails = [
            'postman.admin@test.local',
            'postman.user@test.local',
            'cto@test.local',
        ];

        $users = User::query()->whereIn('email', $emails)->get();

        foreach ($users as $user) {
            $user->roles()->detach();
            $user->delete();
        }
    }
};
