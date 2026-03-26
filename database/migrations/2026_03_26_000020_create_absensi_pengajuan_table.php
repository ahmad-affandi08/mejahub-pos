<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('absensi_pengajuan', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->nullable()->unique();
            $table->unsignedBigInteger('pegawai_id')->nullable();
            $table->string('jenis_pengajuan', 20); // izin, cuti, tukar_shift
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->unsignedBigInteger('pegawai_tujuan_id')->nullable();
            $table->unsignedBigInteger('jadwal_shift_id')->nullable();
            $table->unsignedBigInteger('jadwal_shift_tujuan_id')->nullable();
            $table->text('alasan')->nullable();
            $table->string('lampiran', 255)->nullable();
            $table->string('status', 20)->default('pending');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('pegawai_id');
            $table->index('jenis_pengajuan');
            $table->index('tanggal_mulai');
            $table->index('status');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absensi_pengajuan');
    }
};
