<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('department_user', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('department_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unique(['user_id', 'department_id']);

        });

        // Los usuarios solo podían pertenecer a un departamento (users.department_id).
        // Se migran al pivote para que la pertenencia multiple no dependa de ese caso.
        DB::table('users')
            ->whereNotNull('department_id')
            ->orderBy('id')
            ->each(function (object $user): void {
                DB::table('department_user')->insertOrIgnore([
                    'user_id' => $user->id,
                    'department_id' => $user->department_id,
                ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_user');
    }
};
