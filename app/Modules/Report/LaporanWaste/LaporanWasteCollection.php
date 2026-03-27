<?php
namespace App\Modules\Report\LaporanWaste;
class LaporanWasteCollection { public static function toDashboard(array $d): array { return ['summary'=>$d['summary']??[],'by_category'=>$d['by_category']??[],'top_waste'=>$d['top_waste']??[]]; } }
