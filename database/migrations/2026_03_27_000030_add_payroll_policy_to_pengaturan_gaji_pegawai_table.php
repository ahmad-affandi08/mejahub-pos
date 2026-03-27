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
        Schema::table('pengaturan_gaji_pegawai', function (Blueprint $table) {
            $table->json('kebijakan_penggajian')->nullable()->after('gaji_pokok');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengaturan_gaji_pegawai', function (Blueprint $table) {
            $table->dropColumn('kebijakan_penggajian');
        });
    }
};
