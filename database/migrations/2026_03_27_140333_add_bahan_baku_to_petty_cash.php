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
        Schema::table('finance_petty_cash', function (Blueprint $table) {
            $table->unsignedBigInteger('bahan_baku_id')->nullable()->after('deskripsi');
            $table->decimal('qty_bahan', 12, 3)->nullable()->after('bahan_baku_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_petty_cash', function (Blueprint $table) {
            $table->dropColumn(['bahan_baku_id', 'qty_bahan']);
        });
    }
};
