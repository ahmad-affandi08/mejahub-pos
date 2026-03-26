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
        Schema::create('inventory_mutasi_stok', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bahan_baku_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_code', 60)->nullable();
            $table->string('direction', 20)->nullable();
            $table->decimal('qty', 14, 3)->default(0);
            $table->decimal('stok_sebelum', 14, 3)->nullable();
            $table->decimal('stok_sesudah', 14, 3)->nullable();
            $table->decimal('nilai_satuan', 14, 2)->nullable();
            $table->decimal('nilai_total', 14, 2)->nullable();
            $table->string('lokasi_asal', 100)->nullable();
            $table->string('lokasi_tujuan', 100)->nullable();
            $table->text('catatan')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('bahan_baku_id');
            $table->index('user_id');
            $table->index('reference_type');
            $table->index('reference_id');
            $table->index('direction');
            $table->index('occurred_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_mutasi_stok');
    }
};
