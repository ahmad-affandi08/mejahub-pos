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
        Schema::create('varian_menu', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('data_menu_id');
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 120);
            $table->text('deskripsi')->nullable();
            $table->decimal('harga_tambahan', 14, 2)->default(0);
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('data_menu_id');
            $table->index('nama');
            $table->index('is_active');
        });

        Schema::create('modifier_menu', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 120);
            $table->text('deskripsi')->nullable();
            $table->string('tipe', 20)->default('multiple');
            $table->unsignedInteger('min_pilih')->default(0);
            $table->unsignedInteger('max_pilih')->default(1);
            $table->longText('opsi_json')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('is_active');
            $table->index('tipe');
        });

        Schema::create('paket_menu', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kategori_menu_id')->nullable();
            $table->string('kode', 30)->nullable()->unique();
            $table->string('nama', 150);
            $table->text('deskripsi')->nullable();
            $table->decimal('harga_paket', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('kategori_menu_id');
            $table->index('nama');
            $table->index('is_active');
        });

        Schema::create('paket_menu_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('paket_menu_id');
            $table->unsignedBigInteger('data_menu_id');
            $table->decimal('qty', 10, 2)->default(1);
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();

            $table->index('paket_menu_id');
            $table->index('data_menu_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paket_menu_item');
        Schema::dropIfExists('paket_menu');
        Schema::dropIfExists('modifier_menu');
        Schema::dropIfExists('varian_menu');
    }
};
