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
        Schema::table('inventory_penerimaan_barang', function (Blueprint $table) {
            $table->string('status_pembayaran', 20)->default('unpaid')->after('status');
            $table->string('metode_pembayaran', 40)->nullable()->after('status_pembayaran');
            $table->unsignedBigInteger('akun_kas_id')->nullable()->after('metode_pembayaran');
            $table->date('jatuh_tempo')->nullable()->after('tanggal_terima');
            
            $table->index('status_pembayaran');
            $table->index('akun_kas_id');
        });

        Schema::create('finance_hutang', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->unique();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->string('sumber_tipe', 40)->default('penerimaan_barang');
            $table->unsignedBigInteger('sumber_id');
            $table->date('tanggal_hutang');
            $table->date('jatuh_tempo')->nullable();
            $table->decimal('nominal_hutang', 14, 2)->default(0);
            $table->decimal('sisa_hutang', 14, 2)->default(0);
            $table->string('status', 20)->default('unpaid'); // unpaid, partial, paid
            $table->text('catatan')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Index without explicit constrained() FK
            $table->index('supplier_id');
            $table->index(['sumber_tipe', 'sumber_id']);
            $table->index('status');
            $table->index('jatuh_tempo');
        });

        Schema::create('finance_pembayaran_hutang', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 40)->unique();
            $table->unsignedBigInteger('hutang_id');
            $table->date('tanggal_bayar');
            $table->decimal('nominal_bayar', 14, 2)->default(0);
            $table->string('metode_pembayaran', 40)->default('kas');
            $table->unsignedBigInteger('akun_kas_id')->nullable();
            $table->string('referensi', 80)->nullable();
            $table->text('catatan')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('hutang_id');
            $table->index('tanggal_bayar');
            $table->index('akun_kas_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_pembayaran_hutang');
        Schema::dropIfExists('finance_hutang');

        Schema::table('inventory_penerimaan_barang', function (Blueprint $table) {
            $table->dropIndex(['status_pembayaran']);
            $table->dropIndex(['akun_kas_id']);
            $table->dropColumn([
                'status_pembayaran',
                'metode_pembayaran',
                'akun_kas_id',
                'jatuh_tempo'
            ]);
        });
    }
};
