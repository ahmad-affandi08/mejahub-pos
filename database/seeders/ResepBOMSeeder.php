<?php

namespace Database\Seeders;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\ResepBOM\ResepBOMEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ResepBOMSeeder extends Seeder
{
	use WithoutModelEvents;

	/**
	 * Run the database seeds.
	 */
	public function run(): void
	{
		$kategoriMinuman = [
			'COFFEE',
			'MOCKTAIL COFFE',
			'TEA',
			'Non Coffee',
		];

		// Pastikan bahan yang belum ada tapi dipakai resep minuman tetap tersedia.
		$this->ensureBahanBaku('Orange Juice Buavita', 'ML');

		$menuMap = DataMenuEntity::query()
			->select(['id', 'nama', 'kode', 'kategori_menu_id'])
			->with('kategori:id,nama')
			->get()
			->keyBy(fn (DataMenuEntity $menu) => $this->normalize($menu->nama));

		$bahanMap = BahanBakuEntity::query()
			->select(['id', 'nama'])
			->get()
			->keyBy(fn (BahanBakuEntity $bahan) => $this->normalize($bahan->nama));

		$resepMinuman = [
			'AMERICANO' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'CAPPUCINO' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Freshmilk', 'qty' => 160, 'satuan' => 'ML'],
				['bahan' => 'Skm', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'CAFFELATTE' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Freshmilk', 'qty' => 160, 'satuan' => 'ML'],
				['bahan' => 'Skm', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'MOCHACINO' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 18, 'satuan' => 'GRAM'],
				['bahan' => 'Freshmilk', 'qty' => 120, 'satuan' => 'ML'],
				['bahan' => 'Chocolate Dark', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Skm', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'KOPI SUSU GULA AREN' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Freshmilk', 'qty' => 160, 'satuan' => 'ML'],
				['bahan' => 'Skm', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Aren', 'qty' => 11, 'satuan' => 'ML'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'KOPSU GONDANG' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Freshmilk', 'qty' => 160, 'satuan' => 'ML'],
				['bahan' => 'Skm', 'qty' => 9, 'satuan' => 'GRAM'],
				['bahan' => 'Aren', 'qty' => 15, 'satuan' => 'ML'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'CHOCOLATE' => [
				['bahan' => 'Freshmilk', 'qty' => 100, 'satuan' => 'ML'],
				['bahan' => 'Chocolate Dark', 'qty' => 20, 'satuan' => 'GRAM'],
				['bahan' => 'Creamer', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Skm', 'qty' => 5, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'RED VELVET' => [
				['bahan' => 'Freshmilk', 'qty' => 100, 'satuan' => 'ML'],
				['bahan' => 'Red Velvet Powder', 'qty' => 25, 'satuan' => 'GRAM'],
				['bahan' => 'Creamer', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Skm', 'qty' => 5, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'TARO' => [
				['bahan' => 'Freshmilk', 'qty' => 100, 'satuan' => 'ML'],
				['bahan' => 'Taro Powder', 'qty' => 25, 'satuan' => 'GRAM'],
				['bahan' => 'Creamer', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Skm', 'qty' => 5, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'MATCHA' => [
				['bahan' => 'Freshmilk', 'qty' => 100, 'satuan' => 'ML'],
				['bahan' => 'Matca', 'qty' => 25, 'satuan' => 'GRAM'],
				['bahan' => 'Creamer', 'qty' => 10, 'satuan' => 'GRAM'],
				['bahan' => 'Skm', 'qty' => 5, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'LEMONADE AMERICANO' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Orange Juice Buavita', 'qty' => 50, 'satuan' => 'ML'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Lemon  Garnish', 'qty' => 2, 'satuan' => 'PCS'],
				['bahan' => 'Daun Mint', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'TRIPLE PEACH AMERICANO' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Orange Juice Buavita', 'qty' => 100, 'satuan' => 'ML'],
				['bahan' => 'Peach Syrup', 'qty' => 15, 'satuan' => 'ML'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Daun Mint', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'MONT BLACK COFFEE' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Orange Juice Buavita', 'qty' => 20, 'satuan' => 'ML'],
				['bahan' => 'Rich\'S Gold', 'qty' => 20, 'satuan' => 'ML'],
				['bahan' => 'Freshmilk', 'qty' => 15, 'satuan' => 'ML'],
				['bahan' => 'Vanila Syrup', 'qty' => 10, 'satuan' => 'ML'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'ICE BERRY COFFEE' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Straberry Syrup', 'qty' => 12, 'satuan' => 'ML'],
				['bahan' => 'Straberry Garnish', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Daun Mint', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'BUTTERSCOTCH SEASALT' => [
				['bahan' => 'Butterscotch Syrup', 'qty' => 20, 'satuan' => 'ML'],
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Skm', 'qty' => 20, 'satuan' => 'GRAM'],
				['bahan' => 'Freshmilk', 'qty' => 100, 'satuan' => 'ML'],
				['bahan' => 'Seasalt', 'qty' => 1, 'satuan' => 'GRAM'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'LYCHEE TEA' => [
				['bahan' => 'Lychee Syrup', 'qty' => 15, 'satuan' => 'ML'],
				['bahan' => 'Simple Syrup', 'qty' => 20, 'satuan' => 'ML'],
				['bahan' => 'Tea Mix', 'qty' => 100, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Lychee Garnish', 'qty' => 2, 'satuan' => 'GRAM'],
				['bahan' => 'Daun Mint', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'BERRY TEA' => [
				['bahan' => 'Straberry Syrup', 'qty' => 15, 'satuan' => 'ML'],
				['bahan' => 'Simple Syrup', 'qty' => 10, 'satuan' => 'ML'],
				['bahan' => 'Tea Mix', 'qty' => 100, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Straberry Garnish', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Daun Mint', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'BLACK TEA & LEMON TEA' => [
				['bahan' => 'Tea Mix', 'qty' => 50, 'satuan' => 'GRAM'],
				['bahan' => 'Simple Syrup', 'qty' => 10, 'satuan' => 'ML'],
				['bahan' => 'Lemon  Garnish', 'qty' => 2, 'satuan' => 'PCS'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'PEACH TEA' => [
				['bahan' => 'Peach Syrup', 'qty' => 15, 'satuan' => 'ML'],
				['bahan' => 'Simple Syrup', 'qty' => 10, 'satuan' => 'ML'],
				['bahan' => 'Tea Mix', 'qty' => 50, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 300, 'satuan' => 'ML'],
				['bahan' => 'Daun Mint', 'qty' => 1, 'satuan' => 'PCS'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'VIETNAM COFFEE' => [
				['bahan' => 'Skm', 'qty' => 35, 'satuan' => 'GRAM'],
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 130, 'satuan' => 'ML'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
			'TUBRUK' => [
				['bahan' => 'Full Arabica Coffee', 'qty' => 15, 'satuan' => 'GRAM'],
				['bahan' => 'Mineral Water', 'qty' => 130, 'satuan' => 'ML'],
				['bahan' => 'Wraping', 'qty' => 1, 'satuan' => 'PCS'],
			],
		];

		foreach ($resepMinuman as $namaMenu => $items) {
			$menu = $menuMap->get($this->normalize($namaMenu));

			if (!$menu) {
				throw new \RuntimeException('Menu tidak ditemukan untuk resep BOM: ' . $namaMenu);
			}

			$kategoriMenu = $menu->kategori?->nama;
			if (!in_array($kategoriMenu, $kategoriMinuman, true)) {
				throw new \RuntimeException('Kategori menu bukan kategori minuman: ' . $namaMenu . ' (' . $kategoriMenu . ')');
			}

			foreach ($items as $index => $item) {
				$bahan = $bahanMap->get($this->normalize($item['bahan']));

				if (!$bahan) {
					$bahan = $this->ensureBahanBaku($item['bahan'], $item['satuan']);
					$bahanMap->put($this->normalize($bahan->nama), $bahan);
				}

				$kode = $this->generateKode($menu->kode, $menu->id, $index + 1);

				$resep = ResepBOMEntity::query()
					->withTrashed()
					->updateOrCreate(
						[
							'data_menu_id' => $menu->id,
							'bahan_baku_id' => $bahan->id,
						],
						[
							'kode' => $kode,
							'qty_kebutuhan' => (float) $item['qty'],
							'satuan' => Str::upper((string) $item['satuan']),
							'referensi_porsi' => 1,
							'catatan' => 'Seeder BOM minuman',
							'is_active' => true,
							'deleted_at' => null,
						]
					);

				if ($resep->trashed()) {
					$resep->restore();
				}
			}
		}
	}

	private function generateKode(?string $menuKode, int $menuId, int $urutan): string
	{
		$prefix = $menuKode ? Str::upper($menuKode) : 'MENU' . $menuId;

		return Str::limit(sprintf('BOM-%s-%02d', $prefix, $urutan), 40, '');
	}

	private function normalize(string $value): string
	{
		return Str::lower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
	}

	private function ensureBahanBaku(string $nama, string $satuan): BahanBakuEntity
	{
		return BahanBakuEntity::query()->updateOrCreate(
			['nama' => $nama],
			[
				'satuan' => Str::upper($satuan),
				'satuan_kecil' => Str::upper($satuan),
				'default_satuan_beli' => Str::upper($satuan),
				'konversi_besar_ke_kecil' => 1,
				'harga_beli_terakhir' => 0,
				'stok_minimum' => 0,
				'stok_saat_ini' => 0,
				'keterangan' => 'Auto dibuat dari ResepBOMSeeder',
				'is_active' => true,
			]
		);
	}
}
