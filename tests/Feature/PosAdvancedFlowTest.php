<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\POS\BukaShift\BukaShiftEntity;
use App\Modules\POS\Pembayaran\PembayaranEntity;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use App\Modules\POS\PesananMasuk\PesananMasukItemEntity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PosAdvancedFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_split_bill_moves_partial_item_and_creates_log(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();

        $order = $this->createOrder($menuId, $mejaId, 'submitted', 3, 15000);
        $item = $order->items()->firstOrFail();

        $response = $this->postJson('/pos/split-bill', [
            'pesanan_id' => $order->id,
            'items' => [
                ['pesanan_item_id' => $item->id, 'qty' => 1],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure(['success', 'message', 'data', 'meta', 'errors'])
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('pos_split_bill', 1);
        $this->assertDatabaseCount('pos_split_bill_item', 1);
        $this->assertDatabaseHas('pos_pesanan_item', [
            'id' => $item->id,
            'qty' => 2,
        ]);
    }

    public function test_gabung_meja_merges_source_order_to_target(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();

        $target = $this->createOrder($menuId, $mejaId, 'submitted', 1, 10000);
        $source = $this->createOrder($menuId, $mejaId, 'submitted', 2, 10000);

        $response = $this->postJson('/pos/gabung-meja', [
            'pesanan_target_id' => $target->id,
            'pesanan_sumber_ids' => [$source->id],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('pos_pesanan', [
            'id' => $source->id,
            'status' => 'merged',
        ]);
        $this->assertDatabaseCount('pos_gabung_meja', 1);
        $this->assertDatabaseCount('pos_gabung_meja_detail', 1);
    }

    public function test_void_paid_order_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'paid', 1, 8000);

        $response = $this->postJson('/pos/void-pesanan', [
            'pesanan_id' => $order->id,
            'alasan' => 'Sudah dibayar',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('pos_void_pesanan', 0);
    }

    public function test_void_submitted_order_creates_void_log(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'submitted', 1, 8000);

        $response = $this->postJson('/pos/void-pesanan', [
            'pesanan_id' => $order->id,
            'alasan' => 'Dibatalkan pelanggan',
        ]);

        $response->assertCreated()->assertJsonPath('success', true);

        $this->assertDatabaseHas('pos_pesanan', [
            'id' => $order->id,
            'status' => 'void',
        ]);
        $this->assertDatabaseCount('pos_void_pesanan', 1);
    }

    public function test_refund_cannot_exceed_order_total(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'paid', 1, 10000);

        $response = $this->postJson('/pos/refund-pesanan', [
            'pesanan_id' => $order->id,
            'nominal' => 12000,
            'metode' => 'cash',
            'alasan' => 'Input berlebih',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('pos_refund_pesanan', 0);
    }

    public function test_refund_full_order_marks_order_as_refunded(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'paid', 1, 10000);

        $response = $this->postJson('/pos/refund-pesanan', [
            'pesanan_id' => $order->id,
            'metode' => 'cash',
            'alasan' => 'Pesanan salah',
        ]);

        $response->assertCreated()->assertJsonPath('success', true);

        $this->assertDatabaseHas('pos_pesanan', [
            'id' => $order->id,
            'status' => 'refunded',
        ]);
        $this->assertDatabaseCount('pos_refund_pesanan', 1);
    }

    public function test_pembayaran_index_api_has_standard_envelope_and_recent_payments(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->getJson('/pos/pembayaran');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['pending_orders', 'active_shift', 'recent_payments'],
                'meta',
                'errors',
            ]);
    }

    public function test_tutup_shift_index_api_contains_summary_breakdown(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $shift = BukaShiftEntity::query()->create([
            'user_id' => $user->id,
            'kode' => 'SFT-TEST-001',
            'status' => 'open',
            'kas_awal' => 100000,
            'waktu_buka' => now(),
        ]);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'paid', 1, 20000);

        PembayaranEntity::query()->create([
            'pesanan_id' => $order->id,
            'shift_id' => $shift->id,
            'user_id' => $user->id,
            'kode' => 'PAY-TEST-001',
            'metode_bayar' => 'cash',
            'nominal_tagihan' => 20000,
            'nominal_dibayar' => 20000,
            'kembalian' => 0,
            'status' => 'paid',
            'waktu_bayar' => now(),
        ]);

        $response = $this->getJson('/pos/tutup-shift');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['active_shift', 'summary'],
                'meta',
                'errors',
            ])
            ->assertJsonPath('data.summary.cash_total', 20000);
    }

    public function test_pembayaran_show_returns_receipt_payload(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'paid', 1, 15000);

        $payment = PembayaranEntity::query()->create([
            'pesanan_id' => $order->id,
            'user_id' => $user->id,
            'kode' => 'PAY-TEST-SHOW-001',
            'metode_bayar' => 'cash',
            'nominal_tagihan' => 15000,
            'nominal_dibayar' => 20000,
            'kembalian' => 5000,
            'status' => 'paid',
            'waktu_bayar' => now(),
        ]);

        $response = $this->getJson('/pos/pembayaran/' . $payment->id);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['payment', 'receipt'],
                'meta',
                'errors',
            ]);
    }

    public function test_refund_show_returns_receipt_payload(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'paid', 1, 15000);

        $refundId = DB::table('pos_refund_pesanan')->insertGetId([
            'pesanan_id' => $order->id,
            'user_id' => $user->id,
            'kode' => 'REF-TEST-SHOW-001',
            'nominal' => 15000,
            'metode' => 'cash',
            'alasan' => 'Test show',
            'status' => 'processed',
            'refunded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/pos/refund-pesanan/' . $refundId);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['refund', 'receipt'],
                'meta',
                'errors',
            ]);
    }

    public function test_refund_index_api_returns_receipts_with_pagination_meta(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ['menu_id' => $menuId, 'meja_id' => $mejaId] = $this->seedMasterData();
        $order = $this->createOrder($menuId, $mejaId, 'paid', 1, 15000);

        DB::table('pos_refund_pesanan')->insert([
            'pesanan_id' => $order->id,
            'user_id' => $user->id,
            'kode' => 'REF-TEST-LIST-001',
            'nominal' => 15000,
            'metode' => 'cash',
            'alasan' => 'Test list',
            'status' => 'processed',
            'refunded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/pos/refund-pesanan?per_page=1&search=REF-TEST-LIST');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['orders', 'receipts', 'logs'],
                'meta' => ['filters', 'pagination'],
                'errors',
            ])
            ->assertJsonPath('meta.pagination.per_page', 1);
    }

    public function test_tutup_shift_index_api_returns_shift_reports_with_meta(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        BukaShiftEntity::query()->create([
            'user_id' => $user->id,
            'kode' => 'SFT-REPORT-001',
            'status' => 'closed',
            'kas_awal' => 100000,
            'kas_aktual' => 100000,
            'kas_sistem' => 100000,
            'selisih' => 0,
            'jumlah_transaksi' => 3,
            'catatan_tutup' => 'Shift normal',
            'waktu_buka' => now()->subHours(8),
            'waktu_tutup' => now(),
        ]);

        $response = $this->getJson('/pos/tutup-shift?per_page=1&search=SFT-REPORT');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['active_shift', 'summary', 'shift_reports'],
                'meta' => ['filters', 'pagination'],
                'errors',
            ])
            ->assertJsonPath('meta.pagination.per_page', 1);
    }

    private function seedMasterData(): array
    {
        $kategoriId = DB::table('kategori_menu')->insertGetId([
            'kode' => 'KAT-TEST',
            'nama' => 'Kategori Test',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $menuId = DB::table('data_menu')->insertGetId([
            'kategori_menu_id' => $kategoriId,
            'kode' => 'MNU-TEST-' . random_int(100, 999),
            'nama' => 'Menu Test',
            'harga' => 10000,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $areaId = DB::table('area_meja')->insertGetId([
            'kode' => 'AR-TEST',
            'nama' => 'Area Test',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $mejaId = DB::table('data_meja')->insertGetId([
            'area_meja_id' => $areaId,
            'kode' => 'MEJA-' . random_int(100, 999),
            'nama' => 'Meja Test',
            'nomor_meja' => '1',
            'kapasitas' => 4,
            'status' => 'tersedia',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['menu_id' => $menuId, 'meja_id' => $mejaId];
    }

    private function createOrder(int $menuId, int $mejaId, string $status, int $qty, int $price): PesananMasukEntity
    {
        $subtotal = $qty * $price;

        $order = PesananMasukEntity::query()->create([
            'kode' => 'ORD-TEST-' . random_int(1000, 9999),
            'data_meja_id' => $mejaId,
            'nama_pelanggan' => 'Pelanggan Test',
            'status' => $status,
            'subtotal' => $subtotal,
            'diskon' => 0,
            'pajak' => 0,
            'service_charge' => 0,
            'total' => $subtotal,
            'waktu_pesan' => now(),
            'waktu_bayar' => $status === 'paid' ? now() : null,
        ]);

        PesananMasukItemEntity::query()->create([
            'pesanan_id' => $order->id,
            'data_menu_id' => $menuId,
            'nama_menu' => 'Menu Test',
            'harga_satuan' => $price,
            'qty' => $qty,
            'subtotal' => $subtotal,
        ]);

        return $order->refresh();
    }
}
