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
        Schema::create('settings_profil_toko', function (Blueprint $table) {
            $table->id();
            $table->string('kode_toko', 40)->nullable()->unique();
            $table->string('nama_toko', 150);
            $table->string('nama_brand', 150)->nullable();
            $table->string('email', 120)->nullable();
            $table->string('telepon', 30)->nullable();
            $table->text('alamat')->nullable();
            $table->string('kota', 100)->nullable();
            $table->string('provinsi', 100)->nullable();
            $table->string('kode_pos', 10)->nullable();
            $table->string('npwp', 40)->nullable();
            $table->string('logo_path', 255)->nullable();
            $table->string('timezone', 80)->default('Asia/Jakarta');
            $table->string('mata_uang', 10)->default('IDR');
            $table->string('bahasa', 10)->default('id');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama_toko');
            $table->index('is_default');
            $table->index('is_active');
        });

        Schema::create('settings_metode_pembayaran', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama', 100);
            $table->string('tipe', 30);
            $table->string('provider', 100)->nullable();
            $table->string('nomor_rekening', 80)->nullable();
            $table->string('atas_nama', 100)->nullable();
            $table->decimal('biaya_persen', 8, 2)->default(0);
            $table->decimal('biaya_flat', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->boolean('requires_reference')->default(false);
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('tipe');
            $table->index('is_active');
            $table->index('is_default');
            $table->index('urutan');
        });

        Schema::create('settings_konfigurasi_pajak', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama', 100);
            $table->string('jenis', 20);
            $table->decimal('nilai', 12, 2)->default(0);
            $table->string('applies_to', 30)->default('all');
            $table->boolean('is_inclusive')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('urutan')->default(0);
            $table->text('keterangan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('jenis');
            $table->index('applies_to');
            $table->index('is_active');
            $table->index('is_default');
            $table->index('urutan');
        });

        Schema::create('settings_printer_silent', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama', 120);
            $table->string('tipe_printer', 30);
            $table->string('connection_type', 30);
            $table->string('ip_address', 60)->nullable();
            $table->unsignedInteger('port')->nullable();
            $table->string('device_name', 120)->nullable();
            $table->string('paper_size', 20)->default('80mm');
            $table->unsignedTinyInteger('copies')->default(1);
            $table->boolean('auto_print_order')->default(true);
            $table->boolean('auto_print_payment')->default(true);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->text('keterangan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('nama');
            $table->index('tipe_printer');
            $table->index('connection_type');
            $table->index('is_active');
            $table->index('is_default');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings_printer_silent');
        Schema::dropIfExists('settings_konfigurasi_pajak');
        Schema::dropIfExists('settings_metode_pembayaran');
        Schema::dropIfExists('settings_profil_toko');
    }
};
