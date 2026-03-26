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
        Schema::create('pengaturan_shift', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->nullable()->unique();
            $table->string('nama', 120);
            $table->time('jam_masuk');
            $table->time('jam_keluar');
            $table->unsignedInteger('toleransi_telat_menit')->default(0);
            $table->unsignedInteger('toleransi_pulang_cepat_menit')->default(0);
            $table->boolean('lintas_hari')->default(false);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedInteger('radius_meter')->default(100);
            $table->boolean('require_face_verification')->default(false);
            $table->boolean('require_location_validation')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('is_active');
        });

        Schema::create('jadwal_shift', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->nullable()->unique();
            $table->unsignedBigInteger('pegawai_id')->nullable();
            $table->unsignedBigInteger('shift_id')->nullable();
            $table->date('tanggal');
            $table->string('status', 20)->default('published');
            $table->string('sumber_jadwal', 20)->default('manual');
            $table->text('catatan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('pegawai_id');
            $table->index('shift_id');
            $table->index('tanggal');
            $table->index('status');
            $table->index('is_active');
        });

        Schema::table('absensi', function (Blueprint $table) {
            $table->unsignedBigInteger('shift_id')->nullable()->after('pegawai_id');
            $table->unsignedBigInteger('jadwal_shift_id')->nullable()->after('shift_id');
            $table->string('jenis_absen', 20)->default('masuk')->after('tanggal');
            $table->string('metode_absen', 20)->default('manual')->after('status');
            $table->string('sumber_absen', 20)->default('web')->after('metode_absen');
            $table->string('foto_absen', 255)->nullable()->after('sumber_absen');
            $table->string('watermark_text', 255)->nullable()->after('foto_absen');
            $table->decimal('latitude', 10, 7)->nullable()->after('watermark_text');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('lokasi_absen', 255)->nullable()->after('longitude');
            $table->unsignedInteger('radius_meter')->nullable()->after('lokasi_absen');
            $table->boolean('dalam_radius')->nullable()->after('radius_meter');
            $table->decimal('skor_wajah', 5, 2)->nullable()->after('dalam_radius');
            $table->string('status_verifikasi_wajah', 20)->default('manual')->after('skor_wajah');

            $table->index('shift_id');
            $table->index('jadwal_shift_id');
            $table->index('jenis_absen');
            $table->index('sumber_absen');
            $table->index('status_verifikasi_wajah');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            $table->dropIndex(['shift_id']);
            $table->dropIndex(['jadwal_shift_id']);
            $table->dropIndex(['jenis_absen']);
            $table->dropIndex(['sumber_absen']);
            $table->dropIndex(['status_verifikasi_wajah']);

            $table->dropColumn([
                'shift_id',
                'jadwal_shift_id',
                'jenis_absen',
                'metode_absen',
                'sumber_absen',
                'foto_absen',
                'watermark_text',
                'latitude',
                'longitude',
                'lokasi_absen',
                'radius_meter',
                'dalam_radius',
                'skor_wajah',
                'status_verifikasi_wajah',
            ]);
        });

        Schema::dropIfExists('jadwal_shift');
        Schema::dropIfExists('pengaturan_shift');
    }
};
