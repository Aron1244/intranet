<?php

use App\Models\Conversation;
use App\Models\Department;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Backfill: ensure every existing department has a group chat
        // and that every current member is attached to it.
        $departments = Department::query()->get();

        foreach ($departments as $department) {
            $conversation = Conversation::query()
                ->where('department_id', $department->id)
                ->first();

            if ($conversation === null) {
                $conversation = Conversation::create([
                    'name' => $department->name,
                    'type' => 'group',
                    'department_id' => $department->id,
                ]);
            }

            $userIds = DB::table('users')
                ->where('department_id', $department->id)
                ->pluck('id')
                ->all();

            if (! empty($userIds)) {
                $conversation->users()->syncWithoutDetaching($userIds);
            }
        }
    }

    public function down(): void
    {
        // No-op: removing the column is handled by the previous migration.
    }
};
