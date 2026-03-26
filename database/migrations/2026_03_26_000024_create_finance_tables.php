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
        Schema::create('finance_arus_kas', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->string('jenis_akun', 20)->default('kas');
            $table->string('jenis_arus', 10)->default('in');
            $table->string('sumber_tipe', 40)->default('manual');
            $table->unsignedBigInteger('sumber_id')->nullable();
            $table->string('referensi_kode', 80)->nullable();
            $table->string('kategori', 80)->nullable();
            $table->string('deskripsi', 255);
            $table->decimal('nominal', 14, 2)->default(0);
            $table->string('status', 20)->default('posted');
            $table->string('rekonsiliasi_status', 20)->default('unreconciled');
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tanggal');
            $table->index('jenis_akun');
            $table->index('jenis_arus');
            $table->index('sumber_tipe');
            $table->index(['sumber_tipe', 'sumber_id']);
            $table->index('status');
            $table->index('is_system');
            $table->index('is_active');
        });

        Schema::create('finance_pengeluaran', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->unique();
            $table->date('tanggal');
            $table->string('kategori_biaya', 80);
            $table->string('metode_pembayaran', 20)->default('kas');
            $table->decimal('nominal', 14, 2)->default(0);
            $table->string('status_approval', 20)->default('draft');
            $table->string('deskripsi', 255);
            $table->string('vendor_nama', 120)->nullable();
            $table->string('nomor_bukti', 80)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('catatan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('tanggal');
            $table->index('kategori_biaya');
            $table->index('metode_pembayaran');
            $table->index('status_approval');
            $table->index('is_active');
        });

        Schema::create('finance_petty_cash', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->unique();
            $table->date('tanggal');
            $table->string('jenis_transaksi', 30)->default('pengisian');
            $table->string('jenis_arus', 10)->default('in');
            $table->decimal('nominal', 14, 2)->default(0);
            $table->decimal('saldo_setelah', 14, 2)->default(0);
            $table->string('status_approval', 20)->default('draft');
            $table->string('deskripsi', 255);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('catatan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('tanggal');
            $table->index('jenis_transaksi');
            $table->index('jenis_arus');
            $table->index('status_approval');
            $table->index('is_active');
        });

        Schema::create('finance_rekonsiliasi', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->string('jenis_akun', 20)->default('kas');
            $table->decimal('saldo_sistem', 14, 2)->default(0);
            $table->decimal('saldo_aktual', 14, 2)->default(0);
            $table->decimal('selisih', 14, 2)->default(0);
            $table->string('status', 20)->default('match');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tanggal');
            $table->index('jenis_akun');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_rekonsiliasi');
        Schema::dropIfExists('finance_petty_cash');
        Schema::dropIfExists('finance_pengeluaran');
        Schema::dropIfExists('finance_arus_kas');
    }
};
