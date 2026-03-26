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
        Schema::create('inventory_purchase_order', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->date('tanggal_po')->nullable();
            $table->string('status', 30)->default('draft');
            $table->decimal('total', 14, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Sesuai PRD: tanpa FK constraint fisik di migration.
            $table->index('supplier_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('tanggal_po');
        });

        Schema::create('inventory_purchase_order_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_order_id');
            $table->unsignedBigInteger('bahan_baku_id');
            $table->decimal('qty_pesan', 14, 3)->default(0);
            $table->decimal('qty_diterima', 14, 3)->default(0);
            $table->decimal('harga_satuan', 14, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('purchase_order_id');
            $table->index('bahan_baku_id');
        });

        Schema::create('inventory_penerimaan_barang', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_order_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('kode', 40)->unique();
            $table->string('nomor_surat_jalan', 60)->nullable();
            $table->date('tanggal_terima')->nullable();
            $table->string('status', 30)->default('received');
            $table->decimal('total', 14, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('purchase_order_id');
            $table->index('supplier_id');
            $table->index('user_id');
            $table->index('tanggal_terima');
        });

        Schema::create('inventory_penerimaan_barang_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('penerimaan_barang_id');
            $table->unsignedBigInteger('purchase_order_item_id')->nullable();
            $table->unsignedBigInteger('bahan_baku_id');
            $table->decimal('qty_diterima', 14, 3)->default(0);
            $table->decimal('harga_satuan', 14, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('penerimaan_barang_id');
            $table->index('purchase_order_item_id');
            $table->index('bahan_baku_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_penerimaan_barang_item');
        Schema::dropIfExists('inventory_penerimaan_barang');
        Schema::dropIfExists('inventory_purchase_order_item');
        Schema::dropIfExists('inventory_purchase_order');
    }
};
