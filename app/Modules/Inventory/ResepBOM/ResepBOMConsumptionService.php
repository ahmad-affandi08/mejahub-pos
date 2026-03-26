<?php

namespace App\Modules\Inventory\ResepBOM;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\MutasiStok\MutasiStokService;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use App\Support\PosDomainException;
use Illuminate\Support\Facades\DB;

class ResepBOMConsumptionService
{
    public function __construct(private readonly MutasiStokService $mutasiStokService)
    {
    }

    public function consumeForOrder(PesananMasukEntity $order, ?int $userId = null): void
    {
        if ($order->bom_consumed_at !== null) {
            return;
        }

        DB::transaction(function () use ($order, $userId) {
            $order->loadMissing('items');

            $menuIds = $order->items->pluck('data_menu_id')->filter()->unique()->values();
            if ($menuIds->isEmpty()) {
                return;
            }

            $recipes = ResepBOMEntity::query()
                ->where('is_active', true)
                ->whereIn('data_menu_id', $menuIds->all())
                ->get()
                ->groupBy('data_menu_id');

            foreach ($order->items as $item) {
                $recipeLines = $recipes->get($item->data_menu_id, collect());
                if ($recipeLines->isEmpty()) {
                    continue;
                }

                foreach ($recipeLines as $recipe) {
                    $bahan = BahanBakuEntity::query()->findOrFail($recipe->bahan_baku_id);

                    $qtyPerPortion = (float) $recipe->qty_kebutuhan;
                    $referencePortion = max(0.001, (float) $recipe->referensi_porsi);
                    $consumedQty = ($qtyPerPortion / $referencePortion) * (float) $item->qty;

                    $stokSebelum = (float) $bahan->stok_saat_ini;
                    if ($stokSebelum < $consumedQty) {
                        throw new PosDomainException('Stok bahan baku tidak cukup untuk menu ' . $item->nama_menu . '.');
                    }

                    $stokSesudah = $stokSebelum - $consumedQty;

                    $bahan->update([
                        'stok_saat_ini' => $stokSesudah,
                    ]);

                    $hargaSatuan = (float) $bahan->harga_beli_terakhir;
                    $this->mutasiStokService->record([
                        'bahan_baku_id' => $bahan->id,
                        'user_id' => $userId,
                        'reference_type' => 'POS_PAYMENT_BOM',
                        'reference_id' => $order->id,
                        'reference_code' => $order->kode,
                        'direction' => 'out',
                        'qty' => $consumedQty,
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'nilai_satuan' => $hargaSatuan,
                        'nilai_total' => $hargaSatuan * $consumedQty,
                        'catatan' => 'Konsumsi BOM menu ' . $item->nama_menu,
                    ]);
                }
            }

            $order->update([
                'bom_consumed_at' => now(),
            ]);
        });
    }
}
