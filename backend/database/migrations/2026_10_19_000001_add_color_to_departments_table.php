<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table): void {
            // Color de identificacion visual (hex #RRGGBB). Nulo significa que
            // el departamento todavia no tiene color propio y la interfaz usa
            // uno por defecto derivado de su id.
            $table->string('color', 7)
                ->nullable()
                ->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table): void {
            $table->dropColumn('color');
        });
    }
};
