<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_import_penjualan', function (Blueprint $table) {
            $table->string('sync_status', 20)->default('pending')->after('is_active');
            $table->timestamp('synced_at')->nullable()->after('sync_status');
            $table->text('sync_error')->nullable()->after('synced_at');
            $table->unsignedBigInteger('pos_pesanan_id')->nullable()->after('sync_error');
            $table->unsignedBigInteger('pos_pembayaran_id')->nullable()->after('pos_pesanan_id');

            $table->index('sync_status');
            $table->index('synced_at');
            $table->index('pos_pesanan_id');
            $table->index('pos_pembayaran_id');
            $table->index(['import_batch_code', 'sync_status']);
        });

        Schema::table('pos_pembayaran', function (Blueprint $table) {
            $table->string('external_sync_key', 80)->nullable()->unique()->after('kode');
            $table->string('source_channel', 30)->default('pos')->after('external_sync_key');

            $table->index('source_channel');
        });
    }

    public function down(): void
    {
        Schema::table('pos_pembayaran', function (Blueprint $table) {
            $table->dropIndex(['source_channel']);
            $table->dropUnique('pos_pembayaran_external_sync_key_unique');
            $table->dropColumn(['external_sync_key', 'source_channel']);
        });

        Schema::table('report_import_penjualan', function (Blueprint $table) {
            $table->dropIndex(['sync_status']);
            $table->dropIndex(['synced_at']);
            $table->dropIndex(['pos_pesanan_id']);
            $table->dropIndex(['pos_pembayaran_id']);
            $table->dropIndex(['import_batch_code', 'sync_status']);
            $table->dropColumn(['sync_status', 'synced_at', 'sync_error', 'pos_pesanan_id', 'pos_pembayaran_id']);
        });
    }
};
