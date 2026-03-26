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
        Schema::table('pos_pesanan', function (Blueprint $table) {
            $table->timestamp('bom_consumed_at')->nullable()->after('waktu_bayar');
            $table->index('bom_consumed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pos_pesanan', function (Blueprint $table) {
            $table->dropIndex(['bom_consumed_at']);
            $table->dropColumn('bom_consumed_at');
        });
    }
};
