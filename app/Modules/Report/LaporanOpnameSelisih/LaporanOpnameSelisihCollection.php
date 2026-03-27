<?php
namespace App\Modules\Report\LaporanOpnameSelisih;
class LaporanOpnameSelisihCollection { public static function toDashboard(array $d): array { return ['summary'=>$d['summary']??[],'details'=>$d['details']??[]]; } }
