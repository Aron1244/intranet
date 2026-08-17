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
        Schema::table('comments', function (Blueprint $table) {
            // Remove polymorphic index and columns if they exist
            if (Schema::hasColumn('comments', 'commentable_id')) {
                // Drop the morphs index if it exists
                try {
                    $table->dropIndex(['commentable_type', 'commentable_id']);
                } catch (\Exception $e) {
                    // Index might not exist
                }
                $table->dropColumn(['commentable_id', 'commentable_type']);
            }
            
            // Add foreign key to announcements if it doesn't exist
            if (!Schema::hasColumn('comments', 'announcement_id')) {
                $table->foreignId('announcement_id')
                    ->after('user_id')
                    ->constrained('announcements')
                    ->cascadeOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            if (Schema::hasColumn('comments', 'announcement_id')) {
                $table->dropForeign(['announcement_id']);
                $table->dropColumn('announcement_id');
            }
            
            // Recreate polymorphic columns
            if (!Schema::hasColumn('comments', 'commentable_id')) {
                $table->morphs('commentable');
            }
        });
    }
};
