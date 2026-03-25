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
        Schema::create('pos_split_bill', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pesanan_asal_id');
            $table->unsignedBigInteger('pesanan_baru_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamp('split_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('pesanan_asal_id');
            $table->index('pesanan_baru_id');
            $table->index('user_id');
            $table->index('split_at');
        });

        Schema::create('pos_split_bill_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('split_bill_id');
            $table->unsignedBigInteger('pesanan_item_asal_id');
            $table->unsignedInteger('qty_dipindah')->default(1);
            $table->timestamps();

            $table->index('split_bill_id');
            $table->index('pesanan_item_asal_id');
        });

        Schema::create('pos_gabung_meja', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pesanan_target_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamp('merged_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('pesanan_target_id');
            $table->index('user_id');
            $table->index('merged_at');
        });

        Schema::create('pos_gabung_meja_detail', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('gabung_meja_id');
            $table->unsignedBigInteger('pesanan_sumber_id');
            $table->timestamps();

            $table->index('gabung_meja_id');
            $table->index('pesanan_sumber_id');
        });

        Schema::create('pos_void_pesanan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pesanan_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->text('alasan');
            $table->string('status', 20)->default('voided');
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('pesanan_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('voided_at');
        });

        Schema::create('pos_refund_pesanan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pesanan_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->decimal('nominal', 14, 2)->default(0);
            $table->string('metode', 30)->default('cash');
            $table->text('alasan');
            $table->string('status', 20)->default('processed');
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('pesanan_id');
            $table->index('user_id');
            $table->index('metode');
            $table->index('status');
            $table->index('refunded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_refund_pesanan');
        Schema::dropIfExists('pos_void_pesanan');
        Schema::dropIfExists('pos_gabung_meja_detail');
        Schema::dropIfExists('pos_gabung_meja');
        Schema::dropIfExists('pos_split_bill_item');
        Schema::dropIfExists('pos_split_bill');
    }
};
