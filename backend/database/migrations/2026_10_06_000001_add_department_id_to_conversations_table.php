<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table): void {
            $table->foreignId('department_id')
                ->nullable()
                ->after('type')
                ->constrained('departments')
                ->nullOnDelete();

            $table->unique('department_id');
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropUnique(['department_id']);
            $table->dropConstrainedForeignId('department_id');
        });
    }
};
