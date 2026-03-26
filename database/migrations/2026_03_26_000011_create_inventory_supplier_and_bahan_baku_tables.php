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
        Schema::create('inventory_supplier', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 120);
            $table->string('kontak_pic', 120)->nullable();
            $table->string('telepon', 30)->nullable();
            $table->string('email', 120)->nullable();
            $table->text('alamat')->nullable();
            $table->text('keterangan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('is_active');
        });

        Schema::create('inventory_bahan_baku', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 150);
            $table->string('satuan', 30);
            $table->decimal('harga_beli_terakhir', 14, 2)->default(0);
            $table->decimal('stok_minimum', 14, 3)->default(0);
            $table->decimal('stok_saat_ini', 14, 3)->default(0);
            $table->text('keterangan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Sesuai PRD: relasi dikelola di level Eloquent, tanpa FK constraint.
            $table->index('supplier_id');
            $table->index('nama');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_bahan_baku');
        Schema::dropIfExists('inventory_supplier');
    }
};
