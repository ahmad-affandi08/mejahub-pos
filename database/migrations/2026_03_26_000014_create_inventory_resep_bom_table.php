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
        Schema::create('inventory_resep_bom', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('data_menu_id');
            $table->unsignedBigInteger('bahan_baku_id');
            $table->string('kode', 40)->nullable()->unique();
            $table->decimal('qty_kebutuhan', 14, 3)->default(0);
            $table->string('satuan', 30)->nullable();
            $table->decimal('referensi_porsi', 14, 3)->default(1);
            $table->text('catatan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Sesuai PRD: relasi hanya di level Eloquent.
            $table->index('data_menu_id');
            $table->index('bahan_baku_id');
            $table->index('is_active');
            $table->index(['data_menu_id', 'bahan_baku_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_resep_bom');
    }
};
