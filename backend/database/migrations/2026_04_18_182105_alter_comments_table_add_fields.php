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
            if (!Schema::hasColumn('comments', 'user_id')) {
                $table->unsignedBigInteger('user_id')->after('id');
            }
            if (!Schema::hasColumn('comments', 'announcement_id')) {
                $table->unsignedBigInteger('announcement_id')->after('user_id');
            }
            if (!Schema::hasColumn('comments', 'content')) {
                $table->text('content')->after('announcement_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumnIfExists('announcement_id');
            $table->dropColumnIfExists('user_id');
            $table->dropColumnIfExists('content');
        });
    }
};
