<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Una publicación general no pertenece a ningun departamento: department_id
     * queda en null y la ven todos. Antes se resolvia creando una copia de la
     * publicacion por cada departamento.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table): void {
            $table->foreignId('department_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table): void {
            $table->foreignId('department_id')->nullable(false)->change();
        });
    }
};
