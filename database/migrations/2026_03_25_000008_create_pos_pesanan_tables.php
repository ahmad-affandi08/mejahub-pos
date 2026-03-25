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
        Schema::create('pos_pesanan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('data_meja_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->string('nama_pelanggan', 120)->nullable();
            $table->string('status', 20)->default('draft');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('diskon', 14, 2)->default(0);
            $table->decimal('pajak', 14, 2)->default(0);
            $table->decimal('service_charge', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamp('waktu_pesan')->nullable();
            $table->timestamp('waktu_bayar')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('data_meja_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('waktu_pesan');
        });

        Schema::create('pos_pesanan_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pesanan_id');
            $table->unsignedBigInteger('data_menu_id');
            $table->string('nama_menu', 150);
            $table->decimal('harga_satuan', 14, 2)->default(0);
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('pesanan_id');
            $table->index('data_menu_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_pesanan_item');
        Schema::dropIfExists('pos_pesanan');
    }
};
