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
        Schema::table('penggajian', function (Blueprint $table) {
            $table->unsignedInteger('jumlah_hadir')->default(0)->after('total_gaji');
            $table->unsignedInteger('jumlah_izin')->default(0)->after('jumlah_hadir');
            $table->unsignedInteger('jumlah_sakit')->default(0)->after('jumlah_izin');
            $table->unsignedInteger('jumlah_cuti')->default(0)->after('jumlah_sakit');
            $table->unsignedInteger('jumlah_alpha')->default(0)->after('jumlah_cuti');
            $table->unsignedInteger('jumlah_terlambat')->default(0)->after('jumlah_alpha');
            $table->boolean('generated_from_absensi')->default(false)->after('jumlah_terlambat');

            $table->index('generated_from_absensi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('penggajian', function (Blueprint $table) {
            $table->dropIndex(['generated_from_absensi']);
            $table->dropColumn([
                'jumlah_hadir',
                'jumlah_izin',
                'jumlah_sakit',
                'jumlah_cuti',
                'jumlah_alpha',
                'jumlah_terlambat',
                'generated_from_absensi',
            ]);
        });
    }
};
