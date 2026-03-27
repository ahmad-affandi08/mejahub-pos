<?php
namespace App\Modules\Report\LaporanVoidRefund;
class LaporanVoidRefundCollection { public static function toDashboard(array $d): array { return ['summary'=>$d['summary']??[],'void_per_kasir'=>$d['void_per_kasir']??[],'refund_per_kasir'=>$d['refund_per_kasir']??[],'top_alasan_void'=>$d['top_alasan_void']??[]]; } }
