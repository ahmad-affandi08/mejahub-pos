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
        Schema::create('hak_akses', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 50)->unique();
            $table->string('nama', 120);
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index('nama');
        });

        Schema::create('hak_akses_permission', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hak_akses_id');
            $table->string('permission_key', 120);
            $table->timestamps();

            // No FK constraint by project policy; relation is handled in Eloquent.
            $table->index('hak_akses_id');
            $table->index('permission_key');
            $table->unique(['hak_akses_id', 'permission_key']);
        });

        Schema::create('user_hak_akses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('hak_akses_id');
            $table->timestamps();

            // No FK constraint by project policy; relation is handled in Eloquent.
            $table->index('user_id');
            $table->index('hak_akses_id');
            $table->unique(['user_id', 'hak_akses_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_hak_akses');
        Schema::dropIfExists('hak_akses_permission');
        Schema::dropIfExists('hak_akses');
    }
};
