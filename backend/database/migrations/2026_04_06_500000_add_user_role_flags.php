<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'es_lider')) {
                $table->boolean('es_lider')->default(false)->after('department_id');
            }
            if (! Schema::hasColumn('users', 'onboarding_pendiente')) {
                $table->boolean('onboarding_pendiente')->default(true)->after('es_lider');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumnIfExists('onboarding_pendiente');
            $table->dropColumnIfExists('es_lider');
        });
    }
};
