<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->foreignId('department_folder_id')
                ->nullable()
                ->after('user_id')
                ->constrained('department_folders')
                ->nullOnDelete();

            $table->string('original_name')->nullable()->after('file_path');
            $table->string('mime_type')->nullable()->after('original_name');
            $table->unsignedBigInteger('size_bytes')->nullable()->after('mime_type');

            $table->index('department_folder_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->dropIndex(['department_folder_id']);
            $table->dropConstrainedForeignId('department_folder_id');
            $table->dropColumn(['original_name', 'mime_type', 'size_bytes']);
        });
    }
};
