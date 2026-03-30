<?php

namespace App\Modules\Finance\Hutang;

use App\Modules\Finance\ArusKas\ArusKasService;
use App\Support\PaymentMethodCatalog;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HutangService
{
    public function __construct(private readonly ArusKasService $arusKasService)
    {
    }

    /**
     * Mendapatkan daftar hutang.
     */
    public function listHutang($filters = [])
    {
        $query = HutangEntity::query()->with('supplier');

        if (!empty($filters['search'])) {
            $query->where('kode', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(10);
    }

    /**
     * Memproses pembayaran cicilan/pelunasan hutang.
     */
    public function storePayment(HutangEntity $hutang, array $data)
    {
        DB::beginTransaction();
        try {
            $nominalBayar = $data['nominal_bayar'];

            if ($nominalBayar > $hutang->sisa_hutang) {
                throw new Exception("Nominal pembayaran melebihi sisa hutang.");
            }

            // Create pembayar record
            $payment = PembayaranHutangEntity::create([
                'kode' => 'PAY-' . strtoupper(Str::random(10)),
                'hutang_id' => $hutang->id,
                'tanggal_bayar' => $data['tanggal_bayar'] ?? now()->toDateString(),
                'nominal_bayar' => $nominalBayar,
                'metode_pembayaran' => PaymentMethodCatalog::normalizeFinanceMethod($data['metode_pembayaran'] ?? null),
                'akun_kas_id' => $data['akun_kas_id'] ?? null,
                'referensi' => $data['referensi'] ?? null,
                'catatan' => $data['catatan'] ?? null,
            ]);

            $metodePembayaran = PaymentMethodCatalog::normalizeFinanceMethod($data['metode_pembayaran'] ?? null);

            $this->arusKasService->upsertSourceJournal('hutang_payment', (int) $payment->id, [
                'tanggal' => optional($payment->tanggal_bayar)?->toDateString() ?? now()->toDateString(),
                'jenis_akun' => PaymentMethodCatalog::resolveFinanceAccountByMethod($metodePembayaran),
                'jenis_arus' => 'out',
                'referensi_kode' => $payment->kode,
                'kategori' => 'pelunasan_hutang',
                'deskripsi' => 'Pembayaran hutang supplier ' . $hutang->kode,
                'nominal' => (float) $nominalBayar,
                'status' => 'posted',
                'created_by' => $payment->created_by,
                'catatan' => $payment->catatan,
            ], true);

            // Update Hutang
            $hutang->sisa_hutang -= $nominalBayar;

            if ($hutang->sisa_hutang <= 0) {
                $hutang->status = 'paid';
                $hutang->sisa_hutang = 0;
            } elseif ($hutang->sisa_hutang < $hutang->nominal_hutang) {
                $hutang->status = 'partial';
            }

            $hutang->save();

            DB::commit();
            return $payment;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
