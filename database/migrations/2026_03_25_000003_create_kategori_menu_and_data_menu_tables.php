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
        Schema::create('kategori_menu', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 120);
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('is_active');
        });

        Schema::create('data_menu', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kategori_menu_id');
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 150);
            $table->text('deskripsi')->nullable();
            $table->decimal('harga', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('gambar')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Relasi hanya pada level kode Eloquent, bukan FK constraint migration.
            $table->index('kategori_menu_id');
            $table->index('nama');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_menu');
        Schema::dropIfExists('kategori_menu');
    }
};
