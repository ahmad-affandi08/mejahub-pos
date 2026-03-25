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
        Schema::create('pos_shift', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->string('status', 20)->default('open');
            $table->decimal('kas_awal', 14, 2)->default(0);
            $table->decimal('kas_aktual', 14, 2)->nullable();
            $table->decimal('kas_sistem', 14, 2)->nullable();
            $table->decimal('selisih', 14, 2)->nullable();
            $table->unsignedInteger('jumlah_transaksi')->default(0);
            $table->text('catatan_buka')->nullable();
            $table->text('catatan_tutup')->nullable();
            $table->timestamp('waktu_buka')->nullable();
            $table->timestamp('waktu_tutup')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('status');
            $table->index('waktu_buka');
            $table->index('waktu_tutup');
        });

        Schema::create('pos_pembayaran', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pesanan_id');
            $table->unsignedBigInteger('shift_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->string('metode_bayar', 30)->default('cash');
            $table->decimal('nominal_tagihan', 14, 2)->default(0);
            $table->decimal('nominal_dibayar', 14, 2)->default(0);
            $table->decimal('kembalian', 14, 2)->default(0);
            $table->string('status', 20)->default('paid');
            $table->text('catatan')->nullable();
            $table->timestamp('waktu_bayar')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('pesanan_id');
            $table->index('shift_id');
            $table->index('user_id');
            $table->index('metode_bayar');
            $table->index('status');
            $table->index('waktu_bayar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_pembayaran');
        Schema::dropIfExists('pos_shift');
    }
};
