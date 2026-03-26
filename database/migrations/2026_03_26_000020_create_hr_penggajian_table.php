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
        Schema::create('penggajian', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->nullable()->unique();
            $table->unsignedBigInteger('pegawai_id')->nullable();
            $table->string('periode', 7);
            $table->date('tanggal_pembayaran')->nullable();
            $table->decimal('gaji_pokok', 14, 2)->default(0);
            $table->decimal('tunjangan', 14, 2)->default(0);
            $table->decimal('lembur', 14, 2)->default(0);
            $table->decimal('bonus', 14, 2)->default(0);
            $table->decimal('potongan', 14, 2)->default(0);
            $table->decimal('total_gaji', 14, 2)->default(0);
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
        Schema::dropIfExists('penggajian');
    }
};
