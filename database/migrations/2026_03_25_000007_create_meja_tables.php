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
        Schema::create('area_meja', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 120);
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('is_active');
        });

        Schema::create('data_meja', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('area_meja_id');
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 120);
            $table->string('nomor_meja', 30)->nullable();
            $table->unsignedInteger('kapasitas')->default(1);
            $table->string('status', 20)->default('tersedia');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('area_meja_id');
            $table->index('nama');
            $table->index('status');
            $table->index('is_active');
        });

        Schema::create('reservasi_meja', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('data_meja_id');
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama_pelanggan', 120);
            $table->string('no_hp', 30)->nullable();
            $table->dateTime('waktu_reservasi');
            $table->unsignedInteger('jumlah_tamu')->default(1);
            $table->string('status', 20)->default('pending');
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('data_meja_id');
            $table->index('nama_pelanggan');
            $table->index('status');
            $table->index('waktu_reservasi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservasi_meja');
        Schema::dropIfExists('data_meja');
        Schema::dropIfExists('area_meja');
    }
};
