<?php

namespace Database\Seeders;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\ResepBOM\ResepBOMEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ResepBOMMakananSeeder extends Seeder
{
	use WithoutModelEvents;

	public function run(): void
	{
		$menuMap = DataMenuEntity::query()
			->select(['id', 'nama', 'kode'])
			->with('kategori:id,nama')
			->get()
			->keyBy(fn (DataMenuEntity $menu) => $this->normalize($menu->nama));

		$bahanMap = BahanBakuEntity::query()
			->select(['id', 'nama'])
			->get()
			->keyBy(fn (BahanBakuEntity $bahan) => $this->normalize($bahan->nama));

		$resep = [
			"NASI GORENG LI'L ESCAPE" => [
				['bahan' => 'Beras', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Telur', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Bakso Sapi', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Nugget Sosis', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 16, 'satuan' => 'GR'],
				['bahan' => 'Minyak Goreng', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Loncang', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Bawang Goreng', 'qty' => 7, 'satuan' => 'GR'],
				['bahan' => 'Minyak Wijen', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Minyak Ikan', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Micin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Kerupuk Udang', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Selada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Timun', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Tomate', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Kecap', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Kecap Asin', 'qty' => 10, 'satuan' => 'ML'],
			],
			'NASI GORENG LOMBOK IJO' => [
				['bahan' => 'Cabe Ijo Panjang', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Beras', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Telur', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Nugget Sosis', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 16, 'satuan' => 'GR'],
				['bahan' => 'Minyak Goreng', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Loncang', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Bawang Goreng', 'qty' => 7, 'satuan' => 'GR'],
				['bahan' => 'Minyak Wijen', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Minyak Ikan', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Kecap Asin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Micin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Kerupuk Udang', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Selada', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Timun', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Tomate', 'qty' => 10, 'satuan' => 'GR'],
			],
			'CHICKEN KARAGE NANBAN' => [
				['bahan' => 'Beras', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Paha Fillet', 'qty' => 80, 'satuan' => 'GR'],
				['bahan' => 'Tepung Segitiga', 'qty' => 50, 'satuan' => 'GR'],
				['bahan' => 'Tepung Maizena', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Kubis Ungu', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Koll Putih', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Wortel', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Mayonaise', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Telur', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Skm', 'qty' => 50, 'satuan' => 'ML'],
				['bahan' => 'Mustard', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 1, 'satuan' => 'GR'],
			],
			'RICE BOWL KARAGE NANBAN MATAH' => [
				['bahan' => 'Beras', 'qty' => 120, 'satuan' => 'GR'],
				['bahan' => 'Paha Fillet', 'qty' => 80, 'satuan' => 'GR'],
				['bahan' => 'Tepung Segitiga', 'qty' => 40, 'satuan' => 'GR'],
				['bahan' => 'Tepung Maizena', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Kubis Ungu', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Koll Putih', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Wortel', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Mayonaise', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Telur', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Skm', 'qty' => 50, 'satuan' => 'ML'],
				['bahan' => 'Mustard', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 2, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Cabe Rawit', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Merah', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Terasi', 'qty' => 1, 'satuan' => 'GR'],
			],
			'SPAGHETTI BOLOGNESE' => [
				['bahan' => 'Spaghetti', 'qty' => 100, 'satuan' => 'GR'],
				['bahan' => 'Souce Bolognese', 'qty' => 40, 'satuan' => 'GR'],
				['bahan' => 'Souce Tomat', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Roti Tawar', 'qty' => 25, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Mentega', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Tomate Paste', 'qty' => 2, 'satuan' => 'GR'],
			],
			'FETTUCINE CARBONARA' => [
				['bahan' => 'Fettucine', 'qty' => 100, 'satuan' => 'GR'],
				['bahan' => 'Freshmilk', 'qty' => 50, 'satuan' => 'ML'],
				['bahan' => 'Smoked Beef', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Roti Tawar', 'qty' => 25, 'satuan' => 'GR'],
				['bahan' => 'Mentega', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Minyak Goreng', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Keju Cheddar', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Oregano', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
			],
			'SPAGHETTI AGLIO OLIO' => [
				['bahan' => 'Spaghetti', 'qty' => 100, 'satuan' => 'GR'],
				['bahan' => 'Smoked Beef', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Cabe Rawit', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Minyak Goreng', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Ayam Filed Dada', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Roti Tawar', 'qty' => 25, 'satuan' => 'GR'],
				['bahan' => 'Mentega', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 10, 'satuan' => 'GR'],
			],
			"AYAM BAKAR LI'L ESCAPE" => [
				['bahan' => 'Beras', 'qty' => 200, 'satuan' => 'GR'],
				['bahan' => 'Ayam Filed Dada', 'qty' => 100, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Cabe Keriting Merah', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Cabe Rawit', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Bawang Merah', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Micin', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Jinten', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Pala', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Gula Pasir', 'qty' => 2, 'satuan' => 'GR'],
				['bahan' => 'Gula Jawa', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Loncang', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Tomate', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Terasi', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Kecap', 'qty' => 3, 'satuan' => 'ML'],
				['bahan' => 'Cengkeh', 'qty' => 2, 'satuan' => 'GR'],
			],
			"AYAM GORENG LI'L ESCAPE" => [
				['bahan' => 'Ayam Filed Dada', 'qty' => 200, 'satuan' => 'GR'],
				['bahan' => 'Beras', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Minyak Goreng', 'qty' => 100, 'satuan' => 'ML'],
				['bahan' => 'Bumbu Pawon', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Merah', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Kunyit Bubuk', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Ketumbar', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Micin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 8, 'satuan' => 'GR'],
				['bahan' => 'Telur', 'qty' => 50, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 3, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 3, 'satuan' => 'GR'],
				['bahan' => 'Jinten', 'qty' => 3, 'satuan' => 'GR'],
				['bahan' => 'Cabe Rawit', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Bawang Goreng', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Gula Pasir', 'qty' => 8, 'satuan' => 'GR'],
				['bahan' => 'Loncang', 'qty' => 15, 'satuan' => 'GR'],
			],
			'CREAMY CRISPY CHICKEN MUSHROOM' => [
				['bahan' => 'Ayam Filed Dada', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Jamur Champignon', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Mentega', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Freshmilk', 'qty' => 20, 'satuan' => 'ML'],
				['bahan' => 'Saori Saus Tiram', 'qty' => 40, 'satuan' => 'GR'],
				['bahan' => 'Bombay', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 8, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Roti Tawar', 'qty' => 20, 'satuan' => 'GR'],
			],
			'NORI FRIES' => [
				['bahan' => 'Frenchfries Krinkle', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Nori', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 3, 'satuan' => 'GR'],
				['bahan' => 'Souce Tomat', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Souce Chili', 'qty' => 15, 'satuan' => 'GR'],
			],
			'CIRENG' => [
				['bahan' => 'Cireng', 'qty' => 5, 'satuan' => 'PCS'],
				['bahan' => 'Cabe Rawit', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Souce Tomat', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Mineral Water', 'qty' => 10, 'satuan' => 'ML'],
				['bahan' => 'Garam', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Royco', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Micin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Gula Pasir', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Gula Jawa', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 10, 'satuan' => 'GR'],
			],
			"MIX LI'L ESCAPE" => [
				['bahan' => 'Frenchfries Mix', 'qty' => 120, 'satuan' => 'GR'],
				['bahan' => 'Nugget Sosis', 'qty' => 3, 'satuan' => 'PCS'],
				['bahan' => 'Cireng', 'qty' => 3, 'satuan' => 'PCS'],
				['bahan' => 'Ayam Filed Dada', 'qty' => 70, 'satuan' => 'GR'],
				['bahan' => 'Tepung Segitiga', 'qty' => 30, 'satuan' => 'GR'],
				['bahan' => 'Tepung Maizena', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Souce Chili', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Mayonaise', 'qty' => 15, 'satuan' => 'GR'],
			],
			'CORDON BLEU' => [
				['bahan' => 'Ayam Filed Dada', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Mozarella', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Smoked Beef', 'qty' => 6, 'satuan' => 'GR'],
				['bahan' => 'Tepung Segitiga', 'qty' => 25, 'satuan' => 'GR'],
				['bahan' => 'Telur', 'qty' => 50, 'satuan' => 'GR'],
				['bahan' => 'Jamur Champignon', 'qty' => 25, 'satuan' => 'GR'],
				['bahan' => 'Saori Saus Tiram', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bombay', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Tepung Panir', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Selada', 'qty' => 6, 'satuan' => 'GR'],
				['bahan' => 'Wortel', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Timun', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 7, 'satuan' => 'GR'],
				['bahan' => 'Frenchfries Krinkle', 'qty' => 6, 'satuan' => 'GR'],
			],
			'CHICKEN STEAK' => [
				['bahan' => 'Ayam Filed Dada', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Telur', 'qty' => 50, 'satuan' => 'GR'],
				['bahan' => 'Tepung Segitiga', 'qty' => 20, 'satuan' => 'GR'],
				['bahan' => 'Tepung Panir', 'qty' => 30, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Jamur Champignon', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Saori Saus Tiram', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Freshmilk', 'qty' => 30, 'satuan' => 'ML'],
				['bahan' => 'Bawang Putih', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bombay', 'qty' => 6, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Frenchfries Krinkle', 'qty' => 6, 'satuan' => 'GR'],
				['bahan' => 'Selada', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Wortel', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Timun', 'qty' => 10, 'satuan' => 'GR'],
			],
			'GRILLED CHICKEN STEAK' => [
				['bahan' => 'Ayam Filed Dada', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Jamur Champignon', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Saori Saus Tiram', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bombay', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Oregano', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Freshmilk', 'qty' => 6, 'satuan' => 'ML'],
				['bahan' => 'Frenchfries Krinkle', 'qty' => 1, 'satuan' => 'GR'],
				['bahan' => 'Pure Raw Honey', 'qty' => 30, 'satuan' => 'ML'],
				['bahan' => 'Wijen Sangrai', 'qty' => 80, 'satuan' => 'GR'],
				['bahan' => 'Lemon Fruit', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Selada', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Wortel', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Timun', 'qty' => 10, 'satuan' => 'GR'],
			],
			'RICE BOWL TERIYAKI' => [
				['bahan' => 'Beras', 'qty' => 120, 'satuan' => 'GR'],
				['bahan' => 'Ayam Filed Dada', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Saori Saus Teriyaki', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Kecap Asin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Kecap', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Wijen Sangrai', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Kubis Ungu', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Koll Putih', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Wortel', 'qty' => 10, 'satuan' => 'GR'],
			],
			'RICE BOWL KATSU MATAH' => [
				['bahan' => 'Beras', 'qty' => 120, 'satuan' => 'GR'],
				['bahan' => 'Ayam Filed Dada', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Tepung Segitiga', 'qty' => 30, 'satuan' => 'GR'],
				['bahan' => 'Tepung Panir', 'qty' => 30, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Cabe Rawit', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Terasi', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Bawang Merah', 'qty' => 10, 'satuan' => 'GR'],
			],
			'RICE BOWL AYAM HONGKONG' => [
				['bahan' => 'Beras', 'qty' => 120, 'satuan' => 'GR'],
				['bahan' => 'Ayam Filed Dada', 'qty' => 150, 'satuan' => 'GR'],
				['bahan' => 'Bawang Merah', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Bawang Putih', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Bumbu Pawon', 'qty' => 3, 'satuan' => 'GR'],
				['bahan' => 'Loncang', 'qty' => 3, 'satuan' => 'GR'],
				['bahan' => 'Kecap', 'qty' => 7, 'satuan' => 'GR'],
				['bahan' => 'Kecap Asin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Minyak Wijen', 'qty' => 10, 'satuan' => 'ML'],
				['bahan' => 'Cuka', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Saori Saus Tiram', 'qty' => 5, 'satuan' => 'ML'],
				['bahan' => 'Royco', 'qty' => 10, 'satuan' => 'GR'],
				['bahan' => 'Lada', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Garam', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Micin', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Gula Pasir', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Cabe Rawit', 'qty' => 5, 'satuan' => 'GR'],
				['bahan' => 'Tomate', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Souce Chili', 'qty' => 15, 'satuan' => 'GR'],
				['bahan' => 'Lemon Fruit', 'qty' => 10, 'satuan' => 'GR'],
			],
		];

		foreach ($resep as $namaMenu => $items) {
			$menu = $menuMap->get($this->normalize($namaMenu));

			if (!$menu) {
				throw new \RuntimeException('Menu tidak ditemukan untuk BOM makanan: ' . $namaMenu);
			}

			foreach ($items as $index => $item) {
				$bahan = $bahanMap->get($this->normalize($item['bahan']));
				$kode = $this->generateKode($menu->kode, $menu->id, $index + 1);

				if (!$bahan) {
					throw new \RuntimeException('Bahan baku tidak ditemukan di master: ' . $item['bahan'] . ' (menu: ' . $namaMenu . ')');
				}

				ResepBOMEntity::query()->withTrashed()->updateOrCreate(
					[
						'kode' => $kode,
					],
					[
						'data_menu_id' => $menu->id,
						'bahan_baku_id' => $bahan->id,
						'kode' => $kode,
						'qty_kebutuhan' => (float) $item['qty'],
						'satuan' => Str::upper((string) $item['satuan']),
						'referensi_porsi' => 1,
						'catatan' => 'Seeder BOM makanan (sumber: sheet HPP menu)',
						'is_active' => true,
						'deleted_at' => null,
					]
				);
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
}
