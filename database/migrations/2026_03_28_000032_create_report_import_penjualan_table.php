<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_import_penjualan', function (Blueprint $table) {
            $table->id();
            $table->string('import_batch_code', 60)->index();
            $table->string('source_filename', 255)->nullable();
            $table->string('source_extension', 12)->nullable();
            $table->unsignedInteger('row_number')->nullable();

            $table->string('no_transaksi', 80)->nullable()->index();
            $table->dateTime('waktu_order')->nullable();
            $table->dateTime('waktu_bayar')->nullable();
            $table->date('tanggal_transaksi')->nullable()->index();

            $table->string('outlet', 160)->nullable();
            $table->text('produk')->nullable();
            $table->string('jenis_order', 80)->nullable();
            $table->decimal('sisa_tagihan', 15, 2)->default(0);
            $table->decimal('total_penjualan', 15, 2)->default(0);
            $table->string('metode_pembayaran', 160)->nullable();
            $table->string('bayar', 160)->nullable();
            $table->string('nama_order', 160)->nullable();

            $table->json('raw_row')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['import_batch_code', 'row_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_import_penjualan');
    }
};
