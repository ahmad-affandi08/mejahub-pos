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
        Schema::create('absensi', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->nullable()->unique();
            $table->unsignedBigInteger('pegawai_id')->nullable();
            $table->date('tanggal');
            $table->time('jam_masuk')->nullable();
            $table->time('jam_keluar')->nullable();
            $table->string('status', 20)->default('hadir');
            $table->text('keterangan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('pegawai_id');
            $table->index('tanggal');
            $table->index('status');
            $table->index('is_active');
        });

        Schema::create('komisi', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->nullable()->unique();
            $table->unsignedBigInteger('pegawai_id')->nullable();
            $table->string('periode', 7);
            $table->decimal('dasar_perhitungan', 14, 2)->default(0);
            $table->decimal('persentase', 7, 2)->default(0);
            $table->decimal('nominal', 14, 2)->default(0);
            $table->string('status', 20)->default('draft');
            $table->text('catatan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('pegawai_id');
            $table->index('periode');
            $table->index('status');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('komisi');
        Schema::dropIfExists('absensi');
    }
};
