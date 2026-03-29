<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_bahan_baku', function (Blueprint $table) {
            $table->string('satuan_kecil', 30)->nullable()->after('satuan');
            $table->string('satuan_besar', 30)->nullable()->after('satuan_kecil');
            $table->decimal('konversi_besar_ke_kecil', 14, 3)->default(1)->after('satuan_besar');
            $table->string('default_satuan_beli', 30)->nullable()->after('konversi_besar_ke_kecil');
        });

        DB::table('inventory_bahan_baku')->whereNull('satuan_kecil')->update([
            'satuan_kecil' => DB::raw('satuan'),
            'default_satuan_beli' => DB::raw('satuan'),
        ]);

        Schema::table('inventory_purchase_order_item', function (Blueprint $table) {
            $table->decimal('qty_input', 14, 3)->default(0)->after('qty_pesan');
            $table->string('satuan_input', 30)->nullable()->after('qty_input');
            $table->decimal('konversi_ke_kecil', 14, 3)->default(1)->after('satuan_input');
        });

        DB::table('inventory_purchase_order_item')->update([
            'qty_input' => DB::raw('qty_pesan'),
            'konversi_ke_kecil' => 1,
        ]);

        Schema::table('inventory_penerimaan_barang_item', function (Blueprint $table) {
            $table->decimal('qty_input', 14, 3)->default(0)->after('qty_diterima');
            $table->string('satuan_input', 30)->nullable()->after('qty_input');
            $table->decimal('konversi_ke_kecil', 14, 3)->default(1)->after('satuan_input');
        });

        DB::table('inventory_penerimaan_barang_item')->update([
            'qty_input' => DB::raw('qty_diterima'),
            'konversi_ke_kecil' => 1,
        ]);
    }

    public function down(): void
    {
        Schema::table('inventory_penerimaan_barang_item', function (Blueprint $table) {
            $table->dropColumn(['qty_input', 'satuan_input', 'konversi_ke_kecil']);
        });

        Schema::table('inventory_purchase_order_item', function (Blueprint $table) {
            $table->dropColumn(['qty_input', 'satuan_input', 'konversi_ke_kecil']);
        });

        Schema::table('inventory_bahan_baku', function (Blueprint $table) {
            $table->dropColumn(['satuan_kecil', 'satuan_besar', 'konversi_besar_ke_kecil', 'default_satuan_beli']);
        });
    }
};
