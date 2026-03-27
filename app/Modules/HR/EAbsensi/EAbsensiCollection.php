<?php

namespace App\Modules\HR\EAbsensi;

use Illuminate\Support\Collection;

class EAbsensiCollection
{
	public static function toMobilePayload(array $payload): array
	{
		return [
			'profile' => $payload['profile'],
			'shift_info' => $payload['shift_info'],
			'weekly_summary' => $payload['weekly_summary'],
			'records' => $payload['records'],
			'calendar_data' => $payload['calendar_data'] ?? ['month_label' => '-', 'month_key' => '-', 'days' => [], 'summary' => []],
			'request_history' => $payload['request_history'],
			'incoming_shift_swap_requests' => $payload['incoming_shift_swap_requests'],
			'coworkers' => $payload['coworkers'],
			'today_status' => $payload['today_status'],
			'geo_policy' => $payload['geo_policy'],
		];
	}

	public static function formatRecords(Collection $records): array
	{
		return $records
			->map(fn (EAbsensiEntity $item) => self::toRecordItem($item))
			->values()
			->all();
	}

	public static function toRecordItem(EAbsensiEntity $item): array
	{
		$timeValue = $item->jenis_absen === 'keluar'
			? ($item->jam_keluar ?: optional($item->created_at)->format('H:i:s'))
			: ($item->jam_masuk ?: optional($item->created_at)->format('H:i:s'));

		$statusVerifier = $item->status_verifikasi_wajah === 'verified'
			? 'Lolos Sistem'
			: ($item->status_verifikasi_wajah === 'rejected' ? 'Verifikasi Ditolak' : 'Tinjauan Manual');

		$radiusLabel = $item->dalam_radius === false
			? 'Di Luar ' . (($item->radius_meter ?? 0) > 0 ? $item->radius_meter . 'm' : 'radius')
			: 'Di Dalam ' . (($item->radius_meter ?? 0) > 0 ? $item->radius_meter . 'm' : 'radius');

		$displayType = $item->jenis_absen === 'keluar'
			? 'Pulang'
			: ucfirst((string) $item->jenis_absen);

		return [
			'id' => $item->id,
			'employeeName' => $item->pegawai?->nama,
			'employeeRole' => $item->pegawai?->jabatan,
			'dateShort' => strtoupper(optional($item->tanggal)->format('d M Y') ?? '-'),
			'dateLong' => optional($item->tanggal)->format('d M Y') ?? '-',
			'time' => $timeValue ?: '-',
			'shift' => $item->shift?->nama ?: '-',
			'type' => $displayType,
			'status' => ucfirst((string) $item->status),
			'method' => $item->metode_absen === 'face' ? 'Wajah' : ucfirst((string) $item->metode_absen),
			'source' => ucwords(str_replace('-', ' ', (string) $item->sumber_absen)),
			'reference' => $item->kode ?: 'ABS-' . optional($item->tanggal)->format('Ymd') . '-' . str_pad((string) $item->id, 3, '0', STR_PAD_LEFT),
			'location' => $item->lokasi_absen ?: ($item->pegawai?->alamat ?: '-'),
			'latitude' => $item->latitude !== null ? (string) $item->latitude : '-',
			'longitude' => $item->longitude !== null ? (string) $item->longitude : '-',
			'radius' => $radiusLabel,
			'score' => $item->skor_wajah !== null ? number_format((float) $item->skor_wajah, 1) . '%' : '-',
			'verifier' => $statusVerifier,
			'image' => $item->foto_absen,
		];
	}
}
