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
        Schema::create('inventory_opname_stok', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bahan_baku_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->date('tanggal_opname')->nullable();
            $table->decimal('stok_sistem', 14, 3)->default(0);
            $table->decimal('stok_fisik', 14, 3)->default(0);
            $table->decimal('selisih', 14, 3)->default(0);
            $table->text('alasan')->nullable();
            $table->string('status', 30)->default('posted');
            $table->timestamps();
            $table->softDeletes();

            $table->index('bahan_baku_id');
            $table->index('user_id');
            $table->index('tanggal_opname');
            $table->index('status');
        });

        Schema::create('inventory_transfer_stok', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bahan_baku_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->date('tanggal_transfer')->nullable();
            $table->string('lokasi_asal', 100);
            $table->string('lokasi_tujuan', 100);
            $table->decimal('qty_transfer', 14, 3)->default(0);
            $table->text('catatan')->nullable();
            $table->string('status', 30)->default('posted');
            $table->timestamps();
            $table->softDeletes();

            $table->index('bahan_baku_id');
            $table->index('user_id');
            $table->index('tanggal_transfer');
            $table->index('status');
        });

        Schema::create('inventory_manajemen_waste', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bahan_baku_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->date('tanggal_waste')->nullable();
            $table->decimal('stok_sebelum', 14, 3)->default(0);
            $table->decimal('qty_waste', 14, 3)->default(0);
            $table->decimal('stok_setelah', 14, 3)->default(0);
            $table->string('kategori_waste', 50)->nullable();
            $table->text('alasan')->nullable();
            $table->string('status', 30)->default('posted');
            $table->timestamps();
            $table->softDeletes();

            $table->index('bahan_baku_id');
            $table->index('user_id');
            $table->index('tanggal_waste');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_manajemen_waste');
        Schema::dropIfExists('inventory_transfer_stok');
        Schema::dropIfExists('inventory_opname_stok');
    }
};
